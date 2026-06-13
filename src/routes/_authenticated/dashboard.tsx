import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  MapPin,
  Phone,
  Car,
  Clock,
  AlertTriangle,
  Sparkles,
  X,
  CheckCircle2,
  ShieldAlert,
  MessageSquare,
  Wand2,
  Loader2,
  ArrowRight,
  History,
  Camera,
  PenLine,
} from "lucide-react";
import { useDispatch } from "../../lib/dispatch-store";
import type { Driver, HistoryJob, Job, JobType, JobPriority, JobStatus } from "../../lib/seed-data";
import { JOB_PRESETS } from "../../lib/seed-data";
import { JobDetailModal, CompletedJobDetailModal, BILLING_STYLE } from "../../components/job-detail-modal";
import { DispatchMap } from "../../components/dispatch-map";
import { JobTimeline, STATUS_COLOR } from "../../components/job-timeline";
import { parseSmartNotes } from "../../lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";
import { cn } from "../../lib/utils";
import { VinLookup } from "../../components/vin-lookup";
import { OnboardingChecklist } from "../../components/onboarding-checklist";
import { safePublicError } from "../../lib/public-errors";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dispatch Board — Hooked" },
      { name: "description", content: "Live tow dispatch board with driver assignment, SLA alerts, and real-time fleet visibility." },
      { property: "og:title", content: "Dispatch Board — Hooked" },
      { property: "og:description", content: "Live tow dispatch board with driver assignment, SLA alerts, and real-time fleet visibility." },
      { property: "og:url", content: "https://hookaidashboard.com/dashboard" },
    ],
  }),
  component: DispatchBoard,
});

function relMin(ts: number) {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60_000));
  return m < 1 ? "now" : `${m}m ago`;
}

