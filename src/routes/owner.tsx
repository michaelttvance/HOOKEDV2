import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Gauge,
  Link2,
  Loader2,
  Megaphone,
  Pause,
  Play,
  Sparkles,
  TrendingUp,
  Truck,
  UserPlus,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  createMarketingCampaign,
  getOwnerMetrics,
  setMarketingCampaignStatus,
} from "@/lib/owner.functions";
import { cn } from "@/lib/utils";

const OWNER_EMAILS = ["mike@hookaidashboard.com", "michaelttvance@gmail.com"];

export const Route = createFileRoute("/owner")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Owner Console — Hooked" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { redirect: "/owner" } });
    if (!OWNER_EMAILS.includes((data.user.email ?? "").toLowerCase())) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: OwnerConsole,
});

function OwnerConsole() {
  const metricsFn = useServerFn(getOwnerMetrics);
  const { data, isLoading, error } = useQuery({
    queryKey: ["owner-metrics"],
    queryFn: () => metricsFn(),
    refetchInterval: 60_000,
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-amber-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Owner Console</h1>
              <p className="text-xs text-slate-500">Platform KPIs, customer health, and growth signals</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-amber-300 hover:text-slate-950"
            >
              <UserPlus className="h-3.5 w-3.5" /> Review applications
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" /> Export view
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {isLoading && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading owner metrics…
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {(error as Error).message}
          </div>
        )}
        {data && <OwnerMetrics data={data} />}
      </main>
    </div>
  );
}

