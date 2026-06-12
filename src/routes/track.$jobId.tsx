import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, MapPin, Phone, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleMaps, toLatLng, MAP_STYLE } from "../lib/maps";
import { cn } from "../lib/utils";

const trackHead = () => ({
  meta: [
    { title: "Track your tow — Hooked" },
    { name: "robots", content: "noindex, nofollow" },
    { name: "referrer", content: "no-referrer" },
    { name: "description", content: "Live location and ETA for your tow truck." },
  ],
});

interface TrackingData {
  status: "unassigned" | "assigned" | "en_route" | "on_scene" | "complete";
  closed_outcome: "cancelled" | "goa" | null;
  closed_reason: string | null;
  job_type: string;
  location: string;
  created_at: string;
  assigned_at: string | null;
  en_route_at: string | null;
  on_scene_at: string | null;
  job_lat: number | null;
  job_lng: number | null;
  company_name: string;
  driver_name: string | null;
  truck_number: string | null;
  driver_lat: number | null;
  driver_lng: number | null;
  eta_min: number | null;
}

export const Route = createFileRoute("/track/$jobId")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    t: typeof search.t === "string" ? search.t : "",
  }),
  head: trackHead,
  component: TrackPage,
});

const STEPS = [
  { key: "received", label: "Request received" },
  { key: "assigned", label: "Driver assigned" },
  { key: "en_route", label: "Driver en route" },
  { key: "on_scene", label: "Driver on scene" },
] as const;

function stepIndex(status: TrackingData["status"]): number {
  switch (status) {
    case "unassigned": return 0;
    case "assigned": return 1;
    case "en_route": return 2;
    case "on_scene": return 3;
    case "complete": return 4;
    default: return 0;
  }
}

// Placeholder coords (demo data) are 0..100 with positive lng; real US GPS has negative lng.
function normalizeCoord(lat: number, lng: number): google.maps.LatLngLiteral {
  const isPlaceholder = lat >= 0 && lat <= 100 && lng >= 0 && lng <= 100;
  return isPlaceholder ? toLatLng({ lat, lng }) : { lat, lng };
}

