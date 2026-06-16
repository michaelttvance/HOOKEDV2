import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  GitBranch,
  GitPullRequest,
  Loader2,
  Play,
  Rocket,
  Terminal,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// ── auth gate ────────────────────────────────────────────────────────────────

const ALLOWED_EMAILS = [
  "mike@hookaidashboard.com",
  "michaelttvance@gmail.com",
  "michaelthomasvance@gmail.com",
];

export const Route = createFileRoute("/command-center-admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Command Center Admin — Hooked" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: "/command-center-admin" } });
    }
    if (!ALLOWED_EMAILS.includes((data.user.email ?? "").toLowerCase())) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: CommandCenterAdmin,
});

// ── types (mirrors src/lib/agent-task-store.ts) ──────────────────────────────

type RiskLevel = "low" | "medium" | "high";
type TaskStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "workflow_triggered"
  | "running"
  | "completed"
  | "failed";

interface AgentTask {
  id: string;
  title: string;
  prompt: string;
  riskLevel: RiskLevel;
  targetArea: string;
  status: TaskStatus;
  createdAt: string;
  triggeredAt?: string;
  workflowRunUrl?: string;
}

interface StatusData {
  pr: { number: number; branch: string; commit: string; state: string; stateLabel: string };
  counts: { complete: number; verify: number; blockers: number };
  deployment: { state: string; previewAlias: string; previewLatest: string };
  tasks: AgentTask[];
  _meta: { source: string; timestamp: string };
}

interface ActionResult {
  ok: boolean;
  error?: string;
  taskId?: string;
  task?: AgentTask;
  status?: string;
  workflowRunUrl?: string;
}

// ── api helpers ───────────────────────────────────────────────────────────────

async function fetchStatus(): Promise<StatusData> {
  const res = await fetch("/api/command-center/status");
  if (!res.ok) throw new Error(`Status fetch failed: HTTP ${res.status}`);
  return res.json();
}

async function postAction(body: Record<string, unknown>): Promise<ActionResult> {
  const res = await fetch("/api/command-center/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ── root component ────────────────────────────────────────────────────────────

function CommandCenterAdmin() {
  const qc = useQueryClient();

  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["cc-status"],
    queryFn: fetchStatus,
    refetchInterval: 15_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cc-status"] });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── header ── */}
      <header className="border-b border-border bg-surface/80 px-4 py-4 shadow-sm backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/founder"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Founder
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-primary">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Command Center Admin</h1>
              <p className="text-xs text-muted-foreground">
                Create and trigger GitHub Actions workflows from the browser
              </p>
            </div>
          </div>
          {dataUpdatedAt > 0 && (
            <p className="text-xs text-muted-foreground">
              Last synced{" "}
              <span className="font-mono">
                {new Date(dataUpdatedAt).toLocaleTimeString()}
              </span>{" "}
              · auto-refresh every 15s
            </p>
          )}
        </div>
      </header>

      {/* ── main ── */}
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        {isLoading && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading command center status…
          </div>
        )}
        {error && (
          <Banner variant="error">
            <strong>Failed to load status.</strong>{" "}
            {error instanceof Error ? error.message : "Unknown error"} — is the dev server
            running?
          </Banner>
        )}

        {data && (
          <>
            <StatusRow data={data} />
            <TaskQueue tasks={data.tasks} onAction={invalidate} />
            <CreateTaskForm onAction={invalidate} />
            <FutureActions />
          </>
        )}

        {/* Show even when no data yet so the form is always usable */}
        {!data && !isLoading && (
          <>
            <CreateTaskForm onAction={invalidate} />
            <FutureActions />
          </>
        )}
      </main>
    </div>
  );
}

// ── status row ────────────────────────────────────────────────────────────────

function StatusRow({ data }: { data: StatusData }) {
  const prColor =
    data.pr.state === "merged"
      ? "text-green-400"
      : data.pr.state === "open"
        ? "text-blue-400"
        : "text-yellow-400";

  const depColor = data.deployment.state === "READY" ? "text-green-400" : "text-yellow-400";

  return (
    <section>
      <SectionHeading icon={Activity} title="Project Status" />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={GitPullRequest}
          label={`PR #${data.pr.number}`}
          value={<span className={prColor}>{data.pr.stateLabel}</span>}
          sub={`${data.pr.branch} · ${data.pr.commit}`}
        />
        <StatCard
          icon={Rocket}
          label="Deployment"
          value={<span className={depColor}>{data.deployment.state}</span>}
          sub={data.deployment.previewAlias}
        />
        <StatCard
          icon={CheckCircle2}
          label="Counts"
          value={`${data.counts.complete} done`}
          sub={`${data.counts.verify} to verify · ${data.counts.blockers} blockers`}
        />
      </div>
    </section>
  );
}

