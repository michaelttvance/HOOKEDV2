import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { updateDriverLocation } from "../../lib/driver.functions";
import {
  Phone,
  Navigation,
  MapPin,
  Car,
  Camera,
  CheckCircle2,
  Truck,
} from "lucide-react";
import { useDispatch } from "../../lib/dispatch-store";
import type { JobStatus } from "../../lib/seed-data";
import { DriverMiniMap } from "../../components/driver-mini-map";
import {
  PreJobChecklist,
  VehicleConditionPhotos,
  SignaturePad,
  DriverEarningsPanel,
  RequestBackupButton,
} from "../../components/driver-features";
import { cn } from "../../lib/utils";

export const Route = createFileRoute("/_authenticated/driver")({
  head: () => ({
    meta: [
      { title: "Driver App — Hooked" },
      { name: "description", content: "On-the-road job view for tow drivers: status, customer call, notes, photos." },
      { property: "og:title", content: "Driver App — Hooked" },
      { property: "og:description", content: "On-the-road job view for tow drivers: status, customer call, notes, photos." },
      { property: "og:url", content: "https://hookaidashboard.com/driver" },
    ],
  }),
  component: DriverView,
});

const FLOW: { key: JobStatus; label: string }[] = [
  { key: "EnRoute", label: "En Route" },
  { key: "OnScene", label: "On Scene" },
  { key: "Complete", label: "Complete" },
];

