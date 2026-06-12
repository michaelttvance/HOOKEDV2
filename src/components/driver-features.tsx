import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  CheckCircle2,
  ShieldAlert,
  PenLine,
  RotateCcw,
  DollarSign,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import type { Job, JobPhoto, Driver } from "../lib/seed-data";
import { useDispatch } from "../lib/dispatch-store";
import { useAuth } from "../lib/use-auth";
import { addJobPhoto, resolveMediaUrl, setJobSignature } from "../lib/media";
import { cn } from "../lib/utils";

/* ───────────────────────── Pre/Post Checklist ───────────────────────── */

const CHECKLIST_ITEMS = [
  "Seatbelt fastened",
  "Lights & signals working",
  "Chains / straps loaded",
  "Truck fueled",
];

export function PreJobChecklist({
  jobId,
  done,
  onChange,
}: {
  jobId: string;
  done: boolean;
  onChange: (done: boolean) => void;
}) {
  const [checked, setChecked] = useState<boolean[]>(() =>
    CHECKLIST_ITEMS.map(() => false),
  );

  // Reset when job changes
  useEffect(() => {
    setChecked(CHECKLIST_ITEMS.map(() => done));
  }, [jobId, done]);

  function toggle(i: number) {
    const next = checked.map((c, idx) => (idx === i ? !c : c));
    setChecked(next);
    onChange(next.every(Boolean));
  }

  const allDone = checked.every(Boolean);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Pre-trip checklist
        </div>
        {allDone ? (
          <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
            <CheckCircle2 className="h-3 w-3" /> Ready
          </span>
        ) : (
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">
            Required
          </span>
        )}
      </div>
      <ul className="space-y-1.5">
        {CHECKLIST_ITEMS.map((item, i) => (
          <li key={item}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-background active:scale-[0.99]"
            >
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded border",
                  checked[i]
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background",
                )}
              >
                {checked[i] && <CheckCircle2 className="h-3.5 w-3.5" />}
              </span>
              <span className={checked[i] ? "text-foreground" : "text-muted-foreground"}>
                {item}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────────────────── Vehicle Condition Photos ───────────────────────── */

const PHOTO_SLOTS = ["Before tow", "After drop-off", "Scene"] as const;

export function VehicleConditionPhotos({ job }: { job: Job }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function capture(label: string, file: File) {
    setBusy(label);
    setError(null);
    try {
      await addJobPhoto(job.id, label, file);
      qc.invalidateQueries({ queryKey: ["jobs", profile.companyId] });
    } catch (err) {
      console.error("Photo upload failed", err);
      setError("Upload failed — check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Job photos · saved to record
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PHOTO_SLOTS.map((label) => (
          <PhotoSlot
            key={label}
            label={label}
            photo={(job.photos ?? []).filter((p) => p.label === label).at(-1) ?? null}
            uploading={busy === label}
            onCapture={(file) => capture(label, file)}
          />
        ))}
      </div>
      {error && <div className="mt-1.5 text-[11px] text-urgent">{error}</div>}
    </div>
  );
}

function PhotoSlot({
  label,
  photo,
  uploading,
  onCapture,
}: {
  label: string;
  photo: JobPhoto | null;
  uploading: boolean;
  onCapture: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewUrl = resolveMediaUrl(photo);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onCapture(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex h-24 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border p-2 text-center text-xs transition-colors",
          photo
            ? "border-success/40"
            : "border-dashed border-border bg-surface text-muted-foreground hover:border-primary hover:text-primary",
          uploading && "opacity-60",
        )}
      >
        {photo ? (
          <>
            {previewUrl ? (
              <>
                {/*
                  Legacy public URLs still render here today.
                  When job-media becomes private, this helper will resolve signed URLs instead.
                */}
                <img
                  src={previewUrl}
                  alt={label}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-black/65 px-1 py-0.5 text-[9px] font-semibold text-white">
                  {label} ✓
                </span>
              </>
            ) : (
              <>
                <Camera className="h-5 w-5" />
                <span className="text-[10px] font-semibold leading-tight">{label}</span>
                <span className="text-[9px]">{uploading ? "Uploading…" : "Tap to capture"}</span>
              </>
            )}
          </>
        ) : (
          <>
            <Camera className="h-5 w-5" />
            <span className="text-[10px] font-semibold leading-tight">{label}</span>
            <span className="text-[9px]">{uploading ? "Uploading…" : "Tap to capture"}</span>
          </>
        )}
      </button>
    </>
  );
}

/* ───────────────────────── Signature Pad ───────────────────────── */

export function SignaturePad({ job }: { job: Job }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const hasInkRef = useRef(false);
  const jobId = job.id;
  const signed = !!job.signatureUrl;

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth;
    const h = c.clientHeight;
    c.width = w * dpr;
    c.height = h * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    hasInkRef.current = false;
  }, [jobId, signed]);

  async function save() {
    const c = canvasRef.current;
    if (!c || !hasInkRef.current || saving) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await new Promise<Blob | null>((resolve) => c.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Could not read signature");
      await setJobSignature(jobId, blob);
      qc.invalidateQueries({ queryKey: ["jobs", profile.companyId] });
    } catch (err) {
      console.error("Signature save failed", err);
      setError("Couldn't save signature — try again.");
    } finally {
      setSaving(false);
    }
  }

  function pos(e: React.PointerEvent) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function start(e: React.PointerEvent) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawingRef.current = true;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    (e.target as Element).setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    hasInkRef.current = true;
  }
  function end() {
    drawingRef.current = false;
  }
  function clear() {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    hasInkRef.current = false;
  }

  if (signed) {
    const signatureUrl = resolveMediaUrl(job.signatureUrl);
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 px-3 py-3 text-sm">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
        <div className="flex-1">
          <div className="font-semibold text-success">Customer signature captured</div>
          <div className="text-[11px] text-muted-foreground">Saved to job record</div>
        </div>
        {signatureUrl ? (
          <img
            src={signatureUrl}
            alt="Customer signature"
            className="h-10 w-24 rounded border border-border bg-background object-contain"
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <PenLine className="h-3 w-3" /> Customer signature
        </div>
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" /> Clear
        </button>
      </div>
      <div className="overflow-hidden rounded-md border border-dashed border-border bg-background">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="block h-32 w-full touch-none"
        />
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={save}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.99] disabled:opacity-60"
      >
        <CheckCircle2 className="h-4 w-4" /> {saving ? "Saving…" : "Capture signature"}
      </button>
      {error && <div className="mt-1.5 text-[11px] text-urgent">{error}</div>}
    </div>
  );
}