// ── task queue ────────────────────────────────────────────────────────────────

function TaskQueue({
  tasks,
  onAction,
}: {
  tasks: AgentTask[];
  onAction: () => void;
}) {
  return (
    <section>
      <SectionHeading icon={Clock} title="Task Queue" sub={`${tasks.length} task${tasks.length !== 1 ? "s" : ""}`} />
      {tasks.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-sm text-muted-foreground shadow-sm">
          No tasks yet — create one below.
        </p>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} onAction={onAction} />
          ))}
        </div>
      )}
    </section>
  );
}

function TaskRow({ task, onAction }: { task: AgentTask; onAction: () => void }) {
  const approveMutation = useMutation({
    mutationFn: () => postAction({ type: "approve_task", taskId: task.id }),
    onSuccess: onAction,
  });

  const triggerMutation = useMutation({
    mutationFn: () =>
      postAction({ type: "trigger_agent_workflow", taskId: task.id }),
    onSuccess: onAction,
  });

  const triggerResult = triggerMutation.data;
  const approveResult = approveMutation.data;
  const busy = approveMutation.isPending || triggerMutation.isPending;

  const canApprove = task.status === "pending";
  const canTrigger = task.status === "pending" || task.status === "approved";

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm">{task.title}</span>
            <TaskBadge status={task.status} />
            <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {task.id}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {task.targetArea} ·{" "}
            <RiskPill level={task.riskLevel} /> · created{" "}
            {new Date(task.createdAt).toLocaleTimeString()}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">{task.prompt}</p>
          {task.workflowRunUrl && (
            <a
              href={task.workflowRunUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
            >
              <Zap className="h-3 w-3" /> View workflow run
              <ChevronRight className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => approveMutation.mutate()}
            disabled={!canApprove || busy}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
              canApprove && !busy
                ? "border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                : "cursor-not-allowed border border-border bg-surface text-muted-foreground opacity-40",
            )}
          >
            {approveMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Approve
          </button>

          <button
            onClick={() => triggerMutation.mutate()}
            disabled={!canTrigger || busy}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
              canTrigger && !busy
                ? "border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                : "cursor-not-allowed border border-border bg-surface text-muted-foreground opacity-40",
            )}
          >
            {triggerMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            Trigger
          </button>
        </div>
      </div>

      {/* inline feedback */}
      {approveResult && !approveResult.ok && (
        <Banner variant="error" className="mt-3 text-xs">
          {approveResult.error}
        </Banner>
      )}
      {triggerResult && !triggerResult.ok && triggerResult.error?.includes("GITHUB_TOKEN") && (
        <SetupRequired className="mt-3" />
      )}
      {triggerResult && !triggerResult.ok && !triggerResult.error?.includes("GITHUB_TOKEN") && (
        <Banner variant="error" className="mt-3 text-xs">
          {triggerResult.error}
        </Banner>
      )}
      {triggerResult?.ok && (
        <Banner variant="success" className="mt-3 text-xs">
          Workflow triggered.{" "}
          {triggerResult.workflowRunUrl && (
            <a
              href={triggerResult.workflowRunUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View run →
            </a>
          )}
        </Banner>
      )}
    </div>
  );
}

// ── create task form ──────────────────────────────────────────────────────────

const TARGET_AREAS = [
  { value: "auth", label: "Auth / Access Control" },
  { value: "dispatch", label: "Dispatch / Jobs" },
  { value: "billing", label: "Billing / Invoices" },
  { value: "founder", label: "Founder Dashboard" },
  { value: "owner", label: "Owner Dashboard" },
  { value: "infra", label: "Infra / Deployment" },
  { value: "storage", label: "Storage / Media" },
  { value: "other", label: "Other" },
] as const;

const RISK_OPTIONS = [
  { value: "low", label: "Low — cosmetic / copy / config" },
  { value: "medium", label: "Medium — logic change, no schema" },
  { value: "high", label: "High — auth, schema, RLS, billing" },
] as const;

