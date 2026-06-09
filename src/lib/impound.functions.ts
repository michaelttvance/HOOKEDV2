import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ImpoundStatus = "in_lot" | "released" | "auctioned" | "abandoned";

export type ImpoundRow = {
  id: string;
  vin: string | null;
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
  licensePlate: string | null;
  plateState: string | null;
  ownerName: string | null;
  ownerAddress: string | null;
  ownerPhone: string | null;
  towLocation: string | null;
  towReason: string | null;
  towedBy: string | null;
  dateIn: string;
  dateOut: string | null;
  dailyRate: number;
  initialTowFee: number;
  totalPaid: number;
  status: ImpoundStatus;
  auctionDate: string | null;
  lienNoticeSentAt: string | null;
  releasedTo: string | null;
  notes: string | null;
};

function mapRow(r: any): ImpoundRow {
  return {
    id: r.id,
    vin: r.vin,
    vehicleYear: r.vehicle_year,
    vehicleMake: r.vehicle_make,
    vehicleModel: r.vehicle_model,
    vehicleColor: r.vehicle_color,
    licensePlate: r.license_plate,
    plateState: r.plate_state,
    ownerName: r.owner_name,
    ownerAddress: r.owner_address,
    ownerPhone: r.owner_phone,
    towLocation: r.tow_location,
    towReason: r.tow_reason,
    towedBy: r.towed_by,
    dateIn: r.date_in,
    dateOut: r.date_out,
    dailyRate: Number(r.daily_rate),
    initialTowFee: Number(r.initial_tow_fee),
    totalPaid: Number(r.total_paid),
    status: r.status,
    auctionDate: r.auction_date,
    lienNoticeSentAt: r.lien_notice_sent_at,
    releasedTo: r.released_to,
    notes: r.notes,
  };
}

export const listImpound = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context as any).supabase
      .from("impound_vehicles")
      .select("*")
      .order("date_in", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRow);
  });

const CreateSchema = z.object({
  vin: z.string().max(20).optional().nullable(),
  vehicleYear: z.number().int().min(1900).max(2100).optional().nullable(),
  vehicleMake: z.string().max(80).optional().nullable(),
  vehicleModel: z.string().max(80).optional().nullable(),
  vehicleColor: z.string().max(40).optional().nullable(),
  licensePlate: z.string().max(20).optional().nullable(),
  plateState: z.string().max(4).optional().nullable(),
  ownerName: z.string().max(120).optional().nullable(),
  ownerAddress: z.string().max(300).optional().nullable(),
  ownerPhone: z.string().max(40).optional().nullable(),
  towLocation: z.string().max(300).optional().nullable(),
  towReason: z.string().max(200).optional().nullable(),
  towedBy: z.string().max(80).optional().nullable(),
  dailyRate: z.number().min(0).max(10000).optional(),
  initialTowFee: z.number().min(0).max(100000).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const createImpound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => CreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const { data: profile } = await ctx.supabase
      .from("profiles").select("company_id").eq("id", ctx.userId).single();
    const company_id = profile?.company_id;
    if (!company_id) throw new Error("No company");
    const insert = {
      company_id,
      vin: data.vin || null,
      vehicle_year: data.vehicleYear ?? null,
      vehicle_make: data.vehicleMake || null,
      vehicle_model: data.vehicleModel || null,
      vehicle_color: data.vehicleColor || null,
      license_plate: data.licensePlate || null,
      plate_state: data.plateState || null,
      owner_name: data.ownerName || null,
      owner_address: data.ownerAddress || null,
      owner_phone: data.ownerPhone || null,
      tow_location: data.towLocation || null,
      tow_reason: data.towReason || null,
      towed_by: data.towedBy || null,
      daily_rate: data.dailyRate ?? 45,
      initial_tow_fee: data.initialTowFee ?? 185,
      notes: data.notes || null,
    };
    const { data: row, error } = await ctx.supabase
      .from("impound_vehicles").insert(insert).select().single();
    if (error) throw error;
    return mapRow(row);
  });

