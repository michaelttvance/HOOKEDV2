import { useState } from "react";
import {
  X,
  Phone,
  MapPin,
  Car,
  FileText,
  Camera,
  Clock,
  CheckCircle2,
  Sparkles,
  Link2,
  Check,
  PenLine,
} from "lucide-react";
import { MessageSquare, Loader2, Copy } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useDispatch } from "../lib/dispatch-store";
import { generateFollowUp, type FollowUpScenario } from "../lib/ai.functions";
import { safePublicError } from "../lib/public-errors";
import { resolveMediaUrl, trackingUrl, useResolvedMediaUrl } from "../lib/media";
import type { HistoryJob, Job, JobStatus } from "../lib/seed-data";
import { cn } from "../lib/utils";

type CloseOutcome = "cancelled" | "goa";

const TIMELINE: { key: JobStatus | "Received"; label: string }[] = [
  { key: "Received", label: "Received" },
  { key: "Assigned", label: "Assigned" },
  { key: "EnRoute", label: "En Route" },
  { key: "OnScene", label: "On Scene" },
  { key: "Complete", label: "Complete" },
];

function statusIndex(s: JobStatus): number {
  // Received always reached
  const order: JobStatus[] = ["Unassigned", "Assigned", "EnRoute", "OnScene", "Complete"];
  return order.indexOf(s);
}

