import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
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
  location: string | null;
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  serviceType: "Tow" | "Lockout" | "Jumpstart" | "Tire" | "Winch" | null;
  priority: "Urgent" | "Standard" | "Low" | null;
  cleanedNotes: string;
}

const PARSE_SYSTEM = `Extract structured tow-dispatch fields from a dispatcher's free-form notes during a phone call.
Return ONLY the fields you can confidently extract; set unknown fields to null.
- serviceType: pick the closest of Tow, Lockout, Jumpstart, Tire (flat tire), Winch (recovery/off-road/stuck).
- priority: "Urgent" if mentions highway, freeway, traffic lane, shoulder, accident, leaking, blocking traffic; "Low" if parking lot, driveway, home; else "Standard".
- vehicleYear must be a 4-digit number between 1950 and 2099 or null.
- cleanedNotes: a one-sentence summary of anything not captured by other fields (driver-relevant context only). Empty string if nothing extra.`;

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
        prompt: `Notes:\n"""${data.text}"""`,
        experimental_output: Output.object({ schema }),
      });
      return { ok: true, parsed: experimental_output as SmartNotesParse };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/429/.test(msg)) return { ok: false, error: "Rate limit — try again." };
      if (/402/.test(msg)) return { ok: false, error: "AI credits exhausted." };
      return { ok: false, error: `Parse failed: ${msg}` };
    }
  });
