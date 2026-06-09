import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const VinSchema = z.object({
  vin: z.string().trim().min(11).max(17).regex(/^[A-HJ-NPR-Z0-9]+$/i, "Invalid VIN"),
});

export type VinLookupResult = {
  ok: true;
  vin: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  bodyClass: string | null;
  fuelType: string | null;
  vehicleType: string | null;
} | { ok: false; error: string };

// NHTSA vPIC — free, no key. https://vpic.nhtsa.dot.gov/api/
export const lookupVin = createServerFn({ method: "POST" })
  .inputValidator((data: { vin: string }) => VinSchema.parse(data))
  .handler(async ({ data }): Promise<VinLookupResult> => {
    const vin = data.vin.toUpperCase();
    try {
      const res = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
        { headers: { accept: "application/json" } },
      );
      if (!res.ok) return { ok: false, error: `NHTSA returned ${res.status}` };
      const json: any = await res.json();
      const r = json?.Results?.[0];
      if (!r) return { ok: false, error: "No results from NHTSA" };
      const errCode = String(r.ErrorCode ?? "");
      // ErrorCode "0" = success, "6"/"7" partial OK; anything else => error text
      if (errCode && !["0", "6", "7", "8"].includes(errCode.split(",")[0].trim())) {
        return { ok: false, error: r.ErrorText || "VIN could not be decoded" };
      }
      return {
        ok: true,
        vin,
        year: r.ModelYear ? parseInt(r.ModelYear, 10) || null : null,
        make: r.Make || null,
        model: r.Model || null,
        trim: r.Trim || null,
        bodyClass: r.BodyClass || null,
        fuelType: r.FuelTypePrimary || null,
        vehicleType: r.VehicleType || null,
      };
    } catch (e: any) {
      return { ok: false, error: e?.message || "VIN lookup failed" };
    }
  });