function DispatchBoard() {
  const { jobs, drivers, selectedJobId, setSelectedJob, assignJob, bestDriverFor, detailJobId, openJobDetail, backupAlerts, dismissBackup, smsByJob, updateJobStatus, history } = useDispatch();
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"queue" | "map" | "drivers">("queue");
  const [completedOpen, setCompletedOpen] = useState(false);
  const [completedDetailId, setCompletedDetailId] = useState<string | null>(null);
  const detailJob = jobs.find((j) => j.id === detailJobId) ?? null;
  const completedDetail = history.find((h) => h.id === completedDetailId) ?? null;

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;
  const stalled = jobs.filter(
    (j) => j.status === "Unassigned" && Date.now() - j.receivedAt > 5 * 60_000,
  );
  const urgentCount = jobs.filter((j) => j.priority === "Urgent").length;
  const availableDrivers = drivers.filter((d) => d.status === "Available").length;
  const assignedCount = jobs.filter((j) => j.status !== "Unassigned").length;
  const onSceneCount = jobs.filter((j) => j.status === "OnScene").length;

  const suggestion = selectedJob ? bestDriverFor(selectedJob.id) : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {backupAlerts.map((a) => (
        <div key={a.id} className="flex items-center gap-2 border-b border-urgent/40 bg-urgent/15 px-5 py-2 text-xs text-foreground">
          <ShieldAlert className="h-4 w-4 shrink-0 text-urgent" />
          <span><b className="text-urgent">BACKUP REQUESTED</b> — {a.driverName} needs help at <b>{a.location}</b></span>
          <button
            onClick={() => dismissBackup(a.id)}
            className="ml-auto rounded-md border border-urgent/40 px-2 py-0.5 text-[11px] font-semibold text-urgent hover:bg-urgent/20"
          >
            Acknowledge
          </button>
        </div>
      ))}
      {stalled.length > 0 && (
        <div className="flex items-center gap-2 border-b border-urgent/30 bg-urgent/10 px-5 py-2 text-xs text-foreground">
          <AlertTriangle className="h-4 w-4 text-urgent" />
          <b>{stalled.length}</b> job{stalled.length > 1 ? "s" : ""} unassigned 5+ min —
          <span className="text-muted-foreground">
            {stalled.map((j) => j.caller).join(", ")}
          </span>
        </div>
      )}

      <OnboardingChecklist onNewJob={() => setNewJobOpen(true)} />

      <section className="border-b border-border bg-surface/60 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Dispatch command</div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">Keep calls moving without losing the details</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Work the queue, watch driver readiness, and clear anything that could slow down response time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <InlineStatusChip label="Assigned" value={assignedCount} tone="default" />
            <InlineStatusChip label="On scene" value={onSceneCount} tone="warning" />
            <InlineStatusChip label="Needs attention" value={stalled.length} tone={stalled.length > 0 ? "urgent" : "default"} />
            <button
              onClick={() => setCompletedOpen(true)}
              className="flex h-7 items-center gap-1.5 rounded-full border border-border px-3 text-[11px] font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              <History className="h-3.5 w-3.5" /> Completed jobs ({history.length})
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-px border-b border-border bg-border md:grid-cols-4">
        <SnapshotCard
          label="Active jobs"
          value={String(jobs.length)}
          tone="default"
          detail={`${assignedCount} already moving`}
        />
        <SnapshotCard
          label="Available drivers"
          value={String(availableDrivers)}
          tone="success"
          detail={`${drivers.length} on the board`}
        />
        <SnapshotCard
          label="Urgent calls"
          value={String(urgentCount)}
          tone={urgentCount > 0 ? "warning" : "default"}
          detail={urgentCount > 0 ? "Needs fast response" : "No red-flag calls"}
        />
        <SnapshotCard
          label="Stalled jobs"
          value={String(stalled.length)}
          tone={stalled.length > 0 ? "urgent" : "default"}
          detail={stalled.length > 0 ? "Unassigned for 5+ min" : "Queue under control"}
        />
      </section>

      {/* Mobile tab switcher */}
      <div className="flex shrink-0 border-b border-border bg-surface md:hidden">
        {([
          { k: "queue", label: `Queue (${jobs.length})` },
          { k: "map", label: "Map" },
          { k: "drivers", label: `Drivers (${drivers.filter((d) => d.status === "Available").length})` },
        ] as const).map((t) => (
          <button
            key={t.k}
            onClick={() => setMobileTab(t.k)}
            className={cn(
              "flex-1 px-2 py-2.5 text-xs font-semibold transition-colors",
              mobileTab === t.k ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-px bg-border md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr_300px]">
        {/* Job queue */}
        <section className={cn("min-h-0 flex-col bg-background md:flex", mobileTab === "queue" ? "flex" : "hidden")}>
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Dispatch queue</div>
              <div className="text-sm font-semibold">{jobs.length} active jobs</div>
              <div className="text-[11px] text-muted-foreground">Incoming calls, active tows, and jobs waiting on assignment</div>
            </div>
            <button
              onClick={() => setNewJobOpen(true)}
              className="flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> New
            </button>
          </header>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-background py-10 text-center">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground/40" />
                <div>
                  <div className="text-sm font-semibold text-foreground">Queue is clear</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">No active jobs right now — add one to get started.</div>
                </div>
                <button
                  onClick={() => setNewJobOpen(true)}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-3.5 w-3.5" /> Add first job
                </button>
              </div>
            ) : (
              jobs.map((j) => (
                <JobCard
                  key={j.id}
                  job={j}
                  driver={drivers.find((d) => d.id === j.assignedDriverId)}
                  selected={j.id === selectedJobId}
                  smsCount={smsByJob[j.id]?.length ?? 0}
                  onSetStatus={(s) => updateJobStatus(j.id, s)}
                  onClick={() => {
                    setSelectedJob(j.id);
                    openJobDetail(j.id);
                  }}
                />
              ))
            )}
          </div>
        </section>

        {/* Map */}
        <section className={cn("min-h-0 flex-col bg-background md:flex", mobileTab === "map" ? "flex" : "hidden")}>
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Live map</div>
              <div className="text-sm font-semibold">Fleet position and customer ETAs</div>
              <div className="text-[11px] text-muted-foreground">Live driver availability, urgent alerts, and customer ETAs</div>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <LegendDot color="success" label="Available" />
              <LegendDot color="warning" label="En route" />
              <LegendDot color="urgent" label="Urgent" />
            </div>
          </header>
          <DispatchMap jobs={jobs} drivers={drivers} selectedJob={selectedJob} />
          {selectedJob && (
            <div className="border-t border-border bg-surface p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Selected</div>
                  <div className="truncate text-sm font-semibold">
                    {selectedJob.caller} — {selectedJob.type}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{selectedJob.location}</div>
                </div>
                {suggestion && selectedJob.status === "Unassigned" && (
                  <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <div>
                      <div className="font-semibold text-primary">Best match: {suggestion.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {suggestion.distanceMi} mi · Truck {suggestion.truck}
                      </div>
                    </div>
                    <button
                      onClick={() => assignJob(selectedJob.id, suggestion.id)}
                      className="ml-2 rounded-md bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      Assign
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Drivers */}
        <section className={cn("min-h-0 flex-col bg-background lg:flex", mobileTab === "drivers" ? "flex md:hidden lg:flex" : "hidden")}>
          <header className="border-b border-border px-4 py-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Driver readiness</div>
            <div className="text-sm font-semibold">
              {drivers.filter((d) => d.status === "Available").length} available
            </div>
            <div className="text-[11px] text-muted-foreground">Who can take the next call right now</div>
          </header>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {drivers.map((d) => (
              <DriverRow
                key={d.id}
                driver={d}
                canAssign={
                  selectedJob?.status === "Unassigned" && d.status === "Available"
                }
                onAssign={() => selectedJob && assignJob(selectedJob.id, d.id)}
              />
            ))}
          </div>
        </section>
      </div>

      {newJobOpen && <NewJobModal onClose={() => setNewJobOpen(false)} />}
      {detailJob && <JobDetailModal job={detailJob} onClose={() => openJobDetail(null)} />}
      {completedOpen && (
        <CompletedJobsPanel
          history={history}
          onClose={() => setCompletedOpen(false)}
          onSelect={(id) => setCompletedDetailId(id)}
        />
      )}
      {completedDetail && (
        <CompletedJobDetailModal job={completedDetail} onClose={() => setCompletedDetailId(null)} />
      )}
    </div>
  );
}

function InlineStatusChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "warning" | "urgent";
}) {
  const toneClass =
    tone === "warning"
      ? "border-warning/20 bg-warning/10 text-warning"
      : tone === "urgent"
        ? "border-urgent/20 bg-urgent/10 text-urgent"
        : "border-border bg-background/70 text-foreground";

  return (
    <div className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", toneClass)}>
      {label}: <span className="font-semibold">{value}</span>
    </div>
  );
}

function SnapshotCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "default" | "success" | "warning" | "urgent";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "urgent"
          ? "text-urgent"
          : "text-foreground";

  return (
    <div className="bg-surface px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tracking-tight", toneClass)}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{detail}</div>
    </div>
  );
}

