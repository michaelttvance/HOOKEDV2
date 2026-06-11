import { createFileRoute } from "@tanstack/react-router";
import { twiml } from "@/lib/twilio.server";

// Twilio inbound SMS webhook. When a missed-call lead texts back, attach their
// reply to the lead and surface it on the job so dispatch can act.
export const Route = createFileRoute("/api/public/twilio-sms")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = new URLSearchParams(await request.text());
        const to = form.get("To") ?? "";
        const from = form.get("From") ?? "";
        const body = (form.get("Body") ?? "").trim();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const admin = supabaseAdmin as unknown as { from: (t: string) => any };

        const { data: company } = await admin
          .from("companies")
          .select("id")
          .eq("twilio_number", to)
          .maybeSingle();

        if (company && body) {
          const { data: mc } = await admin
            .from("missed_calls")
            .select("id, job_id")
            .eq("company_id", company.id)
            .eq("from_phone", from)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (mc) {
            await admin
              .from("missed_calls")
              .update({ last_inbound: body, status: "recovered", updated_at: new Date().toISOString() })
              .eq("id", mc.id);
            if (mc.job_id) {
              await admin
                .from("jobs")
                .update({
                  location: body.slice(0, 200),
                  notes: `📞 Missed-call lead replied: "${body.slice(0, 400)}"`,
                })
                .eq("id", mc.job_id);
            }
          }
        }

        // Empty response → no auto-reply; the dispatcher takes it from here.
        return twiml("");
      },
    },
  },
});
