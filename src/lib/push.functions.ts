import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SubInput = z.object({
  endpoint: z.string().url().max(2000),
  p256dh: z.string().min(1).max(500),
  auth: z.string().min(1).max(500),
  userAgent: z.string().max(500).optional(),
});

/** Store (or refresh) the current user's Web Push subscription. */
export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SubInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;

    // Look up the caller's company for scoping (best-effort).
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("id", context.userId)
      .maybeSingle();

    const { error } = await admin
      .from("push_subscriptions")
      .upsert(
        {
          user_id: context.userId,
          company_id: (profile?.company_id as string | null) ?? null,
          endpoint: data.endpoint,
          p256dh: data.p256dh,
          auth: data.auth,
          user_agent: data.userAgent ?? null,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const DelInput = z.object({ endpoint: z.string().url().max(2000) });

export const deletePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DelInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    await admin
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", data.endpoint)
      .eq("user_id", context.userId);
    return { ok: true };
  });

const NotifyInput = z.object({ jobId: z.string().uuid() });

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

/**
 * Send a "new job" push to the driver assigned to `jobId`.
 * Caller must belong to the same company as the job. Fire-and-forget from the client.
 */
export const notifyDriverNewJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => NotifyInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;

    // Caller's company
    const { data: caller } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("id", context.userId)
      .maybeSingle();
    const callerCompany = (caller?.company_id as string | null) ?? null;
    if (!callerCompany) return { ok: false, reason: "no_company" };

    // Job + assigned driver (must be same company)
    const { data: job } = await supabaseAdmin
      .from("jobs")
      .select("id, company_id, customer_name, location, job_type, priority, assigned_driver_id")
      .eq("id", data.jobId)
      .maybeSingle();
    if (!job || job.company_id !== callerCompany || !job.assigned_driver_id) {
      return { ok: false, reason: "not_found_or_unassigned" };
    }

    const { data: driver } = await supabaseAdmin
      .from("drivers")
      .select("user_id, name")
      .eq("id", job.assigned_driver_id)
      .maybeSingle();
    if (!driver?.user_id) return { ok: false, reason: "driver_no_login" };

    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", driver.user_id) as { data: PushSubscriptionRow[] | null };
    if (!subs || subs.length === 0) return { ok: false, reason: "no_subscriptions" };

    const publicKey = process.env.VAPID_PUBLIC_KEY ?? process.env.VITE_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT ?? "mailto:support@hookaidashboard.com";
    if (!publicKey || !privateKey) return { ok: false, reason: "vapid_not_configured" };

    const webpush = (await import("web-push")).default;
    webpush.setVapidDetails(subject, publicKey, privateKey);

    const payload = JSON.stringify({
      title: `New ${job.priority === "Urgent" ? "🔴 URGENT " : ""}job assigned`,
      body: `${job.job_type} · ${job.customer_name} · ${job.location}`,
      url: "/driver",
      tag: `job-${job.id}`,
    });

    let sent = 0;
    const stale: string[] = [];
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
          sent++;
        } catch (err: unknown) {
          const code = (err as { statusCode?: number })?.statusCode;
          // 404/410 = subscription expired — prune it
          if (code === 404 || code === 410) stale.push(s.id);
          else console.error("push send failed", code, err);
        }
      }),
    );

    if (stale.length) {
      await admin.from("push_subscriptions").delete().in("id", stale);
    }

    return { ok: true, sent };
  });