function CompletedJobsPanel({
  history,
  onClose,
  onSelect,
}: {
  history: HistoryJob[];
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">History</div>
            <div className="text-lg font-semibold">Completed jobs</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background py-10 text-center">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground/40" />
              <div>
                <div className="text-sm font-semibold text-foreground">No completed jobs yet</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">Closed jobs will show up here for review.</div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => onSelect(h.id)}
                  className="w-full rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-primary/40 hover:bg-surface-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{h.caller}</div>
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {h.type} · Driver {h.driver} ·{" "}
                        {(h.completedAt ? new Date(h.completedAt) : new Date(h.date)).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {(h.photos?.length ?? 0) > 0 && (
                        <Camera className="h-3.5 w-3.5 text-muted-foreground" aria-label="Photos attached" />
                      )}
                      {(h.signatureUrl || h.signaturePath) && (
                        <PenLine className="h-3.5 w-3.5 text-success" aria-label="Signature on file" />
                      )}
                      <span className="font-mono text-sm font-semibold text-foreground">${h.amount.toFixed(2)}</span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                          BILLING_STYLE[h.billing],
                        )}
                      >
                        {h.billing}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: "success" | "warning" | "urgent"; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={cn("h-2 w-2 rounded-full", color === "success" && "bg-success", color === "warning" && "bg-warning", color === "urgent" && "bg-urgent")} />
      {label}
    </div>
  );
}

const PRIORITY_STYLES: Record<JobPriority, string> = {
  Urgent: "bg-urgent/15 text-urgent border-urgent/30",
  Standard: "bg-warning/15 text-warning border-warning/30",
  Low: "bg-muted text-muted-foreground border-border",
};

