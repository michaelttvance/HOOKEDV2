// Server-only Twilio helpers for webhook handlers (no auth context).
// Uses account creds from env; the "From" number is the company's Twilio number.

export async function sendTwilioSms(opts: {
  to: string;
  from: string;
  body: string;
}): Promise<{ ok: boolean; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return { ok: false, error: "twilio_not_configured" };
  if (!opts.from) return { ok: false, error: "no_from_number" };

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: opts.to, From: opts.from, Body: opts.body }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("[twilio] send failed", res.status, t);
      return { ok: false, error: `twilio_${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[twilio] send exception", err);
    return { ok: false, error: err instanceof Error ? err.message : "send_failed" };
  }
}

/** Minimal TwiML XML response helper. */
export function twiml(body: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml" },
  });
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