function TrackPage() {
  const { jobId } = Route.useParams();
  const { t: token } = Route.useSearch();
  const [data, setData] = useState<TrackingData | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "done" | "closed" | "invalid">("loading");
  const hadDataRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    let stop = false;
    async function poll() {
      const { data: res, error } = await supabase.rpc("get_job_tracking" as never, {
        _job_id: jobId,
        _token: token,
      } as never);
      if (stop) return;
      if (error) {
        setState((s) => (s === "loading" ? "invalid" : s));
        return;
      }
      if (res == null) {
        // Job row is deleted on completion — if we ever saw data, the service finished.
        setState(hadDataRef.current ? "done" : "invalid");
        return;
      }
      hadDataRef.current = true;
      const d = res as unknown as TrackingData;
      setData(d);
      setState(d.closed_outcome ? "closed" : d.status === "complete" ? "done" : "ok");
    }
    poll();
    const id = setInterval(poll, 8000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [jobId, token]);

  return (
    <div className="min-h-screen w-full bg-[#0B1220] font-sans text-slate-200">
      <header className="border-b border-white/5 bg-[#0B1220]/80 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FACC15]">
            <Truck className="h-[18px] w-[18px] text-black" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">
              {data?.company_name ?? "Hooked"}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">
              Live tow tracking
            </div>
          </div>
          {state === "ok" && (
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6">
        {state === "loading" && (
          <div className="py-24 text-center text-sm text-slate-400">Loading your tracking link…</div>
        )}

        {state === "invalid" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <div className="text-lg font-bold text-white">Tracking link not found</div>
            <p className="mt-2 text-sm text-slate-400">
              This link may have expired. If you're expecting a tow, contact your towing company directly.
            </p>
          </div>
        )}

        {state === "done" && (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
            <div className="mt-4 text-xl font-bold text-white">Service complete</div>
            <p className="mt-2 text-sm text-slate-400">
              Thanks for choosing {data?.company_name ?? "us"}. Drive safe out there!
            </p>
          </div>
        )}

        {state === "closed" && data && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Job closed
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {data.closed_outcome === "goa" ? "Marked GOA" : "Job canceled"}
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {data.closed_outcome === "goa"
                ? "Dispatch marked this tow as Gone on Arrival. This tracking link is no longer live."
                : "Dispatch canceled this job. This tracking link is no longer live."}
            </p>
            {data.closed_reason && (
              <p className="mt-3 text-xs text-slate-500">Note: {data.closed_reason}</p>
            )}
          </div>
        )}

        {state === "ok" && data && (
          <div className="space-y-4">
            {/* ETA hero */}
            {data.status === "en_route" && data.eta_min != null && data.eta_min > 0 && (
              <div className="rounded-2xl border border-[#FACC15]/30 bg-[#FACC15]/[0.06] p-6 text-center">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-[#FACC15]">
                  Estimated arrival
                </div>
                <div className="mt-1 text-5xl font-extrabold text-white">
                  {data.eta_min}
                  <span className="ml-1 text-2xl text-slate-400">min</span>
                </div>
              </div>
            )}
            {data.status === "on_scene" && (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-6 text-center">
                <div className="text-xl font-bold text-emerald-400">Your driver has arrived</div>
              </div>
            )}

            {/* Live map */}
            <TrackMap data={data} />

            {/* Driver card */}
            {data.driver_name && (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FACC15]/15 text-[#FACC15]">
                  <Truck className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">{data.driver_name}</div>
                  <div className="text-xs text-slate-500">
                    Truck {data.truck_number ?? "—"} · {data.job_type}
                  </div>
                </div>
              </div>
            )}

            {/* Destination */}
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <div className="text-sm text-slate-300">{data.location}</div>
            </div>

            {/* Progress steps */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <ol className="space-y-3">
                {STEPS.map((s, i) => {
                  const reached = stepIndex(data.status) >= i;
                  const current = stepIndex(data.status) === i;
                  const at =
                    s.key === "received" ? data.created_at
                    : s.key === "assigned" ? data.assigned_at
                    : s.key === "en_route" ? data.en_route_at
                    : data.on_scene_at;
                  return (
                    <li key={s.key} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold",
                          reached
                            ? "border-[#FACC15] bg-[#FACC15] text-black"
                            : "border-white/15 bg-transparent text-slate-500",
                        )}
                      >
                        {reached ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                      </span>
                      <span className={cn("flex-1 text-sm", reached ? "text-white" : "text-slate-500")}>
                        {s.label}
                      </span>
                      {at && reached && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Clock className="h-3 w-3" />
                          {new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </span>
                      )}
                      {current && (
                        <span className="rounded-full bg-[#FACC15]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#FACC15]">
                          Now
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>

            <p className="pt-2 text-center text-[11px] text-slate-600">
              This page updates automatically · Powered by Hooked
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function TrackMap({ data }: { data: TrackingData }) {
  const maps = useGoogleMaps();
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const destMarkerRef = useRef<google.maps.Marker | null>(null);

  const hasDriver = data.driver_lat != null && data.driver_lng != null;
  const hasDest = data.job_lat != null && data.job_lng != null;

  useEffect(() => {
    if (maps.status !== "ready" || !divRef.current) return;

    const driver = hasDriver ? normalizeCoord(data.driver_lat!, data.driver_lng!) : null;
    const dest = hasDest ? normalizeCoord(data.job_lat!, data.job_lng!) : null;
    const center = driver ?? dest;
    if (!center) return;

    if (!mapRef.current) {
      mapRef.current = new google.maps.Map(divRef.current, {
        center,
        zoom: 12,
        styles: MAP_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
        backgroundColor: "#0b1220",
      });
    }
    const map = mapRef.current;

    if (driver) {
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = new google.maps.Marker({
          map,
          position: driver,
          title: "Your driver",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: "#FACC15",
            fillOpacity: 1,
            strokeColor: "#0B1220",
            strokeWeight: 3,
          },
        });
      } else {
        driverMarkerRef.current.setPosition(driver);
      }
    }

    if (dest && !destMarkerRef.current) {
      destMarkerRef.current = new google.maps.Marker({
        map,
        position: dest,
        title: "Pickup location",
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 5,
          fillColor: "#34d399",
          fillOpacity: 1,
          strokeColor: "#0B1220",
          strokeWeight: 2,
        },
      });
    }

    if (driver && dest) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(driver);
      bounds.extend(dest);
      map.fitBounds(bounds, 60);
    } else {
      map.setCenter(center);
    }
  }, [maps.status, data.driver_lat, data.driver_lng, data.job_lat, data.job_lng, hasDriver, hasDest]);

  if (!hasDriver && !hasDest) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      {maps.status === "ready" ? (
        <div ref={divRef} className="h-64 w-full" />
      ) : (
        <div
          className="flex h-64 w-full items-center justify-center bg-[#0F1A2E] text-xs text-slate-500"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        >
          {maps.status === "loading" ? "Loading map…" : "Map unavailable"}
        </div>
      )}
    </div>
  );
}