function JobCard({
  job,
  driver,
  selected,
  smsCount,
  onSetStatus,
  onClick,
}: {
  job: Job;
  driver?: Driver;
  selected: boolean;
  smsCount: number;
  onSetStatus: (s: JobStatus) => void;
  onClick: () => void;
}) {
  const color = STATUS_COLOR[job.status];
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onClick(); }}
      className={cn(
        "block w-full cursor-pointer rounded-lg border border-l-4 bg-surface p-3 text-left transition-all",
        color.ring,
        color.tint,
        selected
          ? "border-primary glow-primary"
          : "border-border hover:border-primary/40 hover:bg-surface-2",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {job.isIncoming && (
              <span className="shrink-0 rounded-sm bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-300">
                Incoming
              </span>
            )}
            <div className="truncate text-sm font-semibold text-foreground">{job.caller}</div>
          </div>
          <div className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" /> {job.location}
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
            PRIORITY_STYLES[job.priority],
          )}
        >
          {job.priority}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><Car className="h-3 w-3" />{job.vehicle.split(" ").slice(-1)[0]}</span>
        <span className="rounded bg-background px-1.5 py-0.5 font-mono">{job.type}</span>
        {smsCount > 0 && (
          <span className="flex items-center gap-1 rounded bg-background px-1.5 py-0.5">
            <MessageSquare className="h-3 w-3" />{smsCount}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1"><Clock className="h-3 w-3" />{relMin(job.receivedAt)}</span>
      </div>
      {driver && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px]">
          <span className={cn("h-1.5 w-1.5 rounded-full", color.dot)} />
          <span className="text-muted-foreground">{job.status === "OnScene" ? "On scene" : `En route · ETA ${driver.etaMin}m`}</span>
          <span className="ml-auto font-mono text-foreground">{driver.name}</span>
        </div>
      )}
      <div className="mt-2 border-t border-border pt-2">
        <JobTimeline job={job} onSetStatus={onSetStatus} compact />
      </div>
    </div>
  );
}

const DRIVER_STATUS_STYLE: Record<Driver["status"], { dot: string; label: string }> = {
  Available: { dot: "bg-success", label: "Available" },
  EnRoute: { dot: "bg-warning", label: "En route" },
  OnScene: { dot: "bg-warning", label: "On scene" },
  Off: { dot: "bg-muted", label: "Off duty" },
};

function DriverRow({
  driver,
  canAssign,
  onAssign,
}: {
  driver: Driver;
  canAssign: boolean;
  onAssign: () => void;
}) {
  const s = DRIVER_STATUS_STYLE[driver.status];
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-3 transition-colors",
        canAssign && "hover:border-primary",
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background font-mono text-xs font-semibold">
          {driver.name.split(" ").map((n) => n[0]).join("")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{driver.name}</div>
          <div className="text-[11px] text-muted-foreground">Truck {driver.truck} · {driver.distanceMi} mi</div>
        </div>
        <span className={cn("h-2 w-2 rounded-full", s.dot)} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{s.label}{driver.status === "EnRoute" && ` · ETA ${driver.etaMin}m`}</span>
        {canAssign && (
          <button
            onClick={onAssign}
            className="rounded-md bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Assign
          </button>
        )}
      </div>
    </div>
  );
}

// Legacy placeholder MapPane removed — replaced by <DispatchMap />.


const JOB_TYPES: JobType[] = ["Tow", "Lockout", "Jumpstart", "Tire", "Winch"];
const PRIORITIES: JobPriority[] = ["Low", "Standard", "Urgent"];

