import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  DollarSign,
  Download,
  Gauge,
  Loader2,
  Receipt,
  ShieldCheck,
  Sparkles,
  Truck,
  UserCheck,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCompanyOwnerMetrics } from "@/lib/owner.functions";
import { cn } from "@/lib/utils";

const ownerHead = () => ({
  meta: [
    { title: "Company Owner Dashboard — Hooked" },
    { name: "robots", content: "noindex" },
  ],
});

const ownerBeforeLoad = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw redirect({ to: "/auth", search: { redirect: "/owner" } });

  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .limit(1);

  if (roleError || !roleRows || roleRows.length === 0) {
    throw redirect({ to: "/dashboard" });
  }
};

export const Route = createFileRoute("/owner")({
  ssr: false,
  head: ownerHead,
  beforeLoad: ownerBeforeLoad,
  component: OwnerConsole,
});

function OwnerConsole() {
  const metricsFn = useServerFn(getCompanyOwnerMetrics);
  const { data, isLoading, error } = useQuery({
    queryKey: ["company-owner-metrics", "v1"],
    queryFn: () => metricsFn(),
    refetchInterval: 60_000,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface/80 px-4 py-4 shadow-sm backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Company Owner Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                Your company&apos;s fleet, jobs, revenue, and team performance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" /> Export view
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {isLoading && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading company metrics…
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-urgent/20 bg-urgent/10 p-4 text-sm text-urgent">
            {(error as Error).message}
          </div>
        )}
        {data && <OwnerDashboard data={data} />}
      </main>
    </div>
  );
}

type OwnerData = Awaited<ReturnType<typeof getCompanyOwnerMetrics>>;
type TeamMember = OwnerData["team"][number];
type Driver = OwnerData["drivers"][number];
type ActiveJob = OwnerData["recentJobs"][number];
type CompletedJob = OwnerData["recentCompleted"][number];