function OwnerMetrics({ data }: { data: Awaited<ReturnType<typeof getOwnerMetrics>> }) {
  const totals = data.totals;
  const conversion =
    totals.applications > 0 ? Math.round((totals.invitedApplications / totals.applications) * 100) : 0;

  return (
    <>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Building2} label="Customer companies" value={fmt(totals.companies)} sub={`${fmt(totals.users)} total users`} />
        <MetricCard icon={UserPlus} label="Applications" value={fmt(totals.applications)} sub={`${fmt(totals.newApplications30)} in last 30 days`} tone="amber" />
        <MetricCard icon={Truck} label="Live jobs" value={fmt(totals.activeJobs)} sub={`${fmt(totals.completedJobs)} completed all-time`} />
        <MetricCard icon={DollarSign} label="Customer revenue tracked" value={money(totals.revenue30)} sub={`${money(totals.paid30)} paid in last 30 days`} tone="green" />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <MetricCard icon={Megaphone} label="Active campaigns" value={fmt(totals.activeCampaigns)} sub={`${money(totals.totalCampaignBudget)} active budget`} tone="amber" />
        <MetricCard icon={Link2} label="Attributed leads" value={fmt(totals.attributedApplications)} sub={`${fmt(totals.campaignLeads)} matched to campaigns`} />
        <MetricCard icon={BarChart3} label="Marketing conversion" value={`${conversion}%`} sub="Applications invited to setup" tone="green" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Growth Funnel" action={`${conversion}% app-to-invite`}>
          <div className="grid gap-3 sm:grid-cols-4">
            <FunnelStep label="Applications" value={totals.applications} />
            <FunnelStep label="Pending review" value={totals.pendingApplications} />
            <FunnelStep label="Invited" value={totals.invitedApplications} />
            <FunnelStep label="Customers" value={totals.companies} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Signal icon={TrendingUp} label="Last 7 days" value={`${fmt(totals.applications7)} applications`} />
            <Signal icon={Clock} label="Trial pipeline" value={`${fmt(totals.pendingInvites)} pending invites`} />
            <Signal icon={Gauge} label="Avg response" value={`${fmt(totals.avgResponse30)} min`} />
          </div>
        </Panel>

        <Panel title="Market Signals" action="Application sources">
          <BarList data={data.breakdowns.heardFrom} />
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Panel title="Fleet Size Demand">
          <BarList data={data.breakdowns.truckCount} />
        </Panel>
        <Panel title="Current Software">
          <BarList data={data.breakdowns.software} />
        </Panel>
        <Panel title="Active Job Mix">
          <BarList data={data.breakdowns.jobStatus} />
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Campaign Control" action="Create, track, pause">
          <CampaignManager campaigns={data.campaigns} />
        </Panel>
        <Panel title="Attribution Analytics" action="UTM tracking">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">UTM Sources</div>
              <BarList data={data.breakdowns.utmSource} />
            </div>
            <div>
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">UTM Campaigns</div>
              <BarList data={data.breakdowns.utmCampaign} />
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">
            Use campaign tracking links anywhere you market Hooked. Every application submitted from
            that link is tied back to the campaign, source, cost per lead, and invite conversion.
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Customer Health" action="Recent accounts">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2">Users</th>
                  <th className="px-3 py-2">Jobs</th>
                  <th className="px-3 py-2">Trial</th>
                  <th className="px-3 py-2 text-right">30d Rev</th>
                </tr>
              </thead>
              <tbody>
                {data.companies.map((company) => (
                  <tr key={company.id} className="border-t border-slate-200">
                    <td className="px-3 py-3">
                      <div className="font-semibold">{company.name}</div>
                      <div className="text-xs text-slate-500">Joined {date(company.createdAt)}</div>
                    </td>
                    <td className="px-3 py-3">{company.users}</td>
                    <td className="px-3 py-3">
                      <div>{company.activeJobs} active</div>
                      <div className="text-xs text-slate-500">{company.completed30} complete</div>
                    </td>
                    <td className="px-3 py-3">
                      <TrialBadge days={company.trialDaysLeft} />
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">{money(company.revenue30)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Recent Applications" action="Newest leads">
          <div className="space-y-2">
            {data.recentApplications.map((app) => (
              <div key={app.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{app.business_name}</div>
                    <div className="text-xs text-slate-500">{app.full_name} · {app.city_state}</div>
                  </div>
                  <StatusPill status={app.status} />
                </div>
                <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-slate-600">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5">{app.truck_count} trucks</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5">{app.current_software}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5">{date(app.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </>
  );
}

type Campaign = Awaited<ReturnType<typeof getOwnerMetrics>>["campaigns"][number];

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
      qc.invalidateQueries({ queryKey: ["owner-metrics"] });
    },
  });

  const statusM = useMutation({
    mutationFn: (vars: { id: string; status: "active" | "paused" | "ended" }) =>
      setStatus({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owner-metrics"] }),
  });

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
        className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:grid-cols-6"
      >
        <input
          required
          value={draft.name}
          onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          placeholder="Campaign name"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm lg:col-span-2"
        />
        <select
          value={draft.channel}
          onChange={(e) => setDraft((p) => ({ ...p, channel: e.target.value }))}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
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
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <input
          value={draft.goal}
          onChange={(e) => setDraft((p) => ({ ...p, goal: e.target.value }))}
          placeholder="Goal"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm lg:col-span-2"
        />
        <input
          value={draft.targetUrl}
          onChange={(e) => setDraft((p) => ({ ...p, targetUrl: e.target.value }))}
          placeholder="Landing URL"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm lg:col-span-5"
        />
        <button
          type="submit"
          disabled={createM.isPending}
          className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {createM.isPending ? "Adding..." : "Add campaign"}
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-500">
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
              <tr key={campaign.id} className="border-t border-slate-200 align-top">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <StatusDot status={campaign.status} />
                    <div>
                      <div className="font-semibold">{campaign.name}</div>
                      <div className="text-xs text-slate-500">{campaign.channel} · {campaign.goal || "No goal set"}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(campaign.trackingUrl, campaign.id)}
                    className="mt-2 inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-amber-300 hover:text-slate-950"
                  >
                    <Link2 className="h-3 w-3" /> {copied === campaign.id ? "Copied" : "Copy tracking link"}
                  </button>
                </td>
                <td className="px-3 py-3">{money(campaign.budget)}</td>
                <td className="px-3 py-3">{campaign.leads}</td>
                <td className="px-3 py-3">{campaign.costPerLead === null ? "—" : money(campaign.costPerLead)}</td>
                <td className="px-3 py-3">{campaign.conversionRate}%</td>
                <td className="px-3 py-3 text-right">
                  {campaign.status === "active" ? (
                    <button
                      type="button"
                      onClick={() => statusM.mutate({ id: campaign.id, status: "paused" })}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      <Pause className="h-3 w-3" /> Pause
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => statusM.mutate({ id: campaign.id, status: "active" })}
                      className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      <Play className="h-3 w-3" /> Resume
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {createM.error && <div className="text-xs text-red-600">{(createM.error as Error).message}</div>}
      {statusM.error && <div className="text-xs text-red-600">{(statusM.error as Error).message}</div>}
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
      ? "bg-amber-100 text-amber-800"
      : tone === "green"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-slate-100 text-slate-700";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={cn("mb-4 flex h-10 w-10 items-center justify-center rounded-lg", toneClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-sm font-semibold text-slate-700">{label}</div>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold">{title}</h2>
        {action && <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">{action}</span>}
      </div>
      {children}
    </section>
  );
}

function FunnelStep({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="text-2xl font-bold">{fmt(value)}</div>
      <div className="mt-1 text-xs font-semibold text-slate-600">{label}</div>
    </div>
  );
}

function Signal({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-slate-700 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

function BarList({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  if (entries.length === 0) return <div className="text-sm text-slate-500">No data yet.</div>;
  return (
    <div className="space-y-3">
      {entries.map(([label, value]) => (
        <div key={label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">{label}</span>
            <span className="text-slate-500">{value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${(value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrialBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-xs text-slate-400">n/a</span>;
  const cls = days <= 0 ? "bg-red-100 text-red-700" : days <= 7 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700";
  return <span className={cn("rounded-full px-2 py-1 text-[11px] font-semibold", cls)}>{days <= 0 ? "expired" : `${days}d left`}</span>;
}

function StatusPill({ status }: { status: string }) {
  const cls = status === "invited" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800";
  return <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider", cls)}>{status}</span>;
}

function StatusDot({ status }: { status: string }) {
  const cls =
    status === "active"
      ? "bg-emerald-500"
      : status === "paused"
        ? "bg-amber-400"
        : "bg-slate-300";
  return <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", cls)} />;
}

function fmt(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function date(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