export const updateImpoundStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string;
    status: ImpoundStatus;
    releasedTo?: string | null;
    auctionDate?: string | null;
    totalPaid?: number;
  }) => d)
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const patch: any = { status: data.status };
    if (data.status === "released") {
      patch.date_out = new Date().toISOString();
      patch.released_to = data.releasedTo ?? null;
      if (typeof data.totalPaid === "number") patch.total_paid = data.totalPaid;
    }
    if (data.status === "auctioned") {
      patch.date_out = new Date().toISOString();
      patch.auction_date = data.auctionDate ?? new Date().toISOString().slice(0, 10);
    }
    if (typeof data.auctionDate === "string" && data.status !== "auctioned") {
      patch.auction_date = data.auctionDate;
    }
    const { data: row, error } = await ctx.supabase
      .from("impound_vehicles").update(patch).eq("id", data.id).select().single();
    if (error) throw error;
    return mapRow(row);
  });

export const deleteImpound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await (context as any).supabase
      .from("impound_vehicles").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ----- PDF generation (Missouri lien notice + release form) -----
type PdfKind = "lien" | "release";

export const generateImpoundPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; kind: PdfKind }) => d)
  .handler(async ({ data, context }): Promise<{ filename: string; base64: string }> => {
    const ctx = context as any;
    const { data: row, error } = await ctx.supabase
      .from("impound_vehicles").select("*").eq("id", data.id).single();
    if (error || !row) throw new Error("Vehicle not found");
    const { data: company } = await ctx.supabase
      .from("companies").select("name").eq("id", row.company_id).single();

    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 792]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const days = Math.max(
      1,
      Math.ceil(((new Date(row.date_out ?? Date.now()).getTime() - new Date(row.date_in).getTime()) / 86400000)),
    );
    const storage = days * Number(row.daily_rate);
    const total = storage + Number(row.initial_tow_fee || 0);

    let y = 760;
    const draw = (text: string, opts?: { size?: number; b?: boolean; x?: number }) => {
      page.drawText(text, {
        x: opts?.x ?? 50,
        y,
        size: opts?.size ?? 11,
        font: opts?.b ? bold : font,
        color: rgb(0, 0, 0),
      });
    };
    const line = () => { page.drawLine({ start: { x: 50, y: y - 4 }, end: { x: 562, y: y - 4 }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) }); };
    const space = (n = 16) => { y -= n; };
    const wrap = (text: string, width = 95) => {
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let cur = "";
      for (const w of words) {
        if ((cur + " " + w).trim().length > width) { lines.push(cur); cur = w; }
        else cur = (cur ? cur + " " : "") + w;
      }
      if (cur) lines.push(cur);
      for (const l of lines) { draw(l); space(14); }
    };

    const companyName = company?.name ?? "Hooked Towing";
    const companyAddress = (company as any)?.address ?? "—";
    const companyPhone = (company as any)?.phone ?? "—";

    if (data.kind === "lien") {
      draw("NOTICE OF INTENT TO SELL ABANDONED/IMPOUNDED VEHICLE", { size: 13, b: true });
      space(8); line(); space(18);

      draw(`Date issued: ${new Date().toLocaleDateString()}`); space();
      draw(`File / Tow #: ${row.id.slice(0, 8).toUpperCase()}`); space(20);

      draw("TOW COMPANY", { b: true, size: 12 }); space();
      draw(`Name:    ${companyName}`); space();
      draw(`Address: ${companyAddress}`); space();
      draw(`Phone:   ${companyPhone}`); space(20);

      draw("VEHICLE", { b: true, size: 12 }); space();
      draw(`Year / Make / Model: ${[row.vehicle_year, row.vehicle_make, row.vehicle_model].filter(Boolean).join(" ") || "—"}`); space();
      draw(`Color:               ${row.vehicle_color ?? "—"}`); space();
      draw(`VIN:                 ${row.vin ?? "—"}`); space();
      draw(`Plate:               ${row.license_plate ?? "—"}  (${row.plate_state ?? "—"})`); space(20);

      draw("REGISTERED OWNER", { b: true, size: 12 }); space();
      draw(`Name:    ${row.owner_name ?? "—"}`); space();
      draw(`Address: ${row.owner_address ?? "—"}`); space();
      draw(`Phone:   ${row.owner_phone ?? "—"}`); space(20);

      draw("TOW & STORAGE", { b: true, size: 12 }); space();
      draw(`Date towed:   ${new Date(row.date_in).toLocaleString()}`); space();
      draw(`Towed from:   ${row.tow_location ?? "—"}`); space();
      draw(`Reason:       ${row.tow_reason ?? "—"}`); space();
      draw(`Tow fee:      $${Number(row.initial_tow_fee || 0).toFixed(2)}`); space();
      draw(`Daily storage rate: $${Number(row.daily_rate).toFixed(2)}  ×  ${days} days = $${storage.toFixed(2)}`); space();
      draw(`TOTAL ACCRUED CHARGES: $${total.toFixed(2)}`, { b: true, size: 12 }); space(22);

      if (row.auction_date) {
        draw("PUBLIC AUCTION NOTICE", { b: true, size: 12 }); space();
        wrap(`Vehicle will be sold at public auction on ${new Date(row.auction_date).toLocaleDateString()} unless claimed.`);
        space(8);
      }

      draw(`To claim this vehicle, contact ${companyName} at ${companyPhone}.`); space(20);

      draw("LEGAL NOTICE", { b: true }); space();
      wrap("This notice is being provided pursuant to applicable state abandoned vehicle laws.");
    } else {
      draw(companyName, { size: 16, b: true }); space();
      draw("VEHICLE RELEASE FORM", { size: 13, b: true }); space(8); line(); space(14);
      draw(`Date issued:  ${new Date().toLocaleDateString()}`); space();
      draw(`File / Tow #: ${row.id.slice(0, 8).toUpperCase()}`); space(20);

      draw("VEHICLE", { b: true, size: 12 }); space();
      draw(`VIN:            ${row.vin ?? "—"}`); space();
      draw(`Year/Make/Model: ${[row.vehicle_year, row.vehicle_make, row.vehicle_model].filter(Boolean).join(" ") || "—"}`); space();
      draw(`Color:          ${row.vehicle_color ?? "—"}`); space();
      draw(`Plate:          ${row.license_plate ?? "—"}  (${row.plate_state ?? "—"})`); space(20);

      draw("CHARGES", { b: true, size: 12 }); space();
      draw(`Days in lot: ${days}`); space();
      draw(`Tow fee:    $${Number(row.initial_tow_fee || 0).toFixed(2)}`); space();
      draw(`Daily rate: $${Number(row.daily_rate).toFixed(2)}  ×  ${days} = $${storage.toFixed(2)}`); space();
      draw(`TOTAL DUE:  $${total.toFixed(2)}`, { b: true, size: 12 }); space(22);

      draw("RELEASE OF CUSTODY", { b: true }); space();
      wrap("The above vehicle is released to the person signing below, who certifies they are the registered owner, lienholder, or authorized agent. All charges have been paid in full and the tow operator's lien is hereby satisfied.");
      space(8);
      draw(`Released to: ${row.released_to ?? "____________________________"}`); space(20);
      draw("Recipient signature: ____________________________________  Date: __________"); space(14);
      draw("Operator signature: _____________________________________  Date: __________");
    }

    const bytes = await pdf.save();
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    const base64 = typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(bytes).toString("base64");
    const filename = `${data.kind}-${row.id.slice(0, 8)}.pdf`;

    if (data.kind === "lien") {
      await ctx.supabase
        .from("impound_vehicles")
        .update({ lien_notice_sent_at: new Date().toISOString() })
        .eq("id", row.id);
    }

    return { filename, base64 };
  });
