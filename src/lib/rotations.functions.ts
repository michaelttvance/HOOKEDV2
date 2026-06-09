import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PoliceDept = {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  coverageZone: string | null;
  scheduleDays: string[];
  scheduleStart: string;
  scheduleEnd: string;
  rotationPosition: number;
  enabled: boolean;
};

export type RotationLog = {
  id: string;
  pdId: string | null;
  pdName: string;
  jobType: string | null;
  responseMinutes: number | null;
  accepted: boolean;
  declineReason: string | null;
  occurredAt: string;
};

function mapPd(r: any): PoliceDept {
  return {
    id: r.id,
    name: r.name,
    contactName: r.contact_name,
    phone: r.phone,
    email: r.email,
    coverageZone: r.coverage_zone,
    scheduleDays: r.schedule_days ?? [],
    scheduleStart: r.schedule_start,
    scheduleEnd: r.schedule_end,
    rotationPosition: r.rotation_position,
    enabled: r.enabled,
  };
}

export const listPDs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context as any).supabase
      .from("police_departments").select("*")
      .order("rotation_position", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapPd);
  });

const PdSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  contactName: z.string().max(120).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  coverageZone: z.string().max(200).optional().nullable(),
  scheduleDays: z.array(z.string()).optional(),
  scheduleStart: z.string().optional(),
  scheduleEnd: z.string().optional(),
  enabled: z.boolean().optional(),
});

export const upsertPD = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => PdSchema.parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const { data: profile } = await ctx.supabase
      .from("profiles").select("company_id").eq("id", ctx.userId).single();
    const payload: any = {
      company_id: profile?.company_id,
      name: data.name,
      contact_name: data.contactName ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      coverage_zone: data.coverageZone ?? null,
      schedule_days: data.scheduleDays ?? ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
      schedule_start: data.scheduleStart ?? "00:00",
      schedule_end: data.scheduleEnd ?? "23:59",
      enabled: data.enabled ?? true,
    };
    let row;
    if (data.id) {
      const r = await ctx.supabase.from("police_departments").update(payload).eq("id", data.id).select().single();
      if (r.error) throw r.error; row = r.data;
    } else {
      const r = await ctx.supabase.from("police_departments").insert(payload).select().single();
      if (r.error) throw r.error; row = r.data;
    }
    return mapPd(row);
  });

export const deletePD = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await (context as any).supabase
      .from("police_departments").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const recordRotation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    pdId: string;
    accepted: boolean;
    declineReason?: string | null;
    jobType?: string | null;
    responseMinutes?: number | null;
  }) => d)
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const { data: profile } = await ctx.supabase
      .from("profiles").select("company_id").eq("id", ctx.userId).single();
    const { data: pd } = await ctx.supabase
      .from("police_departments").select("name").eq("id", data.pdId).single();
    await ctx.supabase.from("rotation_history").insert({
      company_id: profile?.company_id,
      pd_id: data.pdId,
      pd_name: pd?.name ?? "PD",
      job_type: data.jobType ?? null,
      response_minutes: data.responseMinutes ?? null,
      accepted: data.accepted,
      decline_reason: data.declineReason ?? null,
    });
    // Move PD to bottom of queue regardless (accept advances, decline skips)
    const { data: max } = await ctx.supabase
      .from("police_departments")
      .select("rotation_position")
      .order("rotation_position", { ascending: false })
      .limit(1).maybeSingle();
    const next = (max?.rotation_position ?? 0) + 1;
    await ctx.supabase.from("police_departments")
      .update({ rotation_position: next }).eq("id", data.pdId);
    return { ok: true };
  });

export const listRotationHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RotationLog[]> => {
    const { data, error } = await (context as any).supabase
      .from("rotation_history").select("*")
      .order("occurred_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      pdId: r.pd_id,
      pdName: r.pd_name,
      jobType: r.job_type,
      responseMinutes: r.response_minutes,
      accepted: r.accepted,
      declineReason: r.decline_reason,
      occurredAt: r.occurred_at,
    }));
  });
