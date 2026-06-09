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
} from "lucide-react";
import { MessageSquare } from "lucide-react";
import { useDispatch } from "../lib/dispatch-store";
import type { Job, JobStatus } from "../lib/seed-data";
import { cn } from "../lib/utils";

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

export function JobDetailModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const { drivers, assignJob, bestDriverFor, updateJobStatus, invoiceHistory, history, smsByJob } =
    useDispatch();
  const driver = drivers.find((d) => d.id === job.assignedDriverId);
  const suggestion = job.status === "Unassigned" ? bestDriverFor(job.id) : null;
  const smsLog = smsByJob[job.id] ?? [];
  const [notes, setNotes] = useState(job.notes ?? "");
  const [photos, setPhotos] = useState<string[]>([]);
  const [invoiced, setInvoiced] = useState(false);

  // Highlight timeline based on current job status
  const idx = statusIndex(job.status);
  const reached = (k: JobStatus | "Received") => {
    if (k === "Received") return true;
    return statusIndex(k as JobStatus) <= idx;
  };

  function genInvoice() {
    // archive into history as Invoiced
    const id = `h-inv-${job.id}-${Date.now()}`;
    history.unshift({
      id,
      date: new Date().toISOString().slice(0, 10),
      caller: job.caller,
      type: job.type,
      driver: driver?.name ?? "—",
      amount: job.estPrice,
      billing: "Pending",
      responseMin: Math.max(5, Math.round((Date.now() - job.receivedAt) / 60000)),
    });
    invoiceHistory(id);
    setInvoiced(true);
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
            <a
              href={`tel:${job.phone.replace(/\D/g, "")}`}
              className="mt-1 inline-flex items-center gap-1.5 font-mono text-sm text-primary hover:underline"
            >
              <Phone className="h-3.5 w-3.5" /> {job.phone}
            </a>
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
                  <div className="font-semibold text-primary">AI suggests {suggestion.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Truck {suggestion.truck} · {suggestion.distanceMi} mi out
                  </div>
                </div>
                <button
                  onClick={() => assignJob(job.id, suggestion.id)}
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
                      onClick={() => updateJobStatus(job.id, s)}
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      Mark {s === "EnRoute" ? "En Route" : s === "OnScene" ? "On Scene" : "Complete"}
                    </button>
                  ))}
                </div>
              )}
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

            <Section title="Photos">
              <div className="flex flex-wrap gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-background text-[10px] text-muted-foreground">
                    {p}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setPhotos((p) => [...p, `IMG_${p.length + 1}`])}
                  className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-[10px] text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <Camera className="h-4 w-4" />
                  Upload
                </button>
              </div>
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
            <button
              onClick={genInvoice}
              disabled={invoiced}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:bg-primary/90 disabled:opacity-60"
            >
              <FileText className="h-4 w-4" />
              {invoiced ? "Invoice generated" : "Generate Invoice"}
            </button>
          </div>
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