function CreateTaskForm({ onAction }: { onAction: () => void }) {
  const [title, setTitle] = useState("");
  const [targetArea, setTargetArea] = useState("other");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("low");
  const [prompt, setPrompt] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      postAction({ type: "create_agent_task", title, targetArea, riskLevel, prompt }),
    onSuccess: (result) => {
      if (result.ok) {
        setTitle("");
        setPrompt("");
        setTargetArea("other");
        setRiskLevel("low");
        onAction();
      }
    },
  });

  const result = mutation.data;
  const canSubmit = title.trim().length > 0 && prompt.trim().length > 0 && !mutation.isPending;

  return (
    <section>
      <SectionHeading icon={Play} title="Create Agent Task" />
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* title */}
          <div className="sm:col-span-2">
            <Label>Title</Label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fix /founder auth check for third staff email"
              maxLength={120}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* target area */}
          <div>
            <Label>Target Area</Label>
            <select
              value={targetArea}
              onChange={(e) => setTargetArea(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              {TARGET_AREAS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {/* risk level */}
          <div>
            <Label>Risk Level</Label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              {RISK_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* prompt */}
          <div className="sm:col-span-2">
            <Label>Prompt / Description</Label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what the agent should do. Be specific — this becomes the workflow summary."
              rows={3}
              className="mt-1 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              canSubmit
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed bg-primary/30 text-primary-foreground/50",
            )}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Task
          </button>

          {result?.ok && (
            <span className="text-xs text-green-400">
              ✓ Task {result.taskId} created — approve or trigger it above.
            </span>
          )}
          {result && !result.ok && (
            <span className="text-xs text-red-400">{result.error}</span>
          )}
        </div>
      </div>
    </section>
  );
}

// ── future actions ────────────────────────────────────────────────────────────

interface FutureAction {
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  danger?: boolean;
}

const FUTURE_ACTIONS: FutureAction[] = [
  {
    icon: GitBranch,
    title: "Create Branch",
    description: "Open a feature branch from main for the selected task.",
    action: "create_branch",
  },
  {
    icon: GitPullRequest,
    title: "Open Pull Request",
    description: "Draft a PR from the active task branch into main.",
    action: "open_pr",
  },
  {
    icon: Rocket,
    title: "Deploy Preview",
    description: "Trigger a Vercel preview deployment for the active branch.",
    action: "deploy_preview",
  },
  {
    icon: AlertTriangle,
    title: "Deploy Production",
    description: "Promote a preview to production. Requires explicit approval.",
    action: "deploy_production",
    danger: true,
  },
];

function FutureActions() {
  return (
    <section>
      <SectionHeading
        icon={Zap}
        title="Future Actions"
        sub="Approval-required — not yet wired"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {FUTURE_ACTIONS.map((a) => (
          <div
            key={a.action}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 opacity-50",
              a.danger ? "border-red-500/20 bg-red-500/5" : "border-border bg-surface",
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                a.danger ? "bg-red-500/10 text-red-400" : "bg-surface-2 text-muted-foreground",
              )}
            >
              <a.icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{a.title}</span>
                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {a.danger ? "approval required" : "coming soon"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── setup-required notice ─────────────────────────────────────────────────────

function SetupRequired({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2.5 text-xs",
        className,
      )}
    >
      <p className="font-semibold text-yellow-400">GitHub token not configured</p>
      <p className="mt-1 text-yellow-300/80">
        Add{" "}
        <code className="rounded bg-yellow-500/20 px-1 font-mono">GITHUB_TOKEN</code>,{" "}
        <code className="rounded bg-yellow-500/20 px-1 font-mono">GITHUB_REPO_OWNER</code>, and{" "}
        <code className="rounded bg-yellow-500/20 px-1 font-mono">GITHUB_REPO_NAME</code> to your{" "}
        <code className="rounded bg-yellow-500/20 px-1 font-mono">.env.local</code> (dev) or
        Vercel Environment Variables (production), then restart the dev server.
      </p>
    </div>
  );
}

// ── small shared components ───────────────────────────────────────────────────

function SectionHeading({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ElementType;
  title: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-2 pb-1">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="text-sm font-bold tracking-tight">{title}</h2>
      {sub && <span className="text-xs text-muted-foreground">· {sub}</span>}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-bold">{value}</p>
        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </label>
  );
}

function TaskBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    pending: "bg-surface-2 text-muted-foreground",
    approved: "bg-green-500/10 text-green-400",
    rejected: "bg-red-500/10 text-red-400",
    workflow_triggered: "bg-blue-500/10 text-blue-400",
    running: "bg-blue-500/10 text-blue-400",
    completed: "bg-green-500/10 text-green-400",
    failed: "bg-red-500/10 text-red-400",
  };
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize",
        styles[status],
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function RiskPill({ level }: { level: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    low: "text-green-400",
    medium: "text-yellow-400",
    high: "text-red-400",
  };
  return <span className={cn("font-semibold", styles[level])}>{level} risk</span>;
}

function Banner({
  variant,
  children,
  className,
}: {
  variant: "error" | "success" | "warning";
  children: React.ReactNode;
  className?: string;
}) {
  const styles = {
    error: "border-red-500/20 bg-red-500/10 text-red-400",
    success: "border-green-500/20 bg-green-500/10 text-green-400",
    warning: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  };
  return (
    <div className={cn("rounded-lg border px-3 py-2 text-sm", styles[variant], className)}>
      {children}
    </div>
  );
}
