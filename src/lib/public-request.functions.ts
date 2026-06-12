import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SERVICE_TYPES = ["Tow", "Lockout", "Jumpstart", "Tire", "Winch", "Other"] as const;

const PublicRequestInput = z.object({
  companyId: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(3).max(40),
  location: z.string().trim().min(1).max(300),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  make: z.string().trim().max(40).nullable().optional(),
  model: z.string().trim().max(40).nullable().optional(),
  type: z.enum(SERVICE_TYPES),
  notes: z.string().trim().max(600).nullable().optional(),
  honeypot: z.string().trim().max(120).optional().or(z.literal("")),
});

export const submitPublicRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PublicRequestInput.parse(d))
  .handler(async ({ data }) => {
    if (data.honeypot && data.honeypot.trim()) {
      return { ok: true, ignored: true as const };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const jobType = data.type === "Other" ? "Tow" : data.type;

    const { error } = await supabaseAdmin.rpc("create_public_job", {
      _company_id: data.companyId,
      _customer_name: data.name.trim().slice(0, 120),
      _customer_phone: data.phone.trim().slice(0, 40),
      _location: data.location.trim().slice(0, 300),
      _vehicle_year: data.year ?? null,
      _vehicle_make: data.make?.trim() || null,
      _vehicle_model: data.model?.trim() || null,
      _job_type: jobType,
      _notes: data.notes?.trim() || null,
    });
    if (error) throw error;
    return { ok: true as const };
  });

