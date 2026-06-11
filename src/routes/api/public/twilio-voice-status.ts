import { createFileRoute } from "@tanstack/react-router";
import { twiml } from "@/lib/twilio.server";

// Dial action callback — fires after the forward attempt finishes.
// If the operator didn't pick up, trigger missed-call recovery.
export const Route = createFileRoute("/api/public/twilio-voice-status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const cid = url.searchParams.get("cid") ?? "";
        const from = url.searchParams.get("from") ?? "";
        const sid = url.searchParams.get("sid") || undefined;

        const form = new URLSearchParams(await request.text());
        const dialStatus = form.get("DialCallStatus") ?? "";

        // Answered → nothing to do.
        if (dialStatus === "completed") return twiml("");

        if (cid && from) {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const admin = supabaseAdmin as unknown as { from: (t: string) => any };
          const { data: company } = await admin
            .from("companies")
            .select("id,name,twilio_number")
            .eq("id", cid)
            .maybeSingle();
          if (company) {
            const { recordMissedCall } = await import("@/lib/missed-calls.server");
            await recordMissedCall({
              companyId: company.id,
              companyName: company.name,
              twilioNumber: company.twilio_number ?? "",
              from,
              callSid: sid,
            });
          }
        }

        return twiml(
          `<Say>Sorry we missed you. We just sent you a text — reply with your location and we'll dispatch help.</Say>`,
        );
      },
    },
  },
});
