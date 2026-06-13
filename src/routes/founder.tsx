import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  Cpu,
  DollarSign,
  FlaskConical,
  Gauge,
  Link2,
  LineChart,
  Loader2,
  Megaphone,
  Pause,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
  Truck,
  UserPlus,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getFounderMetrics } from "@/lib/founder.functions";
import { getProductAnalytics } from "@/lib/analytics.functions";
import {
  createMarketingCampaign,
  setMarketingCampaignStatus,
} from "@/lib/owner.functions";
import { safePublicError } from "@/lib/public-errors";
import { cn } from "@/lib/utils";
import { OWNER_SYSTEM_STATUS } from "@/lib/owner-system-status";

const FOUNDER_EMAILS = ["mike@hookaidashboard.com", "michaelttvance@gmail.com"];

const founderHead = () => ({
  meta: [{ title: "Founder Command Center — Hooked" }, { name: "robots", content: "noindex" }],
});

const founderBeforeLoad = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw redirect({ to: "/auth", search: { redirect: "/founder" } });
  if (!FOUNDER_EMAILS.includes((data.user.email ?? "").toLowerCase())) {
    throw redirect({ to: "/dashboard" });
  }
};

export const Route = createFileRoute("/founder")({
  ssr: false,
  head: founderHead,
  beforeLoad: founderBeforeLoad,
  component: FounderCommandCenter,
});

function FounderCommandCenter() {
  const metricsFn = useServerFn(getFounderMetrics);
  const { data, isLoading, error } = useQuery({
    queryKey: ["founder-metrics", "v1"],
    queryFn: () => metricsFn(),
    refetchInterval: 60_000,
  });
  const [activeTab, setActiveTab] = useState<"dashboard" | "system">("dashboard");

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
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Founder Command Center</h1>
              <p className="text-xs text-muted-foreground">
                Hooked platform health, growth, and revenue at a glance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <UserPlus className="h-3.5 w-3.5" /> Approvals
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-3 max-w-7xl border-t border-border/50 pt-3">
          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                activeTab === "dashboard"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Activity className="h-3.5 w-3.5" /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                activeTab === "system"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Cpu className="h-3.5 w-3.5" /> System Command Center
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {activeTab === "dashboard" && (
          <>
            {isLoading && (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading founder metrics…
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-urgent/20 bg-urgent/10 p-4 text-sm text-urgent">
                <div className="font-semibold">Unable to load founder metrics</div>
                <div className="mt-1 text-xs text-urgent/80">Try refreshing the page. If this persists, check the server logs.</div>
              </div>
            )}
            {data && <FounderDashboard data={data} />}
          </>
        )}
        {activeTab === "system" && <SystemCommandCenterPanel />}
      </main>
    </div>
  );
}

type FounderData = Awaited<ReturnType<typeof getFounderMetrics>>;
type Account = FounderData["accountHealth"]["accounts"][number];
type FeatureRow = FounderData["featureUsage"][number];
type RecentApp = FounderData["recentApplications"][number];
type Campaign = FounderData["campaigns"][number];

