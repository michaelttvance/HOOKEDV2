import { createFileRoute } from "@tanstack/react-router";
import { twiml, escapeXml } from "@/lib/twilio.server";

// Twilio Voice webhook ("A call comes in"). Rings the operator's forward
// number; if they don't pick up, the action callback handles recovery.
export const Route = createFileRoute("/api/public/twilio-voice")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = new URLSearchParams(await request.text());
        const to = form.get("To") ?? "";
        const from = form.get("From") ?? "";
        const callSid = form.get("CallSid") ?? undefined;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const admin = supabaseAdmin as unknown as { from: (t: string) => any };

        const { data: company } = await admin
          .from("companies")
          .select("id,name,forward_phone,twilio_number")
          .eq("twilio_number", to)
          .maybeSingle();

        if (!company) {
          return twiml(`<Say>This number isn't set up yet. Goodbye.</Say>`);
        }

        const origin = new URL(request.url).origin;

        if (company.forward_phone) {
          const action =
            `${origin}/api/public/twilio-voice-status` +
            `?cid=${encodeURIComponent(company.id)}` +
            `&from=${encodeURIComponent(from)}` +
            `&sid=${encodeURIComponent(callSid ?? "")}`;
          return twiml(
            `<Dial timeout="18" action="${escapeXml(action)}" method="POST">` +
              `<Number>${escapeXml(company.forward_phone)}</Number>` +
              `</Dial>`,
          );
        }

        // No forward number configured → go straight to recovery.
        const { recordMissedCall } = await import("@/lib/missed-calls.server");
        await recordMissedCall({
          companyId: company.id,
          companyName: company.name,
          twilioNumber: company.twilio_number ?? to,
          from,
          callSid,
        });
        return twiml(
          `<Say>Thanks for calling ${escapeXml(company.name)}. We can't take your call right now, ` +
            `but we just sent you a text. Please reply with your location and we'll help right away.</Say>`,
        );
      },
    },
  },
});
