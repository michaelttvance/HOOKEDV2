import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createAiProvider } from "./ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

interface DispatchSnapshotJob {
  id: string;
  caller: string;
  location: string;
  vehicle: string;
  type: string;
  priority: string;
  status: string;
  receivedAgoMin: number;
  assignedDriver?: string | null;
  estPrice: number;
  estDurationMin: number;
}

interface DispatchSnapshotDriver {
  id: string;
  name: string;
  truck: string;
  status: string;
  distanceMi: number;
  etaMin: number;
  certifications?: string[];
}

interface DispatchSnapshotHistoryDay {
  date: string;
  jobs: number;
  revenue: number;
  avgResponseMin: number;
}

export interface DispatchSnapshot {
  jobs: DispatchSnapshotJob[];
  drivers: DispatchSnapshotDriver[];
  todayHistory: DispatchSnapshotHistoryDay;
  recentHistory: DispatchSnapshotHistoryDay[];
}

export interface DispatchChatTurn {
  role: "user" | "assistant";
  text: string;
}

export interface DispatchChatInput {
  message: string;
  history: DispatchChatTurn[];
  snapshot: DispatchSnapshot;
}

function validate(input: unknown): DispatchChatInput {
  const v = input as DispatchChatInput;
  if (!v || typeof v.message !== "string" || !v.message.trim()) {
    throw new Error("message is required");
  }
  if (!Array.isArray(v.history)) throw new Error("history must be an array");
  if (!v.snapshot || !Array.isArray(v.snapshot.jobs) || !Array.isArray(v.snapshot.drivers)) {
    throw new Error("snapshot.jobs and snapshot.drivers are required");
  }
  return v;
}

const SYSTEM_PROMPT = `You are "Dispatch AI", an assistant embedded in Hooked, a tow-truck dispatch app.
You help the dispatcher run their board: matching drivers to jobs, watching SLAs,
flagging urgent or stalled work, and summarizing revenue and response times.

Rules:
- Answer using ONLY the live data the user provides in the "Live board" JSON below. Do not invent jobs, drivers, prices, or numbers.
- If the user asks for the closest/best driver, prefer drivers whose status is "Available", sorted by distanceMi ascending. Mention truck #, distance, and ETA.
- Treat status "Urgent" jobs and any "Unassigned" job older than 5 minutes as time-sensitive — call them out.
- Keep replies short and operational (1-3 sentences, no fluff, no markdown headers). Use $ for money and "m" for minutes.
- If the data does not contain the answer, say so briefly instead of guessing.
- Never expose internal IDs like "d1" or "j5" — use the caller name or driver name + truck #.`;

function buildBoardContext(snap: DispatchSnapshot): string {
  return [
    "Live board JSON:",
    JSON.stringify(
      {
        jobs: snap.jobs,
        drivers: snap.drivers,
        today: snap.todayHistory,
        last7days: snap.recentHistory,
      },
      null,
      2,
    ),
  ].join("\n");
}

export const sendDispatchChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data }) => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return { ok: false as const, error: "Missing OPENAI_API_KEY on the server." };
    }

    const gateway = createAiProvider(key);
    const model = gateway("gpt-4o-mini");

    try {
      const { text } = await generateText({
        model,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "system", content: buildBoardContext(data.snapshot) },
          ...data.history.map((h) => ({
            role: h.role,
            content: h.text,
          })),
          { role: "user", content: data.message },
        ],
      });
      return { ok: true as const, text: text.trim() };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Surface gateway-billing / rate-limit hints to the UI
      if (/429/.test(msg)) {
        return { ok: false as const, error: "Rate limit reached — try again in a moment." };
      }
      if (/402/.test(msg)) {
        return {
          ok: false as const,
          error: "AI credits exhausted. Please add credits to your OpenAI account.",
        };
      }
      return { ok: false as const, error: `AI error: ${msg}` };
    }
  });

// ──────────────────── Smart Notes parser ────────────────────

export interface SmartNotesParse {
  caller: string | null;
  phone: string | null;
  location: string | null; // pickup location
  dropoffLocation: string | null;
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  serviceType: "Tow" | "Lockout" | "Jumpstart" | "Tire" | "Winch" | null;
  priority: "Urgent" | "Standard" | "Low" | null;
  issue: string | null;
  driverNotes: string;
  missingInfo: string[];
  dispatchSummary: string;
  recommendedAction: string;
  cleanedNotes: string;
}

