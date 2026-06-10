import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  DollarSign,
  Briefcase,
  Timer,
  AlertCircle,
  TrendingUp,
  Trophy,
  Clock,
  PieChart,
} from "lucide-react";
import { useDispatch } from "../../lib/dispatch-store";
import type { HistoryJob, JobType } from "../../lib/seed-data";
import { cn } from "../../lib/utils";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Hooked" },
      { name: "description", content: "Revenue, response times, and fleet performance analytics." },
    ],
  }),
  component: InsightsPage,
});

type RangeDays = 7 | 30 | 90;

function InsightsPage() {
  const { history } = useDispatch();
  const [range, setRange] = useState<RangeDays>(30);

  const data = useMemo(() => {
    const cutoff = Date.now() - range * 24 * 60 * 60 * 1000;
    return history.filter((h) => (h.completedAt ?? new Date(h.date).getTime()) >= cutoff);
  }, [history, range]);

  const kpis = useMemo(() => {
    const revenue = data.reduce((s, h) => s + h.amount, 0);
    const avgResponse = data.length
      ? Math.round(data.reduce((s, h) => s + h.responseMin, 0) / data.length)
      : 0;
    const outstanding = data
      .filter((h) => h.billing !== "Paid")
      .reduce((s, h) => s + h.amount, 0);
    return { revenue, jobs: data.length, avgResponse, outstanding };
  }, [data]);

  const fmt = (n: number) =>
    `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Header + range picker */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Business insights</h1>
            <p className="text-xs text-muted-foreground">
              Built from your completed jobs — updates live as work finishes.
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
            {([7, 30, 90] as RangeDays[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  range === r
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi icon={DollarSign} label={`Revenue (${range}d)`} value={fmt(kpis.revenue)} accent />
          <Kpi icon={Briefcase} label="Jobs completed" value={String(kpis.jobs)} />
          <Kpi icon={Timer} label="Avg response" value={`${kpis.avgResponse} min`} />
          <Kpi icon={AlertCircle} label="Outstanding" value={fmt(kpis.outstanding)} warn={kpis.outstanding > 0} />
        </div>

        {/* Revenue trend */}
        <Card title={`Revenue — last ${Math.min(range, 30)} days`} icon={TrendingUp}>
          <RevenueChart data={data} days={Math.min(range, 30)} />
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Driver leaderboard */}
          <Card title="Driver leaderboard" icon={Trophy}>
            <DriverLeaderboard data={data} />
          </Card>

          {/* Jobs by type */}
          <Card title="Jobs by service type" icon={PieChart}>
            <JobTypeBreakdown data={data} />
          </Card>
        </div>

        {/* Busiest hours */}
        <Card title="Busiest hours of day" icon={Clock}>
          <BusyHours data={data} />
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  accent,
  warn,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        accent
          ? "border-primary/30 bg-primary/10"
          : warn
            ? "border-warning/30 bg-warning/5"
            : "border-border bg-surface",
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div
        className={cn(
          "mt-1.5 font-mono text-2xl font-bold",
          accent ? "text-primary" : warn ? "text-warning" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" /> {title}
      </div>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-md border border-dashed border-border bg-background p-6 text-center text-xs text-muted-foreground">
      No completed jobs in this period yet — finish a job and it shows up here.
    </div>
  );
}

/* ───────────── Revenue bar chart ───────────── */

function RevenueChart({ data, days }: { data: HistoryJob[]; days: number }) {
  const series = useMemo(() => {
    const out: { date: string; label: string; revenue: number; jobs: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const rows = data.filter((h) => h.date === iso);
      out.push({
        date: iso,
        label: d.toLocaleDateString([], { month: "numeric", day: "numeric" }),
        revenue: rows.reduce((s, h) => s + h.amount, 0),
        jobs: rows.length,
      });
    }
    return out;
  }, [data, days]);

  const max = Math.max(1, ...series.map((s) => s.revenue));
  if (data.length === 0) return <EmptyState />;

  return (
    <div>
      <div className="flex h-40 items-end gap-[3px]">
        {series.map((s) => (
          <div
            key={s.date}
            className="group relative flex-1"
            title={`${s.label}: $${s.revenue.toLocaleString()} · ${s.jobs} job${s.jobs === 1 ? "" : "s"}`}
          >
            <div
              className={cn(
                "w-full rounded-t-sm transition-all",
                s.revenue > 0 ? "bg-primary/70 group-hover:bg-primary" : "bg-border",
              )}
              style={{ height: `${Math.max(2, (s.revenue / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{series[0]?.label}</span>
        <span>{series[Math.floor(series.length / 2)]?.label}</span>
        <span>{series.at(-1)?.label}</span>
      </div>
    </div>
  );
}

/* ───────────── Driver leaderboard ───────────── */

function DriverLeaderboard({ data }: { data: HistoryJob[] }) {
  const rows = useMemo(() => {
    const byDriver = new Map<string, { revenue: number; jobs: number; respSum: number }>();
    for (const h of data) {
      if (h.driver === "—") continue;
      const cur = byDriver.get(h.driver) ?? { revenue: 0, jobs: 0, respSum: 0 };
      cur.revenue += h.amount;
      cur.jobs += 1;
      cur.respSum += h.responseMin;
      byDriver.set(h.driver, cur);
    }
    return [...byDriver.entries()]
      .map(([driver, v]) => ({
        driver,
        revenue: v.revenue,
        jobs: v.jobs,
        avgResp: Math.round(v.respSum / v.jobs),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [data]);

  if (rows.length === 0) return <EmptyState />;
  const max = Math.max(1, ...rows.map((r) => r.revenue));
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={r.driver}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium">
              {medals[i] ?? `${i + 1}.`} {r.driver}
            </span>
            <span className="font-mono text-muted-foreground">
              ${r.revenue.toLocaleString()} · {r.jobs} jobs · {r.avgResp}m avg
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-background">
            <div
              className={cn("h-full rounded-full", i === 0 ? "bg-primary" : "bg-primary/40")}
              style={{ width: `${(r.revenue / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────── Jobs by type ───────────── */

const TYPE_COLORS: Record<JobType, string> = {
  Tow: "bg-primary",
  Lockout: "bg-sky-400",
  Jumpstart: "bg-emerald-400",
  Tire: "bg-amber-400",
  Winch: "bg-rose-400",
};

function JobTypeBreakdown({ data }: { data: HistoryJob[] }) {
  const rows = useMemo(() => {
    const byType = new Map<JobType, { jobs: number; revenue: number }>();
    for (const h of data) {
      const cur = byType.get(h.type) ?? { jobs: 0, revenue: 0 };
      cur.jobs += 1;
      cur.revenue += h.amount;
      byType.set(h.type, cur);
    }
    return [...byType.entries()]
      .map(([type, v]) => ({ type, ...v }))
      .sort((a, b) => b.jobs - a.jobs);
  }, [data]);

  if (rows.length === 0) return <EmptyState />;
  const total = rows.reduce((s, r) => s + r.jobs, 0);

  return (
    <div>
      {/* Stacked bar */}
      <div className="flex h-3 overflow-hidden rounded-full">
        {rows.map((r) => (
          <div
            key={r.type}
            className={cn(TYPE_COLORS[r.type] ?? "bg-border")}
            style={{ width: `${(r.jobs / total) * 100}%` }}
            title={`${r.type}: ${r.jobs}`}
          />
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <div key={r.type} className="flex items-center gap-2 text-xs">
            <span className={cn("h-2.5 w-2.5 rounded-sm", TYPE_COLORS[r.type] ?? "bg-border")} />
            <span className="flex-1 font-medium">{r.type}</span>
            <span className="text-muted-foreground">
              {r.jobs} ({Math.round((r.jobs / total) * 100)}%)
            </span>
            <span className="w-20 text-right font-mono text-muted-foreground">
              ${r.revenue.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Busiest hours ───────────── */

function BusyHours({ data }: { data: HistoryJob[] }) {
  const hours = useMemo(() => {
    const counts = Array.from({ length: 24 }, () => 0);
    for (const h of data) {
      counts[new Date(h.completedAt ?? new Date(h.date).getTime()).getHours()] += 1;
    }
    return counts;
  }, [data]);

  if (data.length === 0) return <EmptyState />;
  const max = Math.max(1, ...hours);
  const fmtHour = (h: number) =>
    h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`;

  return (
    <div>
      <div className="flex h-28 items-end gap-[3px]">
        {hours.map((count, h) => (
          <div key={h} className="group relative flex-1" title={`${fmtHour(h)}: ${count} job${count === 1 ? "" : "s"}`}>
            <div
              className={cn(
                "w-full rounded-t-sm transition-all",
                count > 0 ? "bg-sky-400/60 group-hover:bg-sky-400" : "bg-border",
              )}
              style={{ height: `${Math.max(3, (count / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>12am</span>
        <span>6am</span>
        <span>12pm</span>
        <span>6pm</span>
        <span>11pm</span>
      </div>
    </div>
  );
}
