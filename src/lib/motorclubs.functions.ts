import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MotorClub = {
  id: string;
  name: string;
  provider: string;
  enabled: boolean;
  contactEmail: string | null;
  contactPhone: string | null;
  accountNumber: string | null;
  avgPayout: number;
  jobsThisMonth: number;
  acceptCount: number;
  totalOffered: number;
  acceptanceRate: number;
  etaCodes: { en_route: string; on_scene: string; complete: string };
};

export const PROVIDERS = [
  { provider: "aaa", name: "AAA / Swoop" },
  { provider: "agero", name: "Agero (Allstate/State Farm/Geico)" },
  { provider: "nsd", name: "Nation Safe Drivers (NSD)" },
  { provider: "progressive", name: "Progressive" },
  { provider: "roadside_protect", name: "Roadside Protect" },
] as const;

function mapClub(r: any): MotorClub {
  const codes = r.eta_codes ?? {};
  const offered = Number(r.total_offered ?? 0);
  const accept = Number(r.accept_count ?? 0);
  return {
    id: r.id,
    name: r.name,
    provider: r.provider,
    enabled: r.enabled,
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone,
    accountNumber: r.account_number,
    avgPayout: Number(r.avg_payout ?? 0),
    jobsThisMonth: Number(r.jobs_this_month ?? 0),
    acceptCount: accept,
    totalOffered: offered,
    acceptanceRate: offered > 0 ? Math.round((accept / offered) * 100) : 0,
    etaCodes: {
      en_route: codes.en_route ?? "ER",
      on_scene: codes.on_scene ?? "OS",
      complete: codes.complete ?? "GOA",
    },
  };
}

export const listMotorClubs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context as any).supabase
      .from("motor_clubs").select("*").order("name");
    if (error) throw error;
    return (data ?? []).map(mapClub);
  });

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  provider: z.string().min(1).max(60),
  enabled: z.boolean().optional(),
  contactEmail: z.string().max(200).optional().nullable(),
  contactPhone: z.string().max(40).optional().nullable(),
  accountNumber: z.string().max(60).optional().nullable(),
  etaCodes: z.object({
    en_route: z.string().max(10),
    on_scene: z.string().max(10),
    complete: z.string().max(10),
  }).optional(),
});

export const upsertMotorClub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => UpsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const { data: profile } = await ctx.supabase
      .from("profiles").select("company_id").eq("id", ctx.userId).single();
    const payload: any = {
      company_id: profile?.company_id,
      name: data.name,
      provider: data.provider,
      enabled: data.enabled ?? false,
      contact_email: data.contactEmail ?? null,
      contact_phone: data.contactPhone ?? null,
      account_number: data.accountNumber ?? null,
    };
    if (data.etaCodes) payload.eta_codes = data.etaCodes;
    let row;
    if (data.id) {
      const r = await ctx.supabase.from("motor_clubs").update(payload).eq("id", data.id).select().single();
      if (r.error) throw r.error; row = r.data;
    } else {
      const r = await ctx.supabase.from("motor_clubs")
        .upsert(payload, { onConflict: "company_id,provider" })
        .select().single();
      if (r.error) throw r.error; row = r.data;
    }
    return mapClub(row);
  });

export const deleteMotorClub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await (context as any).supabase
      .from("motor_clubs").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// "Send status" — MVP stub: marks status_sent_at on a job + logs in club counters.
// Real integration replaces this body with provider HTTP calls (Swoop, Agero, etc).
export const sendClubStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    jobId: string;
    status: "en_route" | "on_scene" | "complete";
  }) => d)
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const { data: job } = await ctx.supabase
      .from("jobs").select("motor_club_id").eq("id", data.jobId).maybeSingle();
    if (!job?.motor_club_id) return { ok: true, sent: false };
    const { data: club } = await ctx.supabase
      .from("motor_clubs").select("eta_codes,name").eq("id", job.motor_club_id).single();
    const code = (club?.eta_codes ?? {})[data.status] ?? data.status.toUpperCase();
    await ctx.supabase.from("jobs")
      .update({ status_sent_at: new Date().toISOString(), eta_code: code })
      .eq("id", data.jobId);
    return { ok: true, sent: true, club: club?.name, code };
  });
