import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/approval-action")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");
        const action = url.searchParams.get("action");

        if (!token || (action !== "approve" && action !== "reject")) {
          return htmlPage("Invalid link", "This approval link is malformed.");
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { applyApproval } = await import("@/lib/approval.functions");

        const { data: tk, error: tkErr } = await supabaseAdmin
          .from("approval_tokens")
          .select("token, profile_id, expires_at, used_at")
          .eq("token", token)
          .maybeSingle();

        if (tkErr || !tk) {
          return htmlPage("Invalid link", "This approval link is invalid or has expired.");
        }
        if (tk.used_at) {
          return htmlPage("Already used", "This approval link has already been used.");
        }
        if (new Date(tk.expires_at as string) < new Date()) {
          return htmlPage("Expired", "This approval link has expired. Use the /admin page instead.");
        }

        try {
          await applyApproval(supabaseAdmin, tk.profile_id as string, action);
          await supabaseAdmin
            .from("approval_tokens")
            .update({ used_at: new Date().toISOString() })
            .eq("token", token);
        } catch (e) {
          console.error("[approval-action] apply failed", e);
          return htmlPage("Error", "Something went wrong applying the action.");
        }

        return htmlPage(
          action === "approve" ? "Approved" : "Rejected",
          action === "approve"
            ? "The applicant has been approved and notified by email."
            : "The applicant has been rejected and notified by email.",
        );
      },
    },
  },
});

function htmlPage(title: string, message: string) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"/><title>${title} — Hooked</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0b0f1a;color:#e5e7eb;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;}
.card{max-width:440px;background:#111827;border:1px solid #1f2937;border-radius:12px;padding:32px;text-align:center;}
h1{margin:0 0 12px;font-size:22px;}
p{margin:0 0 20px;color:#9ca3af;line-height:1.6;}
a{display:inline-block;background:#3b82f6;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;}
</style></head><body><div class="card"><h1>${title}</h1><p>${message}</p><a href="https://hookaidashboard.com/admin">Open admin</a></div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
