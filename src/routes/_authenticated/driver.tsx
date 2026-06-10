import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { updateDriverLocation } from "../../lib/driver.functions";
import { deletePushSubscription, savePushSubscription } from "../../lib/push.functions";
import {
  Bell,
  BellOff,
  Phone,
  Navigation,
  MapPin,
  Car,
  CheckCircle2,
  Truck,
  Power,
  Coffee,
  Smartphone,
} from "lucide-react";
import { useDispatch } from "../../lib/dispatch-store";
import { useAuth } from "../../lib/use-auth";
import type { Driver, Job, JobStatus } from "../../lib/seed-data";
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
  const { profile, user } = useAuth();
  const isDriverRole = profile.role === "driver";
  return isDriverRole ? <RealDriverApp userId={user?.id ?? null} /> : <DispatcherDriverRedirect />;
}

/* ─────────────────────────────────────────────────────────────────
   Real driver login — full-screen mobile interface, scoped to ME
   ───────────────────────────────────────────────────────────────── */

function RealDriverApp({ userId }: { userId: string | null }) {
  const { jobs, drivers } = useDispatch();
  const qc = useQueryClient();
  const { profile } = useAuth();
  const me = drivers.find((d) => d.userId === userId) ?? null;

  const myJobs = me ? jobs.filter((j) => j.assignedDriverId === me.id) : [];
  const [activeId, setActiveId] = useState<string | null>(null);
  const job = myJobs.find((j) => j.id === activeId) ?? myJobs[0] ?? null;

  const [togglingShift, setTogglingShift] = useState(false);
  const onShift = me ? me.status !== "Off" : false;
  const busy = me ? me.status === "EnRoute" || me.status === "OnScene" : false;

  async function toggleShift() {
    if (!me || busy || togglingShift) return;
    setTogglingShift(true);
    try {
      await supabase
        .from("drivers")
        .update({ status: onShift ? "off" : "available" })
        .eq("id", me.id);
      qc.invalidateQueries({ queryKey: ["drivers", profile.companyId] });
    } finally {
      setTogglingShift(false);
    }
  }

  useDriverGps(job, me?.id ?? null);

  if (!me) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div className="max-w-xs">
          <Truck className="mx-auto h-10 w-10 text-muted-foreground" />
          <div className="mt-4 text-sm font-semibold">No driver profile linked yet</div>
          <p className="mt-2 text-xs text-muted-foreground">
            Ask your dispatcher to invite you as a driver, or to link your account to a truck.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-md p-4 pb-10">
        {/* Driver header */}
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold">{me.name}</div>
              <div className="text-xs text-muted-foreground">Truck {me.truck}</div>
            </div>
          </div>
          <button
            onClick={toggleShift}
            disabled={busy || togglingShift}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95",
              onShift
                ? "bg-success/15 text-success"
                : "bg-muted text-muted-foreground",
              busy && "cursor-not-allowed opacity-60",
            )}
            title={busy ? "Finish your current job before going off shift" : undefined}
          >
            {onShift ? <Power className="h-3.5 w-3.5" /> : <Coffee className="h-3.5 w-3.5" />}
            {onShift ? "On shift" : "Off shift"}
          </button>
        </div>

        <PushAlertsCard />

        {/* My job queue (if more than one) */}
        {myJobs.length > 1 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {myJobs.map((j) => (
              <button
                key={j.id}
                onClick={() => setActiveId(j.id)}
                className={cn(
                  "shrink-0 rounded-xl border px-3 py-2 text-left text-xs transition-colors",
                  j.id === job?.id
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-surface text-muted-foreground",
                )}
              >
                <div className="font-semibold">{j.caller}</div>
                <div className="text-[10px]">{j.type}</div>
              </button>
            ))}
          </div>
        )}

        {!job ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
            <div className="mt-3 text-sm font-semibold">
              {onShift ? "You're clear — no jobs assigned" : "You're off shift"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {onShift
                ? "Dispatch will send your next job here. Keep this page open."
                : "Go on shift to receive jobs from dispatch."}
            </p>
          </div>
        ) : (
          <JobScreen job={job} driver={me} />
        )}
      </div>
    </div>
  );
}

function DispatcherDriverRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/dashboard", replace: true });
  }, [navigate]);

  return (
    <div className="flex h-full items-center justify-center p-8 text-center">
      <div className="max-w-sm">
        <Smartphone className="mx-auto h-10 w-10 text-muted-foreground" />
        <div className="mt-4 text-sm font-semibold">Driver app is for driver accounts</div>
        <p className="mt-2 text-xs text-muted-foreground">
          Returning you to the dispatch board.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Shared job screen (used by both real driver app & simulator)
   ───────────────────────────────────────────────────────────────── */

function JobScreen({ job, driver }: { job: Job; driver: Driver | null }) {
  const { updateJobStatus } = useDispatch();
  const [notes, setNotes] = useState("");
  const [checklistDone, setChecklistDone] = useState<Record<string, boolean>>({});
  const isChecklistDone = !!checklistDone[job.id];

  return (
    <div className="space-y-5">
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

      {job.status === "OnScene" && <SignaturePad job={job} />}

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

      <VehicleConditionPhotos job={job} />

      <DriverEarningsPanel driver={driver} />

      {job.notes && (
        <div className="rounded-md border border-border bg-surface p-2 text-xs text-muted-foreground">
          <b className="text-foreground">Dispatch note:</b> {job.notes}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Shared helpers
   ───────────────────────────────────────────────────────────────── */

function PushAlertsCard() {
  const saveSub = useServerFn(savePushSubscription);
  const deleteSub = useServerFn(deletePushSubscription);
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      window.isSecureContext;
    setSupported(ok);
    if (!ok) return;
    setPermission(Notification.permission);
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => registration.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => setSubscribed(false));
  }, []);

  async function enableAlerts() {
    if (!supported || !publicKey || busy) return;
    setBusy(true);
    try {
      let nextPermission = Notification.permission;
      if (nextPermission !== "granted") {
        nextPermission = await Notification.requestPermission();
        setPermission(nextPermission);
      }
      if (nextPermission !== "granted") return;

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));
      const keys = subscription.toJSON().keys;
      if (!keys?.p256dh || !keys.auth) throw new Error("Missing browser push keys.");

      await saveSub({
        data: {
          endpoint: subscription.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          userAgent: navigator.userAgent,
        },
      });
      setSubscribed(true);
    } catch (err) {
      console.error("push subscription failed", err);
    } finally {
      setBusy(false);
    }
  }

  async function disableAlerts() {
    if (!supported || busy) return;
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await deleteSub({ data: { endpoint: subscription.endpoint } });
        await subscription.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error("push unsubscribe failed", err);
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <div className="mb-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-start gap-3">
          <Smartphone className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <div className="text-sm font-bold">Install driver app</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Add Hooked to your home screen from Safari or Chrome to enable mobile job alerts.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            subscribed ? "bg-success/15 text-success" : "bg-primary/15 text-primary",
          )}>
            {subscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </div>
          <div>
            <div className="text-sm font-bold">Job alerts</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {subscribed
                ? "Enabled. New assigned jobs will alert this device."
                : permission === "denied"
                  ? "Blocked in browser settings. Allow notifications for this site to receive job alerts."
                  : "Enable alerts so dispatch can reach you even when the app is in the background."}
            </p>
          </div>
        </div>
        {subscribed ? (
          <button
            type="button"
            onClick={disableAlerts}
            disabled={busy}
            className="shrink-0 rounded-full border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-accent disabled:opacity-60"
          >
            Turn off
          </button>
        ) : (
          <button
            type="button"
            onClick={enableAlerts}
            disabled={busy || permission === "denied" || !publicKey}
            className="shrink-0 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-60"
          >
            Enable
          </button>
        )}
      </div>
      {!publicKey && (
        <div className="mt-2 text-[11px] text-warning">Push alerts need VAPID keys configured.</div>
      )}
    </div>
  );
}

// Live GPS — watch position while there's an active, non-complete job
function useDriverGps(job: Job | null, driverId: string | null) {
  const shouldWatch = !!job && job.status !== "Complete" && !!driverId;
  const lastSentRef = useRef<{ lat: number; lng: number; t: number } | null>(null);
  useEffect(() => {
    if (!shouldWatch || !driverId) return;
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
        updateDriverLocation({ data: { driverId, lat, lng } }).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [shouldWatch, driverId]);
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function Row({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

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