/* ───────────────────────── Driver Earnings ───────────────────────── */

const EARNINGS_RATE = 0.3; // 30% of job price

export function DriverEarningsPanel({ driver }: { driver: Driver | null | undefined }) {
  const { history } = useDispatch();

  const { todayJobs, todayEarned, weekly, weekMax } = useMemo(() => {
    const name = driver?.name;
    const mine = name ? history.filter((h) => h.driver === name) : [];
    const today = new Date().toISOString().slice(0, 10);
    const todays = mine.filter((h) => h.date === today);
    const earnedToday = todays.reduce((s, h) => s + h.amount * EARNINGS_RATE, 0);

    const days: { date: string; label: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString([], { weekday: "short" }).slice(0, 1);
      const amount = mine
        .filter((h) => h.date === iso)
        .reduce((s, h) => s + h.amount * EARNINGS_RATE, 0);
      days.push({ date: iso, label, amount });
    }
    const max = Math.max(1, ...days.map((d) => d.amount));
    return {
      todayJobs: todays.length,
      todayEarned: earnedToday,
      weekly: days,
      weekMax: max,
    };
  }, [history, driver?.name]);

  const weekTotal = weekly.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Your earnings
        </div>
        <span className="text-[10px] text-muted-foreground">{Math.round(EARNINGS_RATE * 100)}% of job price</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat icon={Briefcase} label="Jobs today" value={String(todayJobs)} />
        <Stat
          icon={DollarSign}
          label="Earned today"
          value={`$${Math.round(todayEarned)}`}
          accent
        />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="h-3 w-3" /> Last 7 days
          </span>
          <span className="font-mono font-semibold text-foreground">${Math.round(weekTotal)}</span>
        </div>
        <div className="flex h-20 items-end gap-1.5">
          {weekly.map((d, i) => {
            const h = Math.max(4, Math.round((d.amount / weekMax) * 100));
            const isToday = i === weekly.length - 1;
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-full rounded-sm transition-all",
                    isToday ? "bg-primary" : "bg-primary/30",
                  )}
                  style={{ height: `${h}%` }}
                  title={`$${Math.round(d.amount)}`}
                />
                <span className="text-[9px] text-muted-foreground">{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        accent ? "border-primary/30 bg-primary/10" : "border-border bg-background",
      )}
    >
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div
        className={cn(
          "mt-1 font-mono text-xl font-bold",
          accent ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

/* ───────────────────────── Backup Button ───────────────────────── */

export function RequestBackupButton({ job }: { job: Job }) {
  const { requestBackup, backupAlerts } = useDispatch();
  const pending = backupAlerts.some((a) => a.jobId === job.id);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => requestBackup(job.id)}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all active:scale-[0.98]",
        pending
          ? "border border-warning/40 bg-warning/10 text-warning"
          : "bg-urgent text-urgent-foreground hover:bg-urgent/90",
      )}
    >
      <ShieldAlert className="h-5 w-5" />
      {pending ? "Backup requested — dispatch alerted" : "Request backup"}
    </button>
  );
}
