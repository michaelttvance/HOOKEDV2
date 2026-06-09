// Server-only helpers for inbound-email parsing + job creation.
// Imported by the public webhook route and authenticated retry server fns.

import { generateText, Output } from "ai";
import { z } from "zod";
import { createAiProvider } from "./ai-gateway.server";

export interface InboundParse {
  caller: string | null;
  phone: string | null;
  location: string | null;
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  serviceType: "Tow" | "Lockout" | "Jumpstart" | "Tire" | "Winch" | null;
  priority: "Urgent" | "Standard" | "Low" | null;
  cleanedNotes: string;
}

const PARSE_SYSTEM = `Extract structured tow-dispatch fields from an inbound email sent by a motor club, body shop, rental company, or anyone else dispatching a tow/roadside job.
The email may be plain text, HTML stripped to text, or a forwarded message.
Return ONLY fields you can confidently extract; set unknown fields to null.

- caller: the stranded customer/vehicle owner's name (NOT the sending company). If only the requesting company name appears, use that.
- phone: best contact phone for the customer at scene.
- location: street address, intersection, mile marker, or landmark where the vehicle is.
- serviceType: pick the closest of Tow, Lockout, Jumpstart, Tire (flat tire), Winch (recovery/off-road/stuck).
- priority: "Urgent" if highway/freeway/traffic lane/shoulder/accident/leaking/blocking traffic; "Low" if parking lot/driveway/home; else "Standard".
- vehicleYear: 4-digit number 1950–2099 or null.
- cleanedNotes: one-sentence summary of anything driver-relevant not captured above (PO #, gate code, special instructions). Empty string if nothing extra.`;

export async function parseInboundEmail(args: {
  subject: string | null;
  bodyText: string | null;
  fromAddress: string;
}): Promise<{ ok: true; parsed: InboundParse } | { ok: false; error: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, error: "Missing OPENAI_API_KEY" };
  const body = (args.bodyText ?? "").slice(0, 8000);
  if (!body.trim() && !args.subject) {
    return { ok: false, error: "Empty email body" };
  }
  const gateway = createAiProvider(key);
  const model = gateway("gpt-4o-mini");
  try {
    const schema = z.object({
      caller: z.string().nullable(),
      phone: z.string().nullable(),
      location: z.string().nullable(),
      vehicleYear: z.number().int().nullable(),
      vehicleMake: z.string().nullable(),
      vehicleModel: z.string().nullable(),
      serviceType: z.enum(["Tow", "Lockout", "Jumpstart", "Tire", "Winch"]).nullable(),
      priority: z.enum(["Urgent", "Standard", "Low"]).nullable(),
      cleanedNotes: z.string(),
    });
    const { experimental_output } = await generateText({
      model,
      system: PARSE_SYSTEM,
      prompt: `From: ${args.fromAddress}\nSubject: ${args.subject ?? ""}\n\n${body}`,
      experimental_output: Output.object({ schema }),
    });
    return { ok: true, parsed: experimental_output as InboundParse };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Parse failed: ${msg}` };
  }
}

const JOB_PRESETS = {
  Tow: { price: 185, durationMin: 55 },
  Lockout: { price: 75, durationMin: 25 },
  Jumpstart: { price: 65, durationMin: 20 },
  Tire: { price: 95, durationMin: 30 },
  Winch: { price: 245, durationMin: 70 },
} as const;

// Create a job row from a parsed inbound email. Requires caller + location + serviceType.
// Uses the admin client (caller is responsible for security context).
export async function createJobFromInboundParse(args: {
  supabaseAdmin: any;
  companyId: string;
  parsed: InboundParse;
  subject: string | null;
}): Promise<{ ok: true; jobId: string } | { ok: false; error: string }> {
  const p = args.parsed;
  if (!p.caller || !p.location || !p.serviceType) {
    return { ok: false, error: "Missing caller, location, or serviceType — cannot auto-create job" };
  }
  const preset = JOB_PRESETS[p.serviceType];
  const noteParts = [args.subject ? `Email: ${args.subject}` : null, p.cleanedNotes || null].filter(Boolean);
  const { data, error } = await args.supabaseAdmin
    .from("jobs")
    .insert({
      company_id: args.companyId,
      customer_name: p.caller,
      customer_phone: p.phone ?? "",
      location: p.location,
      vehicle_year: p.vehicleYear,
      vehicle_make: p.vehicleMake,
      vehicle_model: p.vehicleModel,
      job_type: p.serviceType,
      priority: p.priority ?? "Standard",
      status: "unassigned",
      notes: noteParts.join(" — ") || null,
      estimated_price: preset.price,
      estimated_duration: preset.durationMin,
      lat: 30 + Math.random() * 40,
      lng: 25 + Math.random() * 50,
      is_incoming: true,
    })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "insert failed" };
  }
  return { ok: true, jobId: data.id as string };
}
