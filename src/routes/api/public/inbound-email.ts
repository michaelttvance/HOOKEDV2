import { createFileRoute } from "@tanstack/react-router";

// Resend Inbound webhook (or any compatible inbound-email forwarder).
// Accepts flexible payloads: { to, from, subject, text, html } either at the
// top level or wrapped in { data: ... } (Resend webhook event style).
export const Route = createFileRoute("/api/public/inbound-email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Read raw body first so we can verify the webhook signature.
        const rawBody = await request.text();

        // Optional signature verification. Resend signs inbound webhooks using
        // Svix headers (svix-id, svix-timestamp, svix-signature). When
        // RESEND_WEBHOOK_SECRET is configured we enforce it; otherwise we
        // accept the request (useful for local/dev testing).
        const { getServerConfig } = await import("@/lib/config.server");
        const cfg = getServerConfig();
        if (cfg.resendWebhookSecret) {
          const ok = await verifySvixSignature(request, rawBody, cfg.resendWebhookSecret);
          if (!ok) return new Response("Invalid signature", { status: 401 });
        }

        let raw: any;
        try {
          raw = JSON.parse(rawBody);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const p = raw?.data ?? raw ?? {};

        // Normalize fields across likely payload shapes
        const toAddress = pickAddress(p.to ?? p.toAddress ?? p.recipient);
        const fromAddress = pickAddress(p.from ?? p.fromAddress ?? p.sender);
        const subject = typeof p.subject === "string" ? p.subject : null;
        const bodyText: string | null =
          typeof p.text === "string" ? p.text :
          typeof p.bodyText === "string" ? p.bodyText :
          typeof p.html === "string" ? stripHtml(p.html) : null;
        const bodyHtml = typeof p.html === "string" ? p.html : null;

        if (!toAddress || !fromAddress) {
          return new Response("Missing to/from", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { parseInboundEmail, createJobFromInboundParse } = await import("@/lib/inbound.server");

        // Match the recipient to a company by inbound_email_code.
        // Expected format: dispatch-{code}@inbound.hookaidashboard.com (case-insensitive).
        const code = extractInboundCode(toAddress);
        let companyId: string | null = null;
        if (code) {
          const { data: c } = await supabaseAdmin
            .from("companies")
            .select("id")
            .eq("inbound_email_code", code)
            .maybeSingle();
          companyId = (c?.id as string | null) ?? null;
        }

        // Log first so unmatched/failed are visible to admins later.
        const { data: row, error: insErr } = await supabaseAdmin
          .from("inbound_emails")
          .insert({
            company_id: companyId,
            to_address: toAddress,
            from_address: fromAddress,
            subject,
            body_text: bodyText,
            body_html: bodyHtml,
            status: companyId ? "received" : "unmatched",
          })
          .select("id")
          .single();
        if (insErr || !row) {
          console.error("[inbound-email] log insert failed", insErr);
          return new Response("Log failed", { status: 500 });
        }

        if (!companyId) {
          return Response.json({ ok: true, status: "unmatched", id: row.id });
        }

        // Parse
        const parseResult = await parseInboundEmail({ subject, bodyText, fromAddress });
        if (!parseResult.ok) {
          await supabaseAdmin
            .from("inbound_emails")
            .update({ status: "failed", error: parseResult.error })
            .eq("id", row.id);
          return Response.json({ ok: false, id: row.id, error: parseResult.error });
        }

        await supabaseAdmin
          .from("inbound_emails")
          .update({ status: "parsed", parsed_json: parseResult.parsed as any })
          .eq("id", row.id);

        // Attempt auto-create
        const created = await createJobFromInboundParse({
          supabaseAdmin,
          companyId,
          parsed: parseResult.parsed,
          subject,
        });
        if (!created.ok) {
          await supabaseAdmin
            .from("inbound_emails")
            .update({ error: created.error })
            .eq("id", row.id);
          return Response.json({ ok: true, id: row.id, status: "parsed", warning: created.error });
        }

        await supabaseAdmin
          .from("inbound_emails")
          .update({ status: "job_created", job_id: created.jobId, error: null })
          .eq("id", row.id);

        return Response.json({ ok: true, id: row.id, jobId: created.jobId, status: "job_created" });
      },
    },
  },
});

function pickAddress(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "string") return v.trim().toLowerCase();
  if (Array.isArray(v)) {
    const first = v[0];
    if (typeof first === "string") return first.trim().toLowerCase();
    if (first && typeof first === "object" && typeof (first as any).email === "string") {
      return ((first as any).email as string).trim().toLowerCase();
    }
  }
  if (typeof v === "object" && v && typeof (v as any).email === "string") {
    return ((v as any).email as string).trim().toLowerCase();
  }
  return null;
}

function extractInboundCode(addr: string): string | null {
  // dispatch-{code}@...
  const m = addr.match(/^dispatch[-+]([a-z0-9]{4,32})@/i);
  if (m) return m[1].toLowerCase();
  // Also accept the local-part being just {code}@inbound...
  const m2 = addr.match(/^([a-z0-9]{8})@/i);
  if (m2) return m2[1].toLowerCase();
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Verify a Resend (Svix) webhook signature.
// Header `svix-signature` is a space-separated list of `v1,<base64sig>` entries.
// The signed payload is `${svix_id}.${svix_timestamp}.${body}` and the secret
// is `whsec_<base64>` — the base64 portion is the HMAC-SHA256 key.
async function verifySvixSignature(
  request: Request,
  body: string,
  secret: string,
): Promise<boolean> {
  try {
    const id = request.headers.get("svix-id");
    const timestamp = request.headers.get("svix-timestamp");
    const signature = request.headers.get("svix-signature");
    if (!id || !timestamp || !signature) return false;

    const secretB64 = secret.startsWith("whsec_") ? secret.slice(6) : secret;
    const keyBytes = base64ToBytes(secretB64);
    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes.buffer.slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength) as ArrayBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const payload = new TextEncoder().encode(`${id}.${timestamp}.${body}`);
    const sigBytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, payload));
    const expected = bytesToBase64(sigBytes);

    const provided = signature
      .split(" ")
      .map((p) => p.trim())
      .filter((p) => p.startsWith("v1,"))
      .map((p) => p.slice(3));
    return provided.some((p) => timingSafeEqualStr(p, expected));
  } catch {
    return false;
  }
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