const PARSE_SYSTEM = `You structure a tow-dispatcher's free-form call notes into a dispatch-ready job.
Extract only what is clearly stated. Use null for unknown single fields and [] for none.
NEVER invent prices, ETAs, names, phone numbers, or locations.

Fields:
- caller: customer name. phone: digits as written.
- location: the PICKUP location (where the vehicle/customer is now).
- dropoffLocation: where the vehicle should be taken (dealership, shop, home, address). null for non-tow services or if not stated.
- vehicleYear: 4-digit 1950-2099 or null. vehicleMake / vehicleModel as stated.
- serviceType: closest of Tow, Lockout, Jumpstart, Tire (flat tire), Winch (recovery/off-road/stuck).
- priority: "Urgent" if highway/freeway/traffic lane/shoulder/accident/leaking/blocking traffic or "ASAP"; "Low" if parking lot/driveway/home and no urgency; else "Standard".
- issue: short phrase describing the problem (e.g. "won't start", "flat rear tire", "locked out").
- driverNotes: concise, driver-relevant context for the cab (gate codes, customer waiting, hazards). Empty string if none.
- missingInfo: array of important fields still missing to dispatch confidently. Use plain labels like "phone number", "drop-off location", "vehicle make/model", "exact pickup location". [] if nothing important is missing.
- dispatchSummary: ONE tight dispatch-ready line a dispatcher could read aloud, e.g. "Tow — 2019 Honda Civic, won't start, pickup I-280 mile 42 → Toyota of SF. Urgent."
- recommendedAction: the single best next step, e.g. "Assign nearest available driver and text ETA" or "Call customer to confirm drop-off location".
- cleanedNotes: any leftover detail not captured above; empty string if none.

Respond with a single valid JSON object matching the requested schema.`;

export const parseSmartNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = input as { text?: string };
    if (!v || typeof v.text !== "string" || !v.text.trim()) throw new Error("text required");
    if (v.text.length > 2000) throw new Error("text too long");
    return { text: v.text };
  })
  .handler(async ({ data }): Promise<{ ok: true; parsed: SmartNotesParse } | { ok: false; error: string }> => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return { ok: false, error: "Missing OPENAI_API_KEY" };
    const gateway = createAiProvider(key);
    const model = gateway("gpt-4o-mini");
    try {
      // Lenient schema: models occasionally return null or a stringified year
      // for "required" fields. Accept loosely, then normalize to clean defaults
      // so a good parse is never rejected on a technicality.
      const str = z.string().nullable().optional();
      const schema = z.object({
        caller: str,
        phone: str,
        location: str,
        dropoffLocation: str,
        vehicleYear: z.union([z.number(), z.string()]).nullable().optional(),
        vehicleMake: str,
        vehicleModel: str,
        serviceType: z.enum(["Tow", "Lockout", "Jumpstart", "Tire", "Winch"]).nullable().optional(),
        priority: z.enum(["Urgent", "Standard", "Low"]).nullable().optional(),
        issue: str,
        driverNotes: str,
        missingInfo: z.array(z.string()).nullable().optional(),
        dispatchSummary: str,
        recommendedAction: str,
        cleanedNotes: str,
      });
      // Plain generation + manual JSON parse — more reliable than the SDK's
      // experimental structured output with the openai-compatible provider.
      const { text } = await generateText({
        model,
        system: PARSE_SYSTEM,
        prompt: `Notes:\n"""${data.text}"""\n\nReturn ONLY the JSON object — no prose, no code fences.`,
      });
      const cleaned = text
        .trim()
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/, "")
        .trim();
      let raw: unknown;
      try {
        raw = JSON.parse(cleaned);
      } catch {
        return { ok: false, error: "Could not read the AI response — try rephrasing the note." };
      }
      const result = schema.safeParse(raw);
      const o = (result.success ? result.data : raw) as z.infer<typeof schema>;
      const yearNum = o.vehicleYear == null ? null : Number(o.vehicleYear);
      const parsed: SmartNotesParse = {
        caller: o.caller ?? null,
        phone: o.phone ?? null,
        location: o.location ?? null,
        dropoffLocation: o.dropoffLocation ?? null,
        vehicleYear: yearNum && yearNum >= 1950 && yearNum <= 2099 ? yearNum : null,
        vehicleMake: o.vehicleMake ?? null,
        vehicleModel: o.vehicleModel ?? null,
        serviceType: o.serviceType ?? null,
        priority: o.priority ?? null,
        issue: o.issue ?? null,
        driverNotes: o.driverNotes ?? "",
        missingInfo: Array.isArray(o.missingInfo) ? o.missingInfo : [],
        dispatchSummary: o.dispatchSummary ?? "",
        recommendedAction: o.recommendedAction ?? "",
        cleanedNotes: o.cleanedNotes ?? "",
      };
      return { ok: true, parsed };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/429/.test(msg)) return { ok: false, error: "Rate limit — try again." };
      if (/402/.test(msg)) return { ok: false, error: "AI credits exhausted." };
      return { ok: false, error: `Parse failed: ${msg}` };
    }
  });

