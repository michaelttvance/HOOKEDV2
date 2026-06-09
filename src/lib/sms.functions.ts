import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const toE164 = (raw: string): string => {
  const trimmed = raw.trim();
  if (/^\+[1-9]\d{6,14}$/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  throw new Error(`Phone number must be in E.164 format or a 10-digit US number, got "${raw}"`);
};

const SendSmsInput = z.object({
  to: z.string().transform(toE164),
  body: z.string().min(1).max(1600),
});

export const sendSms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SendSmsInput.parse(data))
  .handler(async ({ data }) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !from) {
      throw new Error("Twilio is not configured");
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = btoa(`${accountSid}:${authToken}`);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: data.to,
        From: from,
        Body: data.body,
      }),
    });

    const payload = (await res.json()) as { sid?: string; message?: string; code?: number };

    if (!res.ok) {
      console.error("Twilio send failed", res.status, payload);
      throw new Error(payload.message ?? `Twilio request failed (${res.status})`);
    }

    return { sid: payload.sid!, to: data.to };
  });
