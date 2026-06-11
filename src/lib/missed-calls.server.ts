import { sendTwilioSms } from "./twilio.server";

/**
 * Records a missed call: creates an incoming "lead" job on the board, logs the
 * missed call, and texts the caller a recovery message. Server-only.
 */
export async function recordMissedCall(opts: {
  companyId: string;
  companyName: string;
  twilioNumber: string;
  from: string;
  callSid?: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as unknown as {
    from: (t: string) => any;
  };

  // De-dupe: skip if we already logged a missed call from this number in the last 10 min.
  const tenMinAgo = new Date(Date.now() - 10 * 60_000).toISOString();
  const { data: recent } = await admin
    .from("missed_calls")
    .select("id")
    .eq("company_id", opts.companyId)
    .eq("from_phone", opts.from)
    .gte("created_at", tenMinAgo)
    .limit(1)
    .maybeSingle();
  if (recent) return { ok: true, deduped: true };

  // Create an incoming lead job so dispatch sees it on the board immediately.
  const { data: job } = await admin
    .from("jobs")
    .insert({
      company_id: opts.companyId,
      customer_name: opts.from,
      customer_phone: opts.from,
      location: "Awaiting location (missed call)",
      job_type: "Tow",
      priority: "Standard",
      status: "unassigned",
      is_incoming: true,
      notes: "📞 Missed call — recovery text sent. Awaiting customer reply.",
      estimated_price: 0,
      estimated_duration: 30,
      lat: 50,
      lng: 50,
    })
    .select("id")
    .single();

  const { data: mc } = await admin
    .from("missed_calls")
    .insert({
      company_id: opts.companyId,
      from_phone: opts.from,
      call_sid: opts.callSid ?? null,
      status: "missed",
      job_id: job?.id ?? null,
    })
    .select("id")
    .single();

  const body = `Hi! Sorry we missed your call at ${opts.companyName}. Reply here with your location and what you need (tow, lockout, jump, tire) and we'll dispatch help right away.`;
  const sent = await sendTwilioSms({ to: opts.from, from: opts.twilioNumber, body });
  if (sent.ok && mc?.id) {
    await admin
      .from("missed_calls")
      .update({ recovery_sent: true, updated_at: new Date().toISOString() })
      .eq("id", mc.id);
  }

  return { ok: true, jobId: job?.id, smsOk: sent.ok };
}
