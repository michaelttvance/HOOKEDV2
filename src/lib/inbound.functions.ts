import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface InboundEmailRow {
  id: string;
  company_id: string | null;
  to_address: string;
  from_address: string;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  parsed_json: any;
  job_id: string | null;
  status: string;
  error: string | null;
  received_at: string;
}

export const listInboundEmails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("inbound_emails" as never)
      .select("*")
      .order("received_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as unknown as InboundEmailRow[] };
  });

export const retryInboundEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Load the row scoped to the caller's company (RLS enforces this)
    const { data: row, error } = await context.supabase
      .from("inbound_emails" as never)
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) throw new Error("Not found");
    const r = row as unknown as InboundEmailRow;
    if (!r.company_id) throw new Error("Unmatched email — cannot retry");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { parseInboundEmail, createJobFromInboundParse } = await import("@/lib/inbound.server");

    const parsed = await parseInboundEmail({
      subject: r.subject,
      bodyText: r.body_text,
      fromAddress: r.from_address,
    });
    if (!parsed.ok) {
      await supabaseAdmin
        .from("inbound_emails")
        .update({ status: "failed", error: parsed.error })
        .eq("id", r.id);
      return { ok: false as const, error: parsed.error };
    }
    await supabaseAdmin
      .from("inbound_emails")
      .update({ status: "parsed", parsed_json: parsed.parsed as any, error: null })
      .eq("id", r.id);

    const created = await createJobFromInboundParse({
      supabaseAdmin,
      companyId: r.company_id,
      parsed: parsed.parsed,
      subject: r.subject,
    });
    if (!created.ok) {
      await supabaseAdmin
        .from("inbound_emails")
        .update({ error: created.error })
        .eq("id", r.id);
      return { ok: true as const, status: "parsed", warning: created.error };
    }
    await supabaseAdmin
      .from("inbound_emails")
      .update({ status: "job_created", job_id: created.jobId, error: null })
      .eq("id", r.id);
    return { ok: true as const, status: "job_created", jobId: created.jobId };
  });

const ManualSchema = z.object({
  id: z.string().uuid(),
  caller: z.string().min(1).max(120),
  phone: z.string().max(40).optional().default(""),
  location: z.string().min(1).max(300),
  serviceType: z.enum(["Tow", "Lockout", "Jumpstart", "Tire", "Winch"]),
  priority: z.enum(["Urgent", "Standard", "Low"]).default("Standard"),
  vehicleYear: z.number().int().min(1950).max(2099).nullable().optional(),
  vehicleMake: z.string().max(60).nullable().optional(),
  vehicleModel: z.string().max(60).nullable().optional(),
  notes: z.string().max(1000).optional().default(""),
});

export const createJobFromInbound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ManualSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("inbound_emails" as never)
      .select("id, company_id, subject")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) throw new Error("Not found");
    const r = row as unknown as { id: string; company_id: string | null; subject: string | null };
    if (!r.company_id) throw new Error("Unmatched email");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createJobFromInboundParse } = await import("@/lib/inbound.server");

    const created = await createJobFromInboundParse({
      supabaseAdmin,
      companyId: r.company_id,
      parsed: {
        caller: data.caller,
        phone: data.phone || null,
        location: data.location,
        serviceType: data.serviceType,
        priority: data.priority,
        vehicleYear: data.vehicleYear ?? null,
        vehicleMake: data.vehicleMake ?? null,
        vehicleModel: data.vehicleModel ?? null,
        cleanedNotes: data.notes ?? "",
      },
      subject: r.subject,
    });
    if (!created.ok) throw new Error(created.error);

    await supabaseAdmin
      .from("inbound_emails")
      .update({ status: "job_created", job_id: created.jobId, error: null })
      .eq("id", r.id);
    return { ok: true as const, jobId: created.jobId };
  });