// ──────────────────── AI follow-up message drafts ────────────────────

export type FollowUpScenario =
  | "quote_followup"
  | "eta_update"
  | "payment_reminder"
  | "impound_release"
  | "review_request"
  | "missed_call";

const SCENARIO_GUIDE: Record<FollowUpScenario, string> = {
  quote_followup:
    "Follow up on a tow/roadside quote you discussed. Be warm, restate the service, and invite them to confirm so you can dispatch.",
  eta_update:
    "Reassure the customer their driver is on the way. Include the ETA only if provided. Keep it calm and brief.",
  payment_reminder:
    "Politely remind the customer of an outstanding balance. Include the amount only if provided. Friendly, not pushy; offer to help with payment.",
  impound_release:
    "Explain how to retrieve their vehicle from impound: bring a photo ID and proof of ownership, come to the lot during business hours, and note that storage fees may apply. Do NOT invent specific fees, addresses, or hours unless provided.",
  review_request:
    "Thank them for choosing the company and ask for a quick Google review. Include the review link only if provided.",
  missed_call:
    "Apologize for missing their call, ask how you can help and for their location/vehicle, and assure them you can dispatch help quickly.",
};

const FOLLOWUP_SYSTEM = `You write short, professional, friendly text messages for a towing & recovery company to send to customers.
Rules:
- Use ONLY the facts provided. NEVER invent prices, ETAs, names, addresses, hours, or fees.
- If a price is provided, treat it as an ESTIMATE and say "estimate" or "approx".
- Keep it SMS-length (under ~320 characters), plain text, no markdown, no placeholders like [name].
- Warm and competent tone. Sign off with the company name if provided.
- Do not include internal IDs or driver phone numbers.`;

export const generateFollowUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const v = input as {
      scenario?: string;
      context?: Record<string, unknown>;
    };
    const scenarios: FollowUpScenario[] = [
      "quote_followup",
      "eta_update",
      "payment_reminder",
      "impound_release",
      "review_request",
      "missed_call",
    ];
    if (!v || !scenarios.includes(v.scenario as FollowUpScenario)) {
      throw new Error("valid scenario required");
    }
    return { scenario: v.scenario as FollowUpScenario, context: v.context ?? {} };
  })
  .handler(async ({ data }): Promise<{ ok: true; message: string } | { ok: false; error: string }> => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return { ok: false, error: "Missing OPENAI_API_KEY" };
    const gateway = createAiProvider(key);
    const model = gateway("gpt-4o-mini");

    // Only forward known, customer-safe fields.
    const c = data.context as Record<string, unknown>;
    const facts: Record<string, unknown> = {
      customerName: c.customerName ?? null,
      companyName: c.companyName ?? null,
      serviceType: c.serviceType ?? null,
      vehicle: c.vehicle ?? null,
      pickupLocation: c.pickupLocation ?? null,
      dropoffLocation: c.dropoffLocation ?? null,
      estimatedPrice: c.estimatedPrice ?? null,
      etaMinutes: c.etaMinutes ?? null,
      reviewUrl: c.reviewUrl ?? null,
      amountDue: c.amountDue ?? null,
    };

    try {
      const { text } = await generateText({
        model,
        system: FOLLOWUP_SYSTEM,
        prompt: `Scenario: ${SCENARIO_GUIDE[data.scenario]}

Known facts (JSON; use only what is non-null):
${JSON.stringify(facts, null, 2)}

Write the single best message to send now.`,
      });
      return { ok: true, message: text.trim() };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/429/.test(msg)) return { ok: false, error: "Rate limit — try again." };
      if (/402/.test(msg)) return { ok: false, error: "AI credits exhausted." };
      return { ok: false, error: `Draft failed: ${msg}` };
    }
  });