function DriverView() {
  const { jobs, drivers, activeDriverJobId, setActiveDriverJob, updateJobStatus } = useDispatch();
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [checklistDone, setChecklistDone] = useState<Record<string, boolean>>({});
  const [signed, setSigned] = useState<Record<string, boolean>>({});

  const assigned = jobs.filter((j) => j.assignedDriverId);
  const job = jobs.find((j) => j.id === activeDriverJobId) ?? assigned[0] ?? null;
  const driver = job ? drivers.find((d) => d.id === job.assignedDriverId) : null;
  const isChecklistDone = job ? !!checklistDone[job.id] : false;
  const isSigned = job ? !!signed[job.id] : false;

  // Live GPS — watch position while there's an active, non-complete job
  const driverIdForWatch = driver?.id ?? null;
  const shouldWatch = !!job && job.status !== "Complete" && !!driverIdForWatch;
  const lastSentRef = useRef<{ lat: number; lng: number; t: number } | null>(null);
  useEffect(() => {
    if (!shouldWatch || !driverIdForWatch) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const now = Date.now();
        const last = lastSentRef.current;
        // throttle: skip if <10s since last AND moved <~15m
        if (last && now - last.t < 10_000) {
          const dLat = Math.abs(lat - last.lat);
          const dLng = Math.abs(lng - last.lng);
          if (dLat < 0.00015 && dLng < 0.00015) return;
        }
        lastSentRef.current = { lat, lng, t: now };
        updateDriverLocation({ data: { driverId: driverIdForWatch, lat, lng } }).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [shouldWatch, driverIdForWatch]);

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-background">
      {/* Job picker (sim of "switch driver") */}
      <div className="hidden w-64 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
        <div className="border-b border-border px-4 py-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Active driver jobs</div>
          <div className="text-sm font-semibold">Simulator</div>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {assigned.map((j) => {
            const d = drivers.find((x) => x.id === j.assignedDriverId);
            return (
              <button
                key={j.id}
                onClick={() => setActiveDriverJob(j.id)}
                className={cn(
                  "block w-full rounded-md px-3 py-2 text-left text-xs transition-colors",
                  j.id === job?.id ? "bg-primary/15 text-primary" : "hover:bg-accent",
                )}
              >
                <div className="font-semibold">{d?.name}</div>
                <div className="text-muted-foreground">{j.caller} · {j.type}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Phone frame */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-6">
        <div className="w-full max-w-sm overflow-hidden rounded-[2.5rem] border-[10px] border-surface-2 bg-background shadow-2xl">
          <div className="flex items-center justify-between bg-surface-2 px-5 py-2 font-mono text-[11px] text-muted-foreground">
            <span>9:41</span>
            <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Hooked</span>
            <span>100%</span>
          </div>

          {!job ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No active jobs. You're clear.
            </div>
          ) : (
            <div className="space-y-5 p-5">
              <div>
                <div className="flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Current job</div>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    job.status === "OnScene" ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
                  )}>
                    {job.status === "OnScene" ? "On scene" : job.status === "EnRoute" ? "En route" : job.status === "Assigned" ? "Assigned" : job.status}
                  </span>
                </div>
                <div className="mt-2 text-2xl font-bold leading-tight">{job.caller}</div>
                <div className="mt-0.5 font-mono text-sm text-muted-foreground">{job.phone}</div>
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-surface p-4 text-base">
                <Row icon={MapPin}>
                  <span className="text-base font-medium leading-snug">{job.location}</span>
                </Row>
                <Row icon={Car}>
                  <span className="text-sm">{job.vehicle}</span>
                </Row>
                <Row icon={Navigation}>
                  <span className="font-mono text-sm">{job.type}</span>
                  <span className="ml-1 text-sm text-muted-foreground">· ${job.estPrice} · {job.estDurationMin} min</span>
                </Row>
                {driver && (
                  <Row icon={Truck}>
                    <span className="text-sm">Truck <span className="font-mono">{driver.truck}</span> · ETA {driver.etaMin}m</span>
                  </Row>
                )}
              </div>

              <DriverMiniMap job={job} />

              <PreJobChecklist
                jobId={job.id}
                done={isChecklistDone}
                onChange={(d) => setChecklistDone((prev) => ({ ...prev, [job.id]: d }))}
              />

              {/* Big thumb-friendly status flow */}
              <div className="grid grid-cols-3 gap-2">
                {FLOW.map((step) => {
                  const isCurrent = job.status === step.key;
                  const isComplete = step.key === "Complete";
                  const blocked = step.key === "EnRoute" && !isChecklistDone && !isCurrent;
                  return (
                    <button
                      key={step.key}
                      disabled={blocked}
                      onClick={() => updateJobStatus(job.id, step.key)}
                      className={cn(
                        "rounded-xl border px-2 py-5 text-sm font-bold leading-tight transition-all active:scale-95",
                        blocked && "cursor-not-allowed opacity-40",
                        isCurrent
                          ? "border-primary bg-primary text-primary-foreground glow-primary"
                          : isComplete
                            ? "border-success/40 bg-success/10 text-success hover:bg-success/20"
                            : "border-border bg-surface text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {step.label}
                    </button>
                  );
                })}
              </div>
              {!isChecklistDone && (
                <div className="-mt-3 text-center text-[11px] text-muted-foreground">
                  Complete the pre-trip checklist to go En Route
                </div>
              )}

              <RequestBackupButton job={job} />

              {job.status === "Complete" && (
                <SignaturePad
                  jobId={job.id}
                  signed={isSigned}
                  onSigned={() => setSigned((prev) => ({ ...prev, [job.id]: true }))}
                />
              )}

              <NavigateMenu location={job.location} />

              <a
                href={`tel:${job.phone.replace(/\D/g, "")}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-success py-4 text-base font-bold text-success-foreground active:scale-[0.98]"
              >
                <Phone className="h-5 w-5" /> Call customer
              </a>


              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Customer asked to wait at lobby…"
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Photos
                </label>
                <div className="flex gap-2">
                  {photos.map((p, i) => (
                    <div key={i} className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-surface text-[10px] text-muted-foreground">
                      {p}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPhotos((p) => [...p, `IMG_${p.length + 1}`])}
                    className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-[10px] text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    <Camera className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </div>

              <VehicleConditionPhotos jobId={job.id} />

              <DriverEarningsPanel driver={driver} />

              {job.notes && (
                <div className="rounded-md border border-border bg-surface p-2 text-xs text-muted-foreground">
                  <b className="text-foreground">Dispatch note:</b> {job.notes}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

void CheckCircle2;

function NavigateMenu({ location }: { location: string }) {
  const [open, setOpen] = useState(false);
  const encoded = encodeURIComponent(location);
  const gmaps = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
  const waze = `https://waze.com/ul?q=${encoded}&navigate=yes`;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground active:scale-[0.98]"
      >
        <Navigation className="h-5 w-5" /> Navigate
      </button>
      {open && (
        <div className="absolute bottom-full left-0 right-0 z-10 mb-2 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          <a
            href={gmaps}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm font-semibold hover:bg-accent"
          >
            Google Maps
          </a>
          <a
            href={waze}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block border-t border-border px-4 py-3 text-sm font-semibold hover:bg-accent"
          >
            Waze
          </a>
        </div>
      )}
    </div>
  );
}
