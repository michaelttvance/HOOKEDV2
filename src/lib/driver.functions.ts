import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const updateDriverLocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { driverId: string; lat: number; lng: number }) => {
    if (!data || typeof data.driverId !== "string" || data.driverId.length === 0) {
      throw new Error("driverId required");
    }
    if (typeof data.lat !== "number" || typeof data.lng !== "number") {
      throw new Error("lat/lng required");
    }
    if (data.lat < -90 || data.lat > 90 || data.lng < -180 || data.lng > 180) {
      throw new Error("lat/lng out of range");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("drivers")
      .update({ location_lat: data.lat, location_lng: data.lng })
      .eq("id", data.driverId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateJobEta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { jobId: string }) => {
    if (!data || typeof data.jobId !== "string" || data.jobId.length === 0) {
      throw new Error("jobId required");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const { data: job, error: jobErr } = await context.supabase
      .from("jobs")
      .select("id, lat, lng, assigned_driver_id")
      .eq("id", data.jobId)
      .single();
    if (jobErr || !job?.assigned_driver_id) return { ok: false, reason: "no_driver" };

    const { data: driver } = await context.supabase
      .from("drivers")
      .select("location_lat, location_lng")
      .eq("id", job.assigned_driver_id)
      .single();
    if (!driver?.location_lat || !driver?.location_lng) return { ok: false, reason: "no_driver_location" };

    // Sanity-check coords (project seed data uses 0–100 placeholders)
    const validLatLng = (lat: number, lng: number) =>
      lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !(Math.abs(lat) < 1 && Math.abs(lng) < 1);
    if (!validLatLng(driver.location_lat, driver.location_lng) || !validLatLng(job.lat, job.lng)) {
      return { ok: false, reason: "invalid_coords" };
    }

    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!GOOGLE_MAPS_API_KEY) return { ok: false, reason: "no_key" };

    try {
      const res = await fetch(
        `https://routes.googleapis.com/directions/v2:computeRoutes?key=${GOOGLE_MAPS_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-FieldMask": "routes.duration",
          },
          body: JSON.stringify({
            origin: { location: { latLng: { latitude: driver.location_lat, longitude: driver.location_lng } } },
            destination: { location: { latLng: { latitude: job.lat, longitude: job.lng } } },
            travelMode: "DRIVE",
            routingPreference: "TRAFFIC_AWARE",
          }),
        },
      );
      if (!res.ok) {
        const body = await res.text();
        console.error("Routes API error", res.status, body);
        return { ok: false, reason: "routes_error" };
      }
      const json = (await res.json()) as { routes?: { duration?: string }[] };
      const durStr = json.routes?.[0]?.duration; // e.g. "742s"
      if (!durStr) return { ok: false, reason: "no_route" };
      const seconds = parseInt(durStr.replace(/[^\d]/g, ""), 10);
      if (!Number.isFinite(seconds)) return { ok: false, reason: "bad_duration" };
      const minutes = Math.max(1, Math.round(seconds / 60));

      await context.supabase
        .from("jobs")
        .update({ estimated_duration: minutes })
        .eq("id", data.jobId);
      await context.supabase
        .from("drivers")
        .update({ eta_min: minutes })
        .eq("id", job.assigned_driver_id);

      return { ok: true, etaMin: minutes };
    } catch (err) {
      console.error("updateJobEta failed", err);
      return { ok: false, reason: "exception" };
    }
  });