function PhotoThumb({ photo }: { photo: NonNullable<Job["photos"]>[number] }) {
  const photoUrl = useResolvedMediaUrl(photo);
  return photoUrl ? (
    <a
      href={photoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative h-20 w-20 overflow-hidden rounded-md border border-border"
      title={`${photo.label} · ${new Date(photo.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
    >
      {/* Legacy public URLs still render here today.
          Once job-media is private, this hook upgrades to a signed URL whenever a storage path exists. */}
      <img src={photoUrl} alt={photo.label} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
      <span className="absolute inset-x-0 bottom-0 bg-black/65 px-1 py-0.5 text-[8px] font-semibold text-white">
        {photo.label}
      </span>
    </a>
  ) : (
    <div className="flex h-20 w-20 items-center justify-center rounded-md border border-border bg-background text-[9px] text-muted-foreground">
      {photo.label}
    </div>
  );
}

export function JobDetailModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const {
    drivers,
    assignJob,
    bestDriverFor,
    updateJobStatus,
    closeJob,
    smsByJob,
    companyName,
    googleReviewUrl,
  } = useDispatch();
  const driver = drivers.find((d) => d.id === job.assignedDriverId);
  const suggestion = job.status === "Unassigned" ? bestDriverFor(job.id) : null;
  const smsLog = smsByJob[job.id] ?? [];
  const [notes, setNotes] = useState(job.notes ?? "");
  const jobPhotos = job.photos ?? [];
  const [linkCopied, setLinkCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function copyTrackingLink() {
    if (!job.publicToken) return;
    const url = trackingUrl(job.id, job.publicToken);
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      window.prompt("Copy this tracking link", url);
    }
  }

  // ── Follow-up drafting ──
  const draftFn = useServerFn(generateFollowUp);
  const [followScenario, setFollowScenario] = useState<FollowUpScenario | null>(null);
  const [followText, setFollowText] = useState("");
  const [followBusy, setFollowBusy] = useState(false);
  const [followErr, setFollowErr] = useState<string | null>(null);
  const [followCopied, setFollowCopied] = useState(false);
  const dropoff = job.notes?.match(/Drop-?off:\s*([^—]+)/i)?.[1]?.trim() ?? null;
  const signatureUrl = resolveMediaUrl(
    job.signaturePath ? { path: job.signaturePath, url: job.signatureUrl } : job.signatureUrl,
  );

  async function draft(scenario: FollowUpScenario) {
    setFollowScenario(scenario);
    setFollowBusy(true);
    setFollowErr(null);
    setFollowText("");
    try {
      const res = await draftFn({
        data: {
          scenario,
          context: {
            customerName: job.caller,
            companyName,
            serviceType: job.type,
            vehicle: job.vehicle,
            pickupLocation: job.location,
            dropoffLocation: dropoff,
            estimatedPrice: job.estPrice,
            etaMinutes: driver?.etaMin ?? null,
            reviewUrl: googleReviewUrl || null,
            amountDue: job.estPrice,
          },
        },
      });
      if (res.ok) setFollowText(res.message);
      else {
        setFollowErr(
          safePublicError(
            "We couldn't draft that message right now. Please try again or edit it manually.",
            res.error,
            "[job-detail] follow-up draft failed",
          ),
        );
      }
    } catch (e) {
      setFollowErr(
        safePublicError(
          "We couldn't draft that message right now. Please try again or edit it manually.",
          e,
          "[job-detail] follow-up draft failed",
        ),
      );
    } finally {
      setFollowBusy(false);
    }
  }

  async function copyFollow() {
    try {
      await navigator.clipboard.writeText(followText);
      setFollowCopied(true);
      setTimeout(() => setFollowCopied(false), 1800);
    } catch {
      window.prompt("Copy message", followText);
    }
  }

  // Highlight timeline based on current job status
  const idx = statusIndex(job.status);
  const reached = (k: JobStatus | "Received") => {
    if (k === "Received") return true;
    return statusIndex(k as JobStatus) <= idx;
  };

  async function closeWithConfirm(outcome: CloseOutcome) {
    const label = outcome === "goa" ? "Mark GOA" : "Cancel job";
    const details =
      outcome === "goa"
        ? "Gone on arrival — the driver was dispatched but the customer was not at the location. The driver will be released and the job will be closed."
        : "This will cancel the job before service is complete. Any assigned driver will be released and the job will be closed.";
    if (!window.confirm(`${label} for ${job.caller}?\n\n${details}`)) return;
    const ok = await closeJob(job.id, outcome);
    if (ok !== false) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Job {job.id.toUpperCase()} · {job.type}
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  job.priority === "Urgent"
                    ? "border-urgent/40 bg-urgent/15 text-urgent"
                    : job.priority === "Standard"
                      ? "border-warning/40 bg-warning/15 text-warning"
                      : "border-border text-muted-foreground",
                )}
              >
                {job.priority}
              </span>
            </div>
            <div className="mt-1 truncate text-xl font-semibold">{job.caller}</div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <a
                href={`tel:${job.phone.replace(/\D/g, "")}`}
                className="inline-flex items-center gap-1.5 font-mono text-sm text-primary hover:underline"
              >
                <Phone className="h-3.5 w-3.5" /> {job.phone}
              </a>
              {job.publicToken && (
                <button
                  onClick={copyTrackingLink}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
                  title="Copy the customer-facing live tracking link"
                >
                  {linkCopied ? <Check className="h-3 w-3 text-success" /> : <Link2 className="h-3 w-3" />}
                  {linkCopied ? "Copied!" : "Copy tracking link"}
                </button>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-px overflow-y-auto bg-border md:grid-cols-2">
          {/* Left column */}
          <div className="space-y-4 bg-surface p-5">
            <Section title="Details">
              <Row icon={Car}>{job.vehicle}</Row>
              <Row icon={MapPin}>{job.location}</Row>
              <Row icon={Clock}>
                Received {new Date(job.receivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                <span className="text-muted-foreground"> · est. ${job.estPrice} · {job.estDurationMin} min</span>
              </Row>
              {driver && (
                <Row icon={CheckCircle2}>
                  Assigned to <b>{driver.name}</b>{" "}
                  <span className="text-muted-foreground">(Truck {driver.truck} · ETA {driver.etaMin}m)</span>
                </Row>
              )}
            </Section>

            <Section title="Mini map">
              <div className="relative h-44 overflow-hidden rounded-lg border border-border grid-bg bg-background">
                <svg className="absolute inset-0 h-full w-full opacity-25" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path d="M0 30 Q 40 20 70 50 T 100 70" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-foreground" />
                  <path d="M10 90 Q 30 60 60 65 T 100 40" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-foreground" />
                </svg>
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${job.lat}%`, top: `${job.lng}%` }}
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 border-background ring-2 ring-primary",
                    job.priority === "Urgent" ? "bg-urgent" : "bg-warning",
                  )}>
                    <MapPin className="h-4 w-4 text-background" />
                  </div>
                </div>
                {driver && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${driver.lat}%`, top: `${driver.lng}%` }}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-background bg-success font-mono text-[10px] font-bold text-background">
                      {driver.truck.replace("T-", "")}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {suggestion && (
              <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 p-3 text-xs">
                <Sparkles className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <div className="font-semibold text-primary">Best match: {suggestion.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Truck {suggestion.truck} · {suggestion.distanceMi} mi out
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const r = await assignJob(job.id, suggestion.id);
                    if (r.error) setActionError(r.error);
                  }}
                  className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Assign
                </button>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4 bg-surface p-5">
            <Section title="Status timeline">
              <ol className="space-y-2.5">
                {TIMELINE.map((step, i) => {
                  const done = reached(step.key);
                  const current =
                    (step.key === "Received" && job.status === "Unassigned") ||
                    step.key === job.status;
                  return (
                    <li key={step.key} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold",
                          done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground",
                        )}
                      >
                        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                      </span>
                      <span className={cn("text-sm", current ? "font-semibold text-foreground" : done ? "text-foreground" : "text-muted-foreground")}>
                        {step.label}
                      </span>
                      {current && (
                        <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                          Now
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
              {job.assignedDriverId && job.status !== "Complete" && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(["EnRoute", "OnScene", "Complete"] as JobStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={async () => {
                        try {
                          await updateJobStatus(job.id, s);
                        } catch (e) {
                          setActionError(e instanceof Error ? e.message : "Status update failed — please try again.");
                        }
                      }}
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      Mark {s === "EnRoute" ? "En Route" : s === "OnScene" ? "On Scene" : "Complete"}
                    </button>
                  ))}
                </div>
              )}
              {actionError && (
                <div className="mt-2 text-[11px] text-urgent">{actionError}</div>
              )}
              <div className="mt-3 rounded-md border border-border bg-background p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Close job
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => closeWithConfirm("cancelled")}
                    className="rounded-md border border-border bg-surface px-3 py-2 text-[11px] font-semibold text-muted-foreground hover:border-urgent/40 hover:text-urgent"
                  >
                    Cancel job
                  </button>
                  <button
                    onClick={() => closeWithConfirm("goa")}
                    className="rounded-md border border-border bg-surface px-3 py-2 text-[11px] font-semibold text-muted-foreground hover:border-warning/40 hover:text-warning"
                  >
                    Mark GOA
                  </button>
                </div>
                <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                  Closed jobs leave the active queue, release the assigned driver, and stay on the job record for audit history.
                </p>
              </div>
            </Section>

            <Section title="Notes">
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add dispatch notes…"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </Section>

            <Section title={
              <span className="flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5" /> Photos ({jobPhotos.length})
              </span>
            }>
              {jobPhotos.length === 0 ? (
                <div className="rounded-md border border-dashed border-border bg-background p-3 text-center text-[11px] text-muted-foreground">
                  No photos yet. Drivers capture condition photos from the driver app.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {jobPhotos.map((p) => (
                    <PhotoThumb key={p.path ?? p.url ?? `${p.label}-${p.ts}`} photo={p} />
                  ))}
                </div>
              )}
              {signatureUrl && (
                <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/5 p-2">
                  <PenLine className="h-3.5 w-3.5 shrink-0 text-success" />
                  <span className="flex-1 text-[11px] text-muted-foreground">Customer signature on file</span>
                  <img src={signatureUrl} alt="Signature" className="h-8 w-20 rounded border border-border bg-background object-contain" />
                </div>
              )}
            </Section>

            <Section title={
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> SMS Log ({smsLog.length})
              </span>
            }>
              {smsLog.length === 0 ? (
                <div className="rounded-md border border-dashed border-border bg-background p-3 text-center text-[11px] text-muted-foreground">
                  No messages sent yet. Status changes auto-text the customer.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {smsLog.map((m) => (
                    <div key={m.id} className="rounded-md border border-border bg-background p-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold uppercase tracking-wider text-muted-foreground">{m.kind.replace("_", " ")}</span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[9px] font-bold",
                            m.status === "sent" ? "bg-success/15 text-success" :
                            m.status === "failed" ? "bg-urgent/15 text-urgent" :
                            "bg-warning/15 text-warning",
                          )}
                        >
                          {m.status}
                        </span>
                      </div>
                      <div className="mt-1 text-foreground">{m.body}</div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        to {m.toPhone} · {new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title={
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Follow-up messages
              </span>
            }>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { k: "quote_followup", label: "Quote follow-up" },
                  { k: "eta_update", label: "ETA update" },
                  { k: "payment_reminder", label: "Payment reminder" },
                  { k: "impound_release", label: "Impound release" },
                  { k: "review_request", label: "Review request" },
                ] as { k: FollowUpScenario; label: string }[]).map((s) => (
                  <button
                    key={s.k}
                    onClick={() => draft(s.k)}
                    disabled={followBusy}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-50",
                      followScenario === s.k
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {followBusy && (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Drafting…
                </div>
              )}
              {followErr && <div className="mt-2 text-[11px] text-urgent">{followErr}</div>}

              {followText && !followBusy && (
                <div className="mt-2">
                  <textarea
                    rows={4}
                    value={followText}
                    onChange={(e) => setFollowText(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{followText.length} chars · edit before sending</span>
                    <button
                      onClick={copyFollow}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      {followCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {followCopied ? "Copied!" : "Copy message"}
                    </button>
                  </div>
                </div>
              )}
            </Section>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-2 px-6 py-4">
          <div className="text-xs text-muted-foreground">
            Estimated total <span className="font-mono text-base font-semibold text-foreground">${job.estPrice}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
            <div className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground opacity-60 cursor-not-allowed select-none">
              <FileText className="h-4 w-4" />
              Invoice generation not enabled yet
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const BILLING_STYLE: Record<HistoryJob["billing"], string> = {
  Paid: "border-success/40 bg-success/15 text-success",
  Invoiced: "border-primary/40 bg-primary/15 text-primary",
  Pending: "border-warning/40 bg-warning/15 text-warning",
};

export function CompletedJobDetailModal({ job, onClose }: { job: HistoryJob; onClose: () => void }) {
  const photos = job.photos ?? [];
  const signatureRef = job.signaturePath
    ? { path: job.signaturePath, url: job.signatureUrl }
    : job.signatureUrl;
  const signatureUrl = useResolvedMediaUrl(signatureRef);
  const hasProof = photos.length > 0 || !!signatureUrl;
  const completedDate = job.completedAt ? new Date(job.completedAt) : new Date(job.date);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Job {job.id.toUpperCase()} · {job.type}
              <span className="rounded-full border border-success/40 bg-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success">
                Complete
              </span>
            </div>
            <div className="mt-1 truncate text-xl font-semibold">{job.caller}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Completed{" "}
              {completedDate.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} ·{" "}
              {completedDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <Section title="Job summary">
            <Row icon={Car}>
              {job.type} <span className="text-muted-foreground">· Driver</span> <b>{job.driver}</b>
            </Row>
            <Row icon={Clock}>
              {job.durationMin != null
                ? `${job.durationMin} min on job`
                : `${job.responseMin} min response`}
            </Row>
            <Row icon={FileText}>
              <span className="font-mono font-semibold text-foreground">${job.amount.toFixed(2)}</span>{" "}
              <span
                className={cn(
                  "ml-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  BILLING_STYLE[job.billing],
                )}
              >
                {job.billing}
              </span>
            </Row>
          </Section>

          <Section
            title={
              <span className="flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5" /> Proof of service
              </span>
            }
          >
            {!hasProof ? (
              <div className="rounded-md border border-dashed border-border bg-background p-3 text-center text-[11px] text-muted-foreground">
                No proof files were attached to this completed job.
              </div>
            ) : (
              <>
                {photos.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Photos ({photos.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {photos.map((p) => (
                        <PhotoThumb key={p.path ?? p.url ?? `${p.label}-${p.ts}`} photo={p} />
                      ))}
                    </div>
                  </div>
                )}
                {signatureUrl && (
                  <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/5 p-2">
                    <PenLine className="h-3.5 w-3.5 shrink-0 text-success" />
                    <span className="flex-1 text-[11px] text-muted-foreground">Customer signature on file</span>
                    <img
                      src={signatureUrl}
                      alt="Customer signature"
                      className="h-10 w-24 rounded border border-border bg-background object-contain"
                    />
                  </div>
                )}
              </>
            )}
          </Section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-2 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="space-y-2">{children}</div>
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