function FounderDashboard({ data }: { data: FounderData }) {
  const p = data.platform;
  const rev = data.customerRevenue;
  const revPh = data.revenuePlaceholder;
  const health = data.accountHealth;
  const analytics = data.analyticsPlaceholder;

  return (
    <>
      {/* 1. Platform Overview */}
      <SectionHeading
        icon={Activity}
        title="Platform Overview"
        sub={`Generated ${new Date(data.generatedAt).toLocaleString()}`}
      />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Building2}
          label="Customer companies"
          value={fmt(p.companies)}
          sub={`${fmt(p.newCompanies30)} new in 30 days`}
        />
        <MetricCard
          icon={Users}
          label="Platform users"
          value={fmt(p.users)}
          sub={`${fmt(p.drivers)} drivers`}
          tone="amber"
        />
        <MetricCard
          icon={Truck}
          label="Live jobs"
          value={fmt(p.activeJobs)}
          sub={`${fmt(p.completedJobsAll)} completed all-time`}
        />
        <MetricCard
          icon={UserPlus}
          label="Applications"
          value={fmt(p.applications)}
          sub={`${fmt(p.newApplications30)} in last 30 days`}
          tone="green"
        />
      </section>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MiniStat icon={Gauge} label="Avg response (30d)" value={`${fmt(p.avgResponse30)} min`} />
        <MiniStat icon={BarChart3} label="App → invite conversion" value={`${p.conversionPct}%`} />
        <MiniStat icon={Clock} label="Pending invites" value={fmt(p.pendingInvites)} />
        <MiniStat icon={Sparkles} label="Active campaigns" value={fmt(p.activeCampaigns)} />
      </section>

      {/* 2. Revenue Snapshot */}
      <SectionHeading
        icon={DollarSign}
        title="Revenue Snapshot"
        sub="Customer job revenue is real; Hooked SaaS MRR is a flagged placeholder"
      />
      <section className="grid gap-3 md:grid-cols-3">
        <MetricCard
          icon={DollarSign}
          label="Customer revenue tracked (30d)"
          value={money(rev.tracked30)}
          sub={`${money(rev.paid30)} paid · ${money(rev.unpaid30)} unpaid`}
          tone="green"
          badge="REAL"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Completed jobs (30d)"
          value={fmt(rev.completedJobs30)}
          sub="Across all customer companies"
          badge="REAL"
        />
        <MetricCard
          icon={DollarSign}
          label="Est. Hooked MRR"
          value={money(revPh.estimatedMrrUsd)}
          sub={`${fmt(revPh.billableAccounts)} accounts × $${revPh.assumedMonthlyPlanUsd}/mo (assumed)`}
          tone="amber"
          badge="PLACEHOLDER"
        />
      </section>
      <PlaceholderNote text={revPh.note} />

      <SectionHeading
        icon={Megaphone}
        title="Marketing Campaign Control"
        sub="Staff-only campaign links, attribution, and lead quality signals"
      />
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Campaign Control" action="Create, track, pause">
          <CampaignManager campaigns={data.campaigns} />
        </Panel>
        <Panel title="Attribution Analytics" action="UTM tracking">
          <div className="grid gap-3 md:grid-cols-3">
            <MiniStat
              icon={Megaphone}
              label="Active campaigns"
              value={fmt(p.activeCampaigns)}
              tone="amber"
            />
            <MiniStat
              icon={DollarSign}
              label="Active budget"
              value={money(p.totalCampaignBudget)}
              tone="green"
            />
            <MiniStat
              icon={Link2}
              label="Attributed leads"
              value={fmt(p.attributedApplications)}
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <BarPanel title="UTM sources" data={data.breakdowns.utmSource ?? {}} />
            <BarPanel title="UTM campaigns" data={data.breakdowns.utmCampaign ?? {}} />
          </div>
          <div className="mt-4 rounded-lg border border-primary/20 bg-warning/5 p-3 text-xs leading-relaxed text-foreground">
            Campaign links route applicants through tracked UTM parameters. This is platform/staff
            data, so it lives here in the founder command center rather than in a client company
            owner dashboard.
          </div>
        </Panel>
      </section>

      {/* 3. Feature Usage */}
      <SectionHeading
        icon={LineChart}
        title="Feature Usage"
        sub="Adoption derived from real product tables"
      />
      <Panel title="Feature adoption across accounts" action="REAL">
        <div className="space-y-4">
          {data.featureUsage.map((row: FeatureRow) => (
            <div key={row.feature}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">{row.feature}</span>
                <span className="text-muted-foreground">
                  {fmt(row.companies)} companies · {row.adoptionPct}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-accent">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(row.adoptionPct, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <BarPanel title="Active job mix" data={data.breakdowns.jobStatus} />
          <BarPanel title="Job priority" data={data.breakdowns.jobPriority} />
          <BarPanel title="Completed job types (30d)" data={data.breakdowns.completedJobType30} />
        </div>
      </Panel>

      {/* 4. Account Health Table */}
      <SectionHeading
        icon={ShieldCheck}
        title="Account Health"
        sub="Per-company engagement and trial status"
      />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          icon={CheckCircle2}
          label="Healthy accounts"
          value={fmt(health.breakdown.healthy)}
          tone="green"
        />
        <MiniStat
          icon={Activity}
          label="Watch list"
          value={fmt(health.breakdown.watch)}
          tone="amber"
        />
        <MiniStat
          icon={AlertTriangle}
          label="At risk"
          value={fmt(health.breakdown.at_risk)}
          tone="red"
        />
        <MiniStat
          icon={Clock}
          label="Trials expiring ≤7d"
          value={fmt(health.trialsExpiringSoon)}
          tone="amber"
        />
      </section>
      <Panel title="Customer accounts" action={`${fmt(health.accounts.length)} shown`}>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-accent text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Health</th>
                <th className="px-3 py-2">Users</th>
                <th className="px-3 py-2">Drivers</th>
                <th className="px-3 py-2">Jobs</th>
                <th className="px-3 py-2">Trial</th>
                <th className="px-3 py-2 text-right">30d Rev</th>
              </tr>
            </thead>
            <tbody>
              {health.accounts.map((account: Account) => (
                <tr key={account.id} className="border-t border-border">
                  <td className="px-3 py-3">
                    <div className="font-semibold">{account.name}</div>
                    <div className="text-xs text-muted-foreground">Joined {date(account.createdAt)}</div>
                  </td>
                  <td className="px-3 py-3">
                    <HealthBadge health={account.health} />
                  </td>
                  <td className="px-3 py-3">{fmt(account.users)}</td>
                  <td className="px-3 py-3">{fmt(account.drivers)}</td>
                  <td className="px-3 py-3">
                    <div>{fmt(account.activeJobs)} active</div>
                    <div className="text-xs text-muted-foreground">
                      {fmt(account.completed30)} complete
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <TrialBadge days={account.trialDaysLeft} />
                  </td>
                  <td className="px-3 py-3 text-right font-semibold">{money(account.revenue30)}</td>
                </tr>
              ))}
              {health.accounts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                    No customer accounts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* 5. Founder Insights */}
      <SectionHeading
        icon={Sparkles}
        title="Founder Insights"
        sub="Auto-generated from current platform signals"
      />
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="What to act on now" action="Signals">
          <ul className="space-y-3">
            {buildInsights(data).map((insight, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3"
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                    insight.toneClass,
                  )}
                >
                  <insight.icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-foreground">{insight.title}</div>
                  <div className="text-xs text-muted-foreground">{insight.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <ProductAnalyticsPanel fallback={analytics} />
      </section>

      {/* 6. Admin Tools Preview */}
      <SectionHeading
        icon={FlaskConical}
        title="Admin Tools Preview"
        sub="Quick links and upcoming founder controls"
      />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <ToolLink
          to="/admin"
          icon={UserPlus}
          title="Review applications"
          detail={`${fmt(p.pendingApplications)} pending · ${fmt(p.invitedApplications)} invited`}
          live
        />
        <ToolPreview
          icon={BarChart3}
          title="Company owner dashboards"
          detail="Client admins use /owner for their own company metrics, not platform analytics."
        />
        <ToolPreview
          icon={DollarSign}
          title="Billing & subscriptions"
          detail="Connect Stripe to manage plans, MRR, and dunning."
        />
        <ToolPreview
          icon={Users}
          title="Impersonate / support login"
          detail="Securely view an account as the operator (needs audited auth work)."
        />
        <ToolPreview
          icon={LineChart}
          title="Product analytics"
          detail="Event tracking for logins, feature usage, and retention."
        />
        <ToolPreview
          icon={ShieldCheck}
          title="Feature flags & rollouts"
          detail="Gate new features per plan or per account."
        />
      </section>
      <RecentApplicationsStrip apps={data.recentApplications} />
    </>
  );
}

function ProductAnalyticsPanel({
  fallback,
}: {
  fallback: { note: string; metrics: { label: string; value: string }[] };
}) {
  const analyticsFn = useServerFn(getProductAnalytics);
  const { data, isLoading, error } = useQuery({
    queryKey: ["founder-product-analytics", "v1"],
    queryFn: () => analyticsFn(),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <Panel title="Product analytics" action="…">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading product analytics…
        </div>
      </Panel>
    );
  }

  // On error, or before any events accumulate, fall back to the flagged
  // placeholder shape so the panel always renders something stable.
  if (error || !data || data.isPlaceholder) {
    const note = data && data.isPlaceholder ? data.note : fallback.note;
    return (
      <Panel title="Product analytics" action="PLACEHOLDER">
        <div className="grid gap-3 sm:grid-cols-2">
          {fallback.metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-lg border border-dashed border-border bg-background p-3"
            >
              <div className="text-2xl font-bold text-muted-foreground">{m.value}</div>
              <div className="mt-1 text-xs font-semibold text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>
        <PlaceholderNote text={note} compact />
      </Panel>
    );
  }

  const cards = [
    { label: "Demo page views (30d)", value: fmt(data.funnel.demoPageViews30) },
    { label: "Watch demo clicks (30d)", value: fmt(data.funnel.watchDemoClicks30) },
    { label: "Start trial clicks (30d)", value: fmt(data.funnel.startTrialClicks30) },
    { label: "Signups started (30d)", value: fmt(data.funnel.signupStarted30) },
    { label: "Total events (7d)", value: fmt(data.totals.events7) },
    { label: "Unique visitors (30d)", value: fmt(data.totals.uniqueVisitors30) },
  ];

  return (
    <Panel title="Product analytics" action="LIVE">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-background p-3">
            <div className="text-2xl font-bold text-foreground">{c.value}</div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-success/20 bg-success/5 p-2.5 text-[11px] leading-relaxed text-foreground">
        <span className="font-bold uppercase tracking-wider">Live · </span>
        Real marketing-funnel events from the product_events table (counts cover the
        last 30 days; total events covers the last 7 days). Stripe revenue/MRR above
        remains a separate placeholder until billing is instrumented.
      </div>
    </Panel>
  );
}

function buildInsights(data: FounderData) {
  const insights: {
    icon: React.ComponentType<{ className?: string }>;
    toneClass: string;
    title: string;
    detail: string;
  }[] = [];
  const p = data.platform;
  const h = data.accountHealth;

  if (h.trialsExpiringSoon > 0) {
    insights.push({
      icon: Clock,
      toneClass: "bg-primary/10 text-primary",
      title: `${h.trialsExpiringSoon} trial${h.trialsExpiringSoon === 1 ? "" : "s"} expiring within 7 days`,
      detail: "Reach out to convert these accounts before their trial ends.",
    });
  }
  if (h.breakdown.at_risk > 0) {
    insights.push({
      icon: AlertTriangle,
      toneClass: "bg-urgent/15 text-urgent",
      title: `${h.breakdown.at_risk} account${h.breakdown.at_risk === 1 ? "" : "s"} at risk`,
      detail: "These companies have signed up but show little to no job activity yet.",
    });
  }
  if (p.pendingApplications > 0) {
    insights.push({
      icon: UserPlus,
      toneClass: "bg-accent text-foreground",
      title: `${p.pendingApplications} application${p.pendingApplications === 1 ? "" : "s"} awaiting review`,
      detail: "Review and invite qualified operators to keep the funnel moving.",
    });
  }
  if (p.newApplications7 > 0) {
    insights.push({
      icon: BarChart3,
      toneClass: "bg-success/15 text-success",
      title: `${p.newApplications7} new application${p.newApplications7 === 1 ? "" : "s"} in the last 7 days`,
      detail: `App-to-invite conversion is currently ${p.conversionPct}%.`,
    });
  }
  if (insights.length === 0) {
    insights.push({
      icon: CheckCircle2,
      toneClass: "bg-success/15 text-success",
      title: "All clear",
      detail: "No urgent founder actions detected from current signals.",
    });
  }
  return insights;
}

function RecentApplicationsStrip({ apps }: { apps: RecentApp[] }) {
  if (apps.length === 0) return null;
  return (
    <Panel title="Latest applications" action="Newest leads">
      <div className="grid gap-2 sm:grid-cols-2">
        {apps.map((app) => (
          <div key={app.id} className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{app.business_name}</div>
                <div className="text-xs text-muted-foreground">
                  {app.full_name} · {app.city_state}
                </div>
              </div>
              <StatusPill status={app.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
              <span className="rounded-full bg-accent px-2 py-0.5">
                {app.truck_count} trucks
              </span>
              <span className="rounded-full bg-accent px-2 py-0.5">{date(app.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function CampaignManager({ campaigns }: { campaigns: Campaign[] }) {
  const qc = useQueryClient();
  const createCampaign = useServerFn(createMarketingCampaign);
  const setStatus = useServerFn(setMarketingCampaignStatus);
  const [copied, setCopied] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    channel: "Google",
    budget: "250",
    goal: "",
    notes: "",
    targetUrl: "https://hookedv-2.vercel.app/apply",
  });

  const createM = useMutation({
    mutationFn: () =>
      createCampaign({
        data: {
          name: draft.name,
          channel: draft.channel,
          budget: Number(draft.budget) || 0,
          goal: draft.goal,
          notes: draft.notes,
          targetUrl: draft.targetUrl,
        },
      }),
    onSuccess: () => {
      setDraft({
        name: "",
        channel: "Google",
        budget: "250",
        goal: "",
        notes: "",
        targetUrl: "https://hookedv-2.vercel.app/apply",
      });
      qc.invalidateQueries({ queryKey: ["founder-metrics", "v1"] });
    },
  });

  const statusM = useMutation({
    mutationFn: (vars: { id: string; status: "active" | "paused" | "ended" }) =>
      setStatus({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["founder-metrics", "v1"] }),
  });
  const createCampaignError = createM.error
    ? safePublicError(
        "We couldn't save that campaign right now. Please try again in a moment.",
        createM.error,
        "[founder] create campaign failed",
      )
    : null;
  const statusCampaignError = statusM.error
    ? safePublicError(
        "We couldn't update that campaign right now. Please try again in a moment.",
        statusM.error,
        "[founder] update campaign failed",
      )
    : null;

  async function copy(url: string, id: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      window.prompt("Copy campaign URL", url);
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createM.mutate();
        }}
        className="grid gap-3 rounded-lg border border-border bg-surface p-3 lg:grid-cols-6"
      >
        <input
          required
          value={draft.name}
          onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          placeholder="Campaign name"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm lg:col-span-2"
        />
        <select
          value={draft.channel}
          onChange={(e) => setDraft((p) => ({ ...p, channel: e.target.value }))}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          <option>Google</option>
          <option>Facebook Group</option>
          <option>Referral</option>
          <option>Towing Association</option>
          <option>Email</option>
          <option>Other</option>
        </select>
        <input
          value={draft.budget}
          onChange={(e) => setDraft((p) => ({ ...p, budget: e.target.value }))}
          inputMode="decimal"
          placeholder="Budget"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <input
          value={draft.goal}
          onChange={(e) => setDraft((p) => ({ ...p, goal: e.target.value }))}
          placeholder="Goal"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm lg:col-span-2"
        />
        <input
          value={draft.targetUrl}
          onChange={(e) => setDraft((p) => ({ ...p, targetUrl: e.target.value }))}
          placeholder="Landing URL"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm lg:col-span-5"
        />
        <button
          type="submit"
          disabled={createM.isPending}
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {createM.isPending ? "Adding..." : "Add campaign"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-accent text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Campaign</th>
              <th className="px-3 py-2">Budget</th>
              <th className="px-3 py-2">Leads</th>
              <th className="px-3 py-2">CPL</th>
              <th className="px-3 py-2">Conv.</th>
              <th className="px-3 py-2 text-right">Control</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="border-t border-border align-top">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <StatusDot status={campaign.status} />
                    <div>
                      <div className="font-semibold">{campaign.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {campaign.channel} · {campaign.goal || "No goal set"}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(campaign.trackingUrl, campaign.id)}
                    className="mt-2 inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  >
                    <Link2 className="h-3 w-3" />
                    {copied === campaign.id ? "Copied" : "Copy tracking link"}
                  </button>
                </td>
                <td className="px-3 py-3">{money(campaign.budget)}</td>
                <td className="px-3 py-3">{campaign.leads}</td>
                <td className="px-3 py-3">
                  {campaign.costPerLead === null ? "—" : money(campaign.costPerLead)}
                </td>
                <td className="px-3 py-3">{campaign.conversionRate}%</td>
                <td className="px-3 py-3 text-right">
                  {campaign.status === "active" ? (
                    <button
                      type="button"
                      onClick={() => statusM.mutate({ id: campaign.id, status: "paused" })}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-accent"
                    >
                      <Pause className="h-3 w-3" /> Pause
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => statusM.mutate({ id: campaign.id, status: "active" })}
                      className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-success/10 px-2 py-1 text-[11px] font-semibold text-success hover:bg-success/15"
                    >
                      <Play className="h-3 w-3" /> Resume
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  No campaigns yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {createCampaignError && <div className="text-xs text-urgent">{createCampaignError}</div>}
      {statusCampaignError && <div className="text-xs text-urgent">{statusCampaignError}</div>}
    </div>
  );
}

/* ---------- presentational helpers ---------- */

function SectionHeading({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h2 className="text-base font-bold tracking-tight">{title}</h2>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "slate",
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  tone?: "slate" | "amber" | "green";
  badge?: "REAL" | "PLACEHOLDER";
}) {
  const toneClass =
    tone === "amber"
      ? "bg-primary/10 text-primary"
      : tone === "green"
        ? "bg-success/15 text-success"
        : "bg-accent text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
        {badge && <DataBadge kind={badge} />}
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
  tone?: "slate" | "amber" | "green" | "red";
}) {
  const toneClass =
    tone === "amber"
      ? "bg-primary/10 text-primary"
      : tone === "green"
        ? "bg-success/15 text-success"
        : tone === "red"
          ? "bg-urgent/15 text-urgent"
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

function DataBadge({ kind }: { kind: "REAL" | "PLACEHOLDER" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        kind === "REAL" ? "bg-success/15 text-success" : "bg-primary/10 text-primary",
      )}
    >
      {kind}
    </span>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold">{title}</h3>
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
    .slice(0, 5);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</div>
      {entries.length === 0 ? (
        <div className="text-sm text-muted-foreground">No data yet.</div>
      ) : (
        <div className="space-y-2">
          {entries.map(([label, value]) => (
            <div key={label}>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-foreground">{label}</span>
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

function PlaceholderNote({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-warning/20 bg-warning/5 text-foreground",
        compact ? "mt-3 p-2.5 text-[11px] leading-relaxed" : "p-3 text-xs leading-relaxed",
      )}
    >
      <span className="font-bold uppercase tracking-wider">Placeholder · </span>
      {text}
    </div>
  );
}

function ToolLink({
  to,
  icon: Icon,
  title,
  detail,
  live,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
  live?: boolean;
}) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/30"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        {live && (
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
            Live
          </span>
        )}
      </div>
      <div className="text-sm font-bold text-foreground group-hover:text-foreground">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </Link>
  );
}

function ToolPreview({
  icon: Icon,
  title,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Soon
        </span>
      </div>
      <div className="text-sm font-bold text-foreground">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </div>
  );
}

function HealthBadge({ health }: { health: "healthy" | "watch" | "at_risk" }) {
  const map = {
    healthy: { cls: "bg-success/15 text-success", label: "Healthy" },
    watch: { cls: "bg-primary/10 text-primary", label: "Watch" },
    at_risk: { cls: "bg-urgent/15 text-urgent", label: "At risk" },
  } as const;
  const m = map[health];
  return (
    <span
      className={cn("rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider", m.cls)}
    >
      {m.label}
    </span>
  );
}

function TrialBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-xs text-muted-foreground">n/a</span>;
  const cls =
    days <= 0
      ? "bg-urgent/15 text-urgent"
      : days <= 7
        ? "bg-primary/10 text-primary"
        : "bg-success/15 text-success";
  return (
    <span className={cn("rounded-full px-2 py-1 text-[11px] font-semibold", cls)}>
      {days <= 0 ? "expired" : `${days}d left`}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "invited" ? "bg-success/15 text-success" : "bg-primary/10 text-primary";
  return (
    <span
      className={cn("rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider", cls)}
    >
      {status}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const cls =
    status === "active"
      ? "bg-success/100"
      : status === "paused"
        ? "bg-primary"
        : "bg-border";
  return <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", cls)} />;
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

function safeNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function SystemCommandCenterPanel() {
  const s = OWNER_SYSTEM_STATUS;

  const buildCls = (status: string) => {
    if (status === "Live") return "bg-success/15 text-success";
    if (status === "In Progress") return "bg-primary/10 text-primary";
    if (status === "Stub") return "bg-warning/10 text-warning";
    return "bg-surface-2 text-muted-foreground";
  };

  const integrationCls = (status: string) => {
    if (status === "Integrated") return "bg-success/15 text-success";
    if (status === "Partial") return "bg-primary/10 text-primary";
    if (status === "Blocked") return "bg-urgent/15 text-urgent";
    return "bg-surface-2 text-muted-foreground";
  };

  const auditCls = (status: string) => {
    if (status === "Ready") return "bg-success/15 text-success";
    if (status === "High Priority") return "bg-urgent/15 text-urgent";
    if (status === "Needs Review") return "bg-warning/10 text-warning";
    if (status === "Blocked") return "bg-urgent/15 text-urgent";
    return "bg-surface-2 text-muted-foreground";
  };

  const priorityCls = (p: string) => {
    if (p === "P0") return "bg-urgent/15 text-urgent";
    if (p === "P1") return "bg-primary/10 text-primary";
    if (p === "P2") return "bg-warning/10 text-warning";
    return "bg-surface-2 text-muted-foreground";
  };

  return (
    <div className="space-y-8">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-primary">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold">System Command Center</div>
            <div className="text-xs text-muted-foreground">Owner-only project snapshot — plain English, no secrets</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Last updated: <span className="font-semibold text-foreground">{s.lastUpdated}</span>
        </div>
      </div>

      {/* Workflow summary */}
      <div>
        <SectionHeading icon={Gauge} title="Product Summary" sub="What Hooked does and where it stands" />
        <p className="mt-3 rounded-xl border border-border bg-surface p-4 text-sm leading-relaxed text-foreground">
          {s.workflowSummary}
        </p>
      </div>

      {/* Product workflow map */}
      <div>
        <SectionHeading icon={LineChart} title="Core Dispatch Workflow" sub="Step-by-step how a job moves through the system" />
        <div className="mt-3 space-y-3">
          {s.productWorkflowMap.map((step) => (
            <div
              key={step.step}
              className="flex gap-4 rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-muted-foreground">
                {step.step}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold">{step.label}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", buildCls(step.status))}>
                    {step.status}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frontend routes */}
      <div>
        <SectionHeading icon={BarChart3} title="Frontend Pages" sub="Every route and its current build state" />
        <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Path</th>
                <th className="px-4 py-3 font-semibold">Page</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {s.frontendMap.map((r) => (
                <tr key={r.path} className="hover:bg-accent/30">
                  <td className="px-4 py-3 font-mono text-muted-foreground">{r.path}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{r.label}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.description}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 font-bold uppercase tracking-wider", buildCls(r.status))}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backend services */}
      <div>
        <SectionHeading icon={ShieldCheck} title="Backend Services & Integrations" sub="What's wired up and what still needs work" />
        <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">Purpose</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {s.backendMap.map((svc) => (
                <tr key={svc.name} className="hover:bg-accent/30">
                  <td className="px-4 py-3 font-semibold text-foreground">{svc.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{svc.purpose}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 font-bold uppercase tracking-wider", integrationCls(svc.status))}>
                      {svc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security audit */}
      <div>
        <SectionHeading icon={AlertTriangle} title="Security Audit Items" sub="Known areas to review before go-live" />
        <div className="mt-3 space-y-2">
          {s.securityAuditItems.map((item, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-border bg-surface p-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{item.area}</span>
                  <span className="text-xs font-semibold text-foreground">— {item.item}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", auditCls(item.status))}>
                    {item.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended focus */}
      <div>
        <SectionHeading icon={Rocket} title="Recommended Focus" sub="What to work on next, in priority order" />
        <div className="mt-3 space-y-2">
          {s.recommendedFocus.map((item, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-border bg-surface p-4">
              <span className={cn("mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider h-fit", priorityCls(item.priority))}>
                {item.priority}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">{item.task}</div>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.why}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Claude workflow notes */}
      <div>
        <SectionHeading icon={Sparkles} title="AI Session Notes" sub="What the last Claude session worked on and what to avoid" />
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-success">Worked On</div>
            <ul className="space-y-1.5">
              {s.claudeWorkflowNotes.workedOn.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-urgent">Do Not Touch</div>
            <ul className="space-y-1.5">
              {s.claudeWorkflowNotes.doNotTouch.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-urgent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">Next Step</div>
            <p className="text-xs leading-relaxed text-foreground">{s.claudeWorkflowNotes.nextStep}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
