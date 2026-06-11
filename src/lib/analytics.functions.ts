import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Product analytics / event-tracking foundation.
 *
 * Backed by the `public.product_events` table (see
 * supabase/migrations/20260611_product_events_analytics.sql). Writes happen ONLY
 * through these service-role server functions — the browser never inserts rows
 * directly. Reads are Hooked-staff only via the existing `is_super_admin` gate.
 *
 * Design rules:
 *  - Analytics must NEVER break the calling UX. The public recorder swallows all
 *    errors (including "table does not exist" if the migration has not been
 *    applied yet), so it is safe to wire into pages before the table ships.
 *  - The public recorder does NOT accept user_id/company_id from the client, to
 *    prevent attribution spoofing. Trusted identity is attached only by the
 *    server-side helper `recordServerEvent`, which derives it from the verified
 *    auth context.
 *  - No PII is stored (no email/IP/user-agent). metadata is capped in size.
 */

// Canonical event names. Add new names here so callers stay consistent and the
// founder console can map them to funnels.
export const PRODUCT_EVENTS = [
  // public / marketing funnel
  "demo_page_view",
  "demo_request_page_view",
  "apply_page_view",
  "watch_demo_click",
  "start_trial_click",
  "signup_started",
  "signup_completed",
  // in-app product usage (wire later, server-side, via recordServerEvent)
  "job_created",
  "job_assigned",
  "driver_status_updated",
  "customer_tracking_opened",
  "invoice_created",
  "impound_created",
  "ai_dispatch_used",
  "support_assistant_used",
] as const;

export type ProductEvent = (typeof PRODUCT_EVENTS)[number];

const MetadataSchema = z
  .record(z.string().max(60), z.union([z.string().max(500), z.number(), z.boolean()]))
  .optional();

const PublicEventInput = z.object({
  event: z.enum(PRODUCT_EVENTS),
  route: z.string().trim().max(300).nullish(),
  sessionId: z.string().trim().max(100).nullish(),
  anonymousId: z.string().trim().max(100).nullish(),
  source: z.enum(["client", "server"]).default("client"),
  metadata: MetadataSchema,
});

type ProductEventRow = {
  event_name: ProductEvent;
  route: string | null;
  session_id: string | null;
  anonymous_id: string | null;
  company_id: string | null;
  user_id: string | null;
  source: "client" | "server";
  metadata: Record<string, unknown>;
};

function safeMetadata(md: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!md) return {};
  try {
    // Hard cap to avoid abuse / oversized payloads.
    return JSON.stringify(md).length > 4000 ? {} : md;
  } catch {
    return {};
  }
}

/**
 * PUBLIC fire-and-forget event recorder. No auth required (marketing/anon
 * events). Never throws; returns `{ ok }` regardless so the client can ignore it.
 */
export const recordEvent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PublicEventInput.parse(d))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const row: ProductEventRow = {
        event_name: data.event,
        route: data.route ?? null,
        session_id: data.sessionId ?? null,
        anonymous_id: data.anonymousId ?? null,
        company_id: null, // never trusted from the public client
        user_id: null, // never trusted from the public client
        source: data.source ?? "client",
        metadata: safeMetadata(data.metadata),
      };
      await (supabaseAdmin as never as { from: (t: string) => { insert: (r: unknown) => Promise<unknown> } })
        .from("product_events")
        .insert(row);
    } catch {
      // Analytics must never break the caller (incl. missing-table 42P01).
    }
    return { ok: true as const };
  });

/**
 * SERVER-SIDE trusted recorder for in-app events. Call this from other server
 * functions (job created, invoice created, ai dispatch used, ...). Identity is
 * derived from trusted server context, NOT from the client. Fire-and-forget;
 * never throws.
 *
 * Usage inside another server fn handler:
 *   await recordServerEvent({ event: "job_created", userId: context.userId, companyId, metadata });
 */
export async function recordServerEvent(input: {
  event: ProductEvent;
  userId?: string | null;
  companyId?: string | null;
  route?: string | null;
  sessionId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    if (!PRODUCT_EVENTS.includes(input.event)) return;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row: ProductEventRow = {
      event_name: input.event,
      route: input.route ?? null,
      session_id: input.sessionId ?? null,
      anonymous_id: null,
      company_id: input.companyId ?? null,
      user_id: input.userId ?? null,
      source: "server",
      metadata: safeMetadata(input.metadata),
    };
    await (supabaseAdmin as never as { from: (t: string) => { insert: (r: unknown) => Promise<unknown> } })
      .from("product_events")
      .insert(row);
  } catch {
    // never throw from telemetry
  }
}

function startOfDay(daysAgo: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

const ANALYTICS_PLACEHOLDER = {
  isPlaceholder: true as const,
  note:
    "No product_events rows yet. Apply the product_events migration and let the wired CTA events (demo views, watch-demo, start-trial, signup-started) accumulate, then this becomes live.",
  totals: { events30: 0, events7: 0, uniqueSessions30: 0, uniqueVisitors30: 0 },
  funnel: {
    demoPageViews30: 0,
    watchDemoClicks30: 0,
    startTrialClicks30: 0,
    signupStarted30: 0,
    signupCompleted30: 0,
  },
  byEvent30: {} as Record<string, number>,
};

export type ProductAnalytics = typeof ANALYTICS_PLACEHOLDER | (Omit<typeof ANALYTICS_PLACEHOLDER, "isPlaceholder" | "note"> & { isPlaceholder: false });

/**
 * FOUNDER-gated analytics adapter. Live when product_events has rows; otherwise
 * returns a clearly-flagged placeholder so /founder can render a stable shape
 * whether or not the migration/data exists yet.
 */
export const getProductAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProductAnalytics> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as never as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }>;
      from: (t: string) => any;
    };

    const { data: isAdmin } = await admin.rpc("is_super_admin", { _user_id: context.userId });
    if (!isAdmin) throw new Error("Forbidden");

    const since30 = startOfDay(30);
    const since7 = startOfDay(7);

    let rows: Array<{ event_name: string; session_id: string | null; anonymous_id: string | null; created_at: string }> = [];
    try {
      const { data, error } = await admin
        .from("product_events")
        .select("event_name, session_id, anonymous_id, created_at")
        .gte("created_at", since30)
        .order("created_at", { ascending: false })
        .limit(50000);
      if (error) return ANALYTICS_PLACEHOLDER; // table missing / not yet applied
      rows = data ?? [];
    } catch {
      return ANALYTICS_PLACEHOLDER;
    }

    if (rows.length === 0) return ANALYTICS_PLACEHOLDER;

    const rows7 = rows.filter((r) => r.created_at >= since7);
    const byEvent30 = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.event_name] = (acc[r.event_name] ?? 0) + 1;
      return acc;
    }, {});
    const count = (name: ProductEvent) => byEvent30[name] ?? 0;

    return {
      isPlaceholder: false as const,
      totals: {
        events30: rows.length,
        events7: rows7.length,
        uniqueSessions30: new Set(rows.map((r) => r.session_id).filter(Boolean)).size,
        uniqueVisitors30: new Set(rows.map((r) => r.anonymous_id).filter(Boolean)).size,
      },
      funnel: {
        demoPageViews30: count("demo_page_view"),
        watchDemoClicks30: count("watch_demo_click"),
        startTrialClicks30: count("start_trial_click"),
        signupStarted30: count("signup_started"),
        signupCompleted30: count("signup_completed"),
      },
      byEvent30,
    };
  });
