import { Check, Circle } from "lucide-react";
import { cn } from "../lib/utils";
import type { Job, JobStatus } from "../lib/seed-data";

export const STATUS_ORDER: JobStatus[] = ["Unassigned", "Assigned", "EnRoute", "OnScene", "Complete"];

export const STATUS_COLOR: Record<JobStatus, { ring: string; tint: string; label: string; dot: string }> = {
  Unassigned: { ring: "border-l-urgent", tint: "bg-urgent/5", label: "text-urgent", dot: "bg-urgent" },
  Assigned:   { ring: "border-l-primary", tint: "bg-primary/5", label: "text-primary", dot: "bg-primary" },
  EnRoute:    { ring: "border-l-warning", tint: "bg-warning/5", label: "text-warning", dot: "bg-warning" },
  OnScene:    { ring: "border-l-orange-500", tint: "bg-orange-500/5", label: "text-orange-500", dot: "bg-orange-500" },
  Complete:   { ring: "border-l-success", tint: "bg-success/5", label: "text-success", dot: "bg-success" },
};

const STEP_LABELS: Record<JobStatus, string> = {
  Unassigned: "Received",
  Assigned: "Assigned",
  EnRoute: "En Route",
  OnScene: "On Scene",
  Complete: "Complete",
};

function stepTimestamp(job: Job, step: JobStatus): number | undefined {
  switch (step) {
    case "Unassigned": return job.receivedAt;
    case "Assigned": return job.assignedAt;
    case "EnRoute": return job.enRouteAt;
    case "OnScene": return job.onSceneAt;
    case "Complete": return undefined;
  }
}

function fmt(ts: number | undefined) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function JobTimeline({
  job,
  onSetStatus,
  compact = false,
}: {
  job: Job;
  onSetStatus?: (s: JobStatus) => void;
  compact?: boolean;
}) {
  const currentIdx = STATUS_ORDER.indexOf(job.status);
  return (
    <div className={cn("flex items-center gap-1", compact ? "text-[9px]" : "text-[10px]")}>
      {STATUS_ORDER.slice(0, 5).map((step, i) => {
        const done = i <= currentIdx;
        const ts = stepTimestamp(job, step);
        const isCurrent = i === currentIdx;
        return (
          <button
            key={step}
            type="button"
            onClick={
              onSetStatus
                ? (e) => { e.stopPropagation(); onSetStatus(step); }
                : undefined
            }
            disabled={!onSetStatus}
            className={cn(
              "group flex flex-1 flex-col items-center gap-0.5 rounded px-1 py-1 transition-colors",
              onSetStatus && "hover:bg-accent cursor-pointer",
            )}
            title={ts ? `${STEP_LABELS[step]} · ${fmt(ts)}` : STEP_LABELS[step]}
          >
            <div className="flex w-full items-center">
              {i > 0 && <div className={cn("h-px flex-1", done ? "bg-primary/60" : "bg-border")} />}
              <div
                className={cn(
                  "flex h-3.5 w-3.5 items-center justify-center rounded-full border",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground",
                  isCurrent && "ring-2 ring-primary/40",
                )}
              >
                {done ? <Check className="h-2 w-2" /> : <Circle className="h-1.5 w-1.5" />}
              </div>
              {i < 4 && <div className={cn("h-px flex-1", i < currentIdx ? "bg-primary/60" : "bg-border")} />}
            </div>
            <div className={cn("truncate font-medium", done ? "text-foreground" : "text-muted-foreground")}>
              {STEP_LABELS[step]}
            </div>
            <div className="text-muted-foreground">{ts ? fmt(ts) : "—"}</div>
          </button>
        );
      })}
    </div>
  );
}