function NewJobModal({ onClose }: { onClose: () => void }) {
  const { createJob, drivers, assignJob, pricing } = useDispatch();
  const parseFn = useServerFn(parseSmartNotes);
  const [type, setType] = useState<JobType>("Tow");
  const [priority, setPriority] = useState<JobPriority>("Standard");
  const [form, setForm] = useState({
    caller: "",
    phone: "",
    location: "",
    dropoff: "",
    vin: "",
    year: "",
    make: "",
    model: "",
    notes: "",
  });
  const [smartText, setSmartText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseErr, setParseErr] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{
    summary: string;
    action: string;
    missing: string[];
  } | null>(null);
  const [assignPickerJob, setAssignPickerJob] = useState<{ id: string } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const preset = JOB_PRESETS[type];
  // Estimate comes from the company's own pricing settings (base service rate),
  // clearly labeled as a starting estimate — never an AI-guessed final price.
  const estBase = pricing?.base?.[type] ?? preset.price;

  async function runParse() {
    if (!smartText.trim()) return;
    setParsing(true);
    setParseErr(null);
    try {
      const res = await parseFn({ data: { text: smartText } });
      if (!res.ok) {
        setParseErr(
          safePublicError(
            "We couldn't parse those notes right now. Please type the job details manually.",
            res.error,
            "[dashboard] smart notes parse failed",
          ),
        );
        return;
      }
      const p = res.parsed;
      const driverNotes = [p.issue, p.driverNotes, p.cleanedNotes].filter(Boolean).join(" · ");
      setForm((f) => ({
        ...f,
        caller: p.caller ?? f.caller,
        phone: p.phone ?? f.phone,
        location: p.location ?? f.location,
        dropoff: p.dropoffLocation ?? f.dropoff,
        year: p.vehicleYear ? String(p.vehicleYear) : f.year,
        make: p.vehicleMake ?? f.make,
        model: p.vehicleModel ?? f.model,
        notes: driverNotes || f.notes,
      }));
      if (p.serviceType) setType(p.serviceType);
      if (p.priority) setPriority(p.priority);
      setAiResult({
        summary: p.dispatchSummary || "",
        action: p.recommendedAction || "",
        missing: p.missingInfo ?? [],
      });
    } catch (e: any) {
      setParseErr(
        safePublicError(
          "We couldn't parse those notes right now. Please type the job details manually.",
          e,
          "[dashboard] smart notes parse failed",
        ),
      );
    } finally {
      setParsing(false);
    }
  }

  async function save(autoAssign: boolean) {
    if (!form.caller || !form.location) return;
    setSaveError(null);
    const vehicle = [form.year, form.make, form.model].filter(Boolean).join(" ");
    const notes = [form.dropoff ? `Drop-off: ${form.dropoff}` : "", form.notes]
      .filter(Boolean)
      .join(" — ");
    const job = await createJob({
      caller: form.caller,
      phone: form.phone,
      location: form.location,
      vehicle,
      notes,
      type,
      priority,
    });
    if (!job) {
      setSaveError("Job could not be saved. Check your connection and try again.");
      return;
    }
    if (autoAssign) {
      setAssignPickerJob({ id: job.id });
    } else {
      onClose();
    }
  }

  if (assignPickerJob) {
    return (
      <AssignPicker
        jobId={assignPickerJob.id}
        drivers={drivers}
        onClose={onClose}
        onAssign={async (driverId) => {
          const result = await assignJob(assignPickerJob.id, driverId);
          if (result.error) {
            setSaveError(result.error);
            setAssignPickerJob(null);
            return;
          }
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-3 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Quick entry</div>
            <div className="text-base font-semibold">New job</div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* Call notes */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Call notes — describe the call, and the form fills in the details
            </label>
            <textarea
              value={smartText}
              onChange={(e) => setSmartText(e.target.value)}
              rows={2}
              className={cn(inputCls, "mt-2 text-sm")}
              placeholder="e.g. Amanda at 415 555 0132, blue 2019 Honda Civic, flat tire on shoulder of I-280 mile 42"
            />
            {parseErr && <div className="mt-1 text-[11px] text-urgent">{parseErr}</div>}
            <button
              type="button"
              onClick={runParse}
              disabled={parsing || !smartText.trim()}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {parsing ? "Parsing…" : "Fill form"}
            </button>

            {aiResult && (
              <div className="mt-3 space-y-2 border-t border-primary/20 pt-3">
                {aiResult.summary && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Dispatch-ready summary
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-foreground">{aiResult.summary}</p>
                  </div>
                )}
                {aiResult.action && (
                  <div className="flex items-start gap-1.5 text-xs text-primary">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span><span className="font-semibold">Next:</span> {aiResult.action}</span>
                  </div>
                )}
                {aiResult.missing.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-warning">
                      <AlertTriangle className="h-3.5 w-3.5" /> Missing:
                    </span>
                    {aiResult.missing.map((m) => (
                      <span key={m} className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] text-warning">
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Customer name">
              <input required value={form.caller} onChange={(e) => setForm({ ...form, caller: e.target.value })} className={cn(inputCls, "text-base")} placeholder="Jane Smith" />
            </Field>
            <Field label="Phone">
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={cn(inputCls, "text-base")} placeholder="(555) 123-4567" />
            </Field>
          </div>
          <Field label="Pickup location">
            <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={cn(inputCls, "text-base")} placeholder="I-280 N, mile 42" />
          </Field>
          <Field label="Drop-off location (tows)">
            <input value={form.dropoff} onChange={(e) => setForm({ ...form, dropoff: e.target.value })} className={cn(inputCls, "text-base")} placeholder="Toyota of San Francisco" />
          </Field>
          <Field label="VIN (optional — auto-fills vehicle)">
            <VinLookup
              vin={form.vin}
              onVinChange={(v) => setForm({ ...form, vin: v })}
              onResult={(r) => setForm((f) => ({
                ...f,
                year: r.year ? String(r.year) : f.year,
                make: r.make ?? f.make,
                model: r.model ?? f.model,
              }))}
            />
          </Field>
          <Field label="Vehicle (Year / Make / Model)">
            <div className="grid grid-cols-3 gap-2">
              <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value.replace(/\D/g, "").slice(0, 4) })} className={cn(inputCls, "text-base")} placeholder="2019" inputMode="numeric" />
              <input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} className={cn(inputCls, "text-base")} placeholder="Honda" />
              <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className={cn(inputCls, "text-base")} placeholder="Civic" />
            </div>
          </Field>

          <Field label="Service type">
            <div className="grid grid-cols-3 gap-2">
              {JOB_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "rounded-lg border px-3 py-3 text-sm font-semibold transition-colors",
                    type === t ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t === "Tire" ? "Flat Tire" : t === "Winch" ? "Winch" : t}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Priority">
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "rounded-md border px-2 py-2 text-xs font-medium transition-colors",
                    priority === p ? cn(PRIORITY_STYLES[p], "border") : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Notes (optional)">
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} placeholder="Anything driver should know" />
          </Field>

          <div className="rounded-md border border-border bg-background p-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Estimated price</span>
              <span className="font-mono text-sm font-semibold text-primary">~${estBase}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Estimated duration</span>
              <span className="font-mono text-sm font-semibold">{preset.durationMin} min</span>
            </div>
            <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
              Starting estimate from your {type} base rate — final price adds mileage &amp; any fees.
            </p>
          </div>
        </div>

        <div className="border-t border-border bg-surface p-3">
          {saveError && (
            <div className="mb-2 flex items-center gap-2 rounded-md border border-urgent/40 bg-urgent/10 px-3 py-2 text-xs text-urgent">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {saveError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => save(false)}
              disabled={!form.caller || !form.location}
              className="rounded-lg border border-border px-3 py-3 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50"
            >
              Save & Assign Later
            </button>
            <button
              type="button"
              onClick={() => save(true)}
              disabled={!form.caller || !form.location}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" /> Save & Assign Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignPicker({
  jobId,
  drivers,
  onAssign,
  onClose,
}: {
  jobId: string;
  drivers: Driver[];
  onAssign: (driverId: string) => Promise<void>;
  onClose: () => void;
}) {
  const available = useMemo(
    () => [...drivers].filter((d) => d.status === "Available").sort((a, b) => a.distanceMi - b.distanceMi),
    [drivers],
  );
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-3 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Assign driver</div>
            <div className="text-sm font-semibold">Closest available</div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto p-3">
          {available.length === 0 && (
            <div className="rounded-md border border-border bg-background p-4 text-center text-sm text-muted-foreground">
              No available drivers right now. Job saved unassigned.
            </div>
          )}
          {available.map((d) => (
            <button
              key={d.id}
              onClick={() => onAssign(d.id)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-3 text-left hover:border-primary hover:bg-primary/5"
            >
              <div>
                <div className="text-sm font-semibold">{d.name}</div>
                <div className="text-[11px] text-muted-foreground">Truck {d.truck} · {d.distanceMi} mi</div>
              </div>
              <span className="rounded-md bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">Assign</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full border-t border-border py-3 text-sm font-medium text-muted-foreground hover:bg-accent">
          Skip for now
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none";

// Silence unused (Phone icon kept for future)
void Phone;