function OwnerDashboard({ data }: { data: OwnerData }) {
  const totals = data.totals;

  return (
    <>
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                Company scope
              </span>
              <span className="rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-success">
                Live data
              </span>
              <TrialBadge days={data.scope.trialDaysLeft} />
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">{data.scope.companyName}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              This dashboard is scoped to your company only. It rolls up the jobs, drivers, billing,
              response times, and team activity your operators are creating inside Hooked.
            </p>
          </div>
          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:min-w-[360px]">
            <ScopeFact label="Account started" value={dateMaybe(data.scope.createdAt)} />
            <ScopeFact label="Last activity" value={dateMaybe(data.scope.lastActive)} />
            <ScopeFact label="Trial ends" value={dateMaybe(data.scope.trialEndsAt)} />
            <ScopeFact label="Generated" value={new Date(data.generatedAt).toLocaleTimeString()} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Truck}
          label="Active jobs"
          value={fmt(totals.activeJobs)}
          sub={`${fmt(totals.completedJobs30)} completed in 30 days`}
        />
        <MetricCard
          icon={DollarSign}
          label="Revenue tracked"
          value={money(totals.revenue30)}
          sub={`${money(totals.paid30)} paid · ${money(totals.unpaid30)} open`}
          tone="green"
        />
        <MetricCard
          icon={Gauge}
          label="Avg response"
          value={totals.avgResponse30 ? `${fmt(totals.avgResponse30)} min` : "—"}
          sub="Completed jobs in the last 30 days"
          tone="amber"
        />
        <MetricCard
          icon={Users}
          label="Team"
          value={fmt(totals.users)}
          sub={`${fmt(totals.owners)} admins · ${fmt(totals.dispatchers)} dispatchers · ${fmt(
            totals.driverUsers,
          )} drivers`}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <MiniStat icon={Truck} label="Fleet drivers" value={fmt(totals.drivers)} />
        <MiniStat
          icon={CheckCircle2}
          label="Drivers available"
          value={fmt(totals.availableDrivers)}
          tone="green"
        />
        <MiniStat
          icon={Receipt}
          label="Completed all-time"
          value={fmt(totals.completedJobsAll)}
          tone="amber"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Operations Pulse" action="Company-only">
          <div className="grid gap-3 sm:grid-cols-3">
            <BarPanel title="Active job status" data={data.breakdowns.jobStatus} />
            <BarPanel title="Job priority" data={data.breakdowns.jobPriority} />
            <BarPanel title="Driver status" data={data.breakdowns.driverStatus} />
          </div>
        </Panel>
        <Panel title="Owner Insights" action="Actions">
          <ul className="space-y-3">
            {data.insights.map((insight, index) => (
              <li
                key={`${insight.title}-${index}`}
                className="flex items-start gap-3 rounded-lg border border-border bg-background p-3"
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                    insight.tone === "success"
                      ? "bg-success/15 text-success"
                      : insight.tone === "urgent"
                        ? "bg-urgent/15 text-urgent"
                        : insight.tone === "warning"
                          ? "bg-primary/10 text-primary"
                          : "bg-accent text-muted-foreground",
                  )}
                >
                  {insight.tone === "urgent" ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : insight.tone === "success" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </span>
                <div>
                  <div className="text-sm font-semibold">{insight.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{insight.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Active Jobs" action={`${fmt(data.recentJobs.length)} latest`}>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-accent text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Job</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Estimate</th>
                </tr>
              </thead>
              <tbody>
                {data.recentJobs.map((job: ActiveJob) => (
                  <tr key={job.id} className="border-t border-border align-top">
                    <td className="px-3 py-3">
                      <div className="font-semibold">{job.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{job.location}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div>{job.job_type}</div>
                      <div className="text-xs text-muted-foreground">{date(job.created_at)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={job.status} />
                      <div className="mt-1 text-xs text-muted-foreground">{job.priority}</div>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">
                      {money(job.estimated_price)}
                    </td>
                  </tr>
                ))}
                {data.recentJobs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                      No active jobs right now.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Completed Jobs & Billing" action="Last 30 days">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <BarPanel title="Completed job types" data={data.breakdowns.completedJobType30} />
            <BarPanel title="Payment status" data={data.breakdowns.paymentStatus30} />
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-accent text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Driver</th>
                  <th className="px-3 py-2">Payment</th>
                  <th className="px-3 py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.recentCompleted.map((job: CompletedJob) => (
                  <tr key={job.id} className="border-t border-border">
                    <td className="px-3 py-3">
                      <div className="font-semibold">{job.customer_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {job.job_type} · {date(job.completed_at)}
                      </div>
                    </td>
                    <td className="px-3 py-3">{job.driver_name ?? "—"}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={job.payment_status} />
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">
                      {money(Number(job.price ?? 0) + Number(job.tax_amount ?? 0))}
                    </td>
                  </tr>
                ))}
                {data.recentCompleted.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                      Completed jobs will appear here once your team closes work.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Team Access" action="Admins, dispatchers, drivers">
          <div className="mb-4">
            <BarPanel title="Role mix" data={data.breakdowns.teamRoles} />
          </div>
          <div className="space-y-2">
            {data.team.slice(0, 8).map((member: TeamMember) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{member.name ?? member.email}</div>
                  <div className="truncate text-xs text-muted-foreground">{member.email ?? "No email"}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={member.status} />
                  <RoleBadge role={member.role} />
                </div>
              </div>
            ))}
            {data.team.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                No team members yet.
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Fleet Roster" action={`${fmt(data.drivers.length)} drivers`}>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.drivers.map((driver: Driver) => (
              <div key={driver.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{driver.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Truck {driver.truckNumber} · {driver.phone ?? "no phone"}
                    </div>
                  </div>
                  <StatusBadge status={driver.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                  <span className="rounded-full bg-accent px-2 py-0.5">
                    ETA {fmt(driver.etaMin)} min
                  </span>
                  <span className="rounded-full bg-accent px-2 py-0.5">
                    {driver.currentJobId ? "On job" : "No active job"}
                  </span>
                </div>
              </div>
            ))}
            {data.drivers.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground sm:col-span-2">
                Add drivers from the dashboard to start tracking fleet coverage.
              </div>
            )}
          </div>
        </Panel>
      </section>
    </>
  );
}

function ScopeFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate font-semibold text-foreground">{value}</div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "slate",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  tone?: "slate" | "amber" | "green";
}) {
  const toneClass =
    tone === "amber"
      ? "bg-primary/10 text-primary"
      : tone === "green"
        ? "bg-success/15 text-success"
        : "bg-accent text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className={cn("mb-4 flex h-10 w-10 items-center justify-center rounded-lg", toneClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{label}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone = "slate",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "slate" | "amber" | "green";
}) {
  const toneClass =
    tone === "amber"
      ? "bg-primary/10 text-primary"
      : tone === "green"
        ? "bg-success/15 text-success"
        : "bg-accent text-foreground";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", toneClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-lg font-bold leading-tight">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold">{title}</h2>
        {action && (
          <span className="rounded-full bg-accent px-2 py-1 text-[11px] font-semibold text-muted-foreground">
            {action}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function BarPanel({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      {entries.length === 0 ? (
        <div className="text-sm text-muted-foreground">No data yet.</div>
      ) : (
        <div className="space-y-2">
          {entries.map(([label, value]) => (
            <div key={label}>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-foreground">{formatStatus(label)}</span>
                <span className="text-muted-foreground">{value}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrialBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-xs text-muted-foreground">Trial n/a</span>;
  const cls =
    days <= 0
      ? "bg-urgent/15 text-urgent"
      : days <= 7
        ? "bg-primary/10 text-primary"
        : "bg-success/15 text-success";
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider", cls)}>
      {days <= 0 ? "Trial expired" : `${days}d trial left`}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const icon =
    role === "admin" ? (
      <ShieldCheck className="h-3 w-3" />
    ) : role === "driver" ? (
      <Truck className="h-3 w-3" />
    ) : (
      <UserCheck className="h-3 w-3" />
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
      {icon}
      {formatStatus(role)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const cls =
    ["paid", "available", "approved", "complete"].includes(normalized)
      ? "bg-success/15 text-success"
      : ["urgent", "unassigned", "pending", "invoiced"].includes(normalized)
        ? "bg-primary/10 text-primary"
        : ["off", "rejected"].includes(normalized)
          ? "bg-urgent/15 text-urgent"
          : "bg-accent text-muted-foreground";
  return (
    <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider", cls)}>
      {formatStatus(status)}
    </span>
  );
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

function fmt(value: number) {
  return new Intl.NumberFormat("en-US").format(safeNumber(value));
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(safeNumber(value));
}

function date(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function dateMaybe(value: string | null) {
  if (!value) return "—";
  return date(value);
}

function safeNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}
