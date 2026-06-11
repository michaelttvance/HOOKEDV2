import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type CountResult = { count: number | null; error: unknown };

type AccountHealth = "healthy" | "watch" | "at_risk";

interface FounderAccount {
  id: string;
  name: string;
  createdAt: string;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  users: number;
  drivers: number;
  activeJobs: number;
  completed30: number;
  revenue30: number;
  health: AccountHealth;
}

/**
 * Founder Command Center metrics.
 *
 * Mirrors the owner-console super-admin gate exactly (DB `is_super_admin` RPC).
 * Pulls REAL data from companies, profiles, drivers, jobs, completed_jobs,
 * applications, and marketing_campaigns. Where Hooked does NOT yet have the
 * backing tables (Stripe/MRR billing, product event tracking, churn events),
 * the values are clearly labeled placeholders so the UI can show a roadmap
 * surface without faking precision. See `placeholders` in the return value.
 */
async function isFounder(userId: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.rpc("is_super_admin", { _user_id: userId });
  return !!data;
}

function startOfDay(daysAgo: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function countBy<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const value = String(row[key] ?? "unknown");
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function trackedUrl(campaign: { name: string; channel: string; target_url?: string | null }) {
  const base = campaign.target_url || "https://hookedv-2.vercel.app/apply";
  const url = new URL(base);
  url.searchParams.set("utm_source", slugify(campaign.channel || "other"));
  url.searchParams.set("utm_medium", "founder_console");
  url.searchParams.set("utm_campaign", slugify(campaign.name));
  return url.toString();
}

async function tableCount(table: string, filters?: (query: any) => any) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let query = (supabaseAdmin as any).from(table).select("*", { count: "exact", head: true });
  if (filters) query = filters(query);
  const { count, error } = (await query) as CountResult;
  if (error) throw error;
  return count ?? 0;
}

export const getFounderMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isFounder(context.userId))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;

    const since30 = startOfDay(30);
    const since7 = startOfDay(7);

    const [
      totalCompanies,
      totalUsers,
      totalDrivers,
      activeJobs,
      completedJobsAll,
      totalApplications,
      newApplications30,
      newApplications7,
      pendingApplications,
      invitedApplications,
      pendingInvites,
      newCompanies30,
      companiesRes,
      profilesRes,
      driversRes,
      jobsRes,
      completedJobsRes,
      applicationsRes,
      campaignsRes,
    ] = await Promise.all([
      tableCount("companies"),
      tableCount("profiles"),
      tableCount("drivers"),
      tableCount("jobs"),
      tableCount("completed_jobs"),
      tableCount("applications"),
      tableCount("applications", (q) => q.gte("created_at", since30)),
      tableCount("applications", (q) => q.gte("created_at", since7)),
      tableCount("applications", (q) => q.eq("status", "new")),
      tableCount("applications", (q) => q.eq("status", "invited")),
      tableCount("invites", (q) => q.is("accepted_at", null)),
      tableCount("companies", (q) => q.gte("created_at", since30)),
      admin
        .from("companies")
        .select("id, name, created_at, trial_ends_at")
        .order("created_at", { ascending: false })
        .limit(100),
      admin
        .from("profiles")
        .select("id, company_id, status, created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
      admin.from("drivers").select("id, company_id, status").limit(1000),
      admin
        .from("jobs")
        .select("id, company_id, status, priority, job_type, created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
      admin
        .from("completed_jobs")
        .select(
          "id, company_id, completed_at, price, tax_amount, payment_status, response_minutes, job_type",
        )
        .gte("completed_at", since30)
        .order("completed_at", { ascending: false })
        .limit(2000),
      admin
        .from("applications")
        .select(
          "id, created_at, full_name, business_name, city_state, truck_count, current_software, heard_from, status, utm_source, utm_campaign",
        )
        .order("created_at", { ascending: false })
        .limit(100),
      admin
        .from("marketing_campaigns")
        .select("id, name, channel, status, budget, goal, notes, target_url, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    for (const result of [
      companiesRes,
      profilesRes,
      driversRes,
      jobsRes,
      completedJobsRes,
      applicationsRes,
      campaignsRes,
    ]) {
      if (result.error) throw result.error;
    }

    const companies = companiesRes.data ?? [];
    const profiles = profilesRes.data ?? [];
    const drivers = driversRes.data ?? [];
    const jobs = jobsRes.data ?? [];
    const completed = completedJobsRes.data ?? [];
    const applications = applicationsRes.data ?? [];
    const campaigns = campaignsRes.data ?? [];
    const campaignStats = campaigns.map((campaign: any) => {
      const slug = slugify(campaign.name);
      const channelSlug = slugify(campaign.channel);
      const leads = applications.filter((app: any) => {
        const appCampaign = slugify(app.utm_campaign ?? "");
        const appSource = slugify(app.utm_source ?? app.heard_from ?? "");
        return appCampaign === slug || (!appCampaign && appSource === channelSlug);
      });
      const invited = leads.filter((app: any) => app.status === "invited").length;
      const budget = Number(campaign.budget ?? 0);
      return {
        ...campaign,
        budget,
        trackingUrl: trackedUrl(campaign),
        leads: leads.length,
        invited,
        costPerLead: leads.length > 0 && budget > 0 ? budget / leads.length : null,
        conversionRate: leads.length > 0 ? Math.round((invited / leads.length) * 100) : 0,
      };
    });

    // REAL: gross customer revenue tracked through completed jobs in last 30d.
    // NOTE: this is customer-side job revenue, NOT Hooked's own SaaS MRR.
    const customerRevenue30 = completed.reduce(
      (sum: number, row: any) => sum + Number(row.price ?? 0) + Number(row.tax_amount ?? 0),
      0,
    );
    const paidRevenue30 = completed
      .filter((row: any) => row.payment_status === "paid")
      .reduce(
        (sum: number, row: any) => sum + Number(row.price ?? 0) + Number(row.tax_amount ?? 0),
        0,
      );
    const avgResponse30 =
      completed.length > 0
        ? Math.round(
            completed.reduce(
              (sum: number, row: any) => sum + Number(row.response_minutes ?? 0),
              0,
            ) / completed.length,
          )
        : 0;

    // Account health (per company) — REAL engagement signals.
    const accounts: FounderAccount[] = companies.map((company: any) => {
      const companyProfiles = profiles.filter((p: any) => p.company_id === company.id);
      const companyDrivers = drivers.filter((d: any) => d.company_id === company.id);
      const companyActiveJobs = jobs.filter((j: any) => j.company_id === company.id);
      const companyCompleted = completed.filter((j: any) => j.company_id === company.id);
      const trialEndsAt = company.trial_ends_at ? new Date(company.trial_ends_at) : null;
      const trialDaysLeft = trialEndsAt
        ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        : null;

      // Heuristic health score from REAL signals (users, drivers, recent jobs).
      const usage = companyActiveJobs.length + companyCompleted.length;
      const health: AccountHealth =
        usage >= 5 && companyProfiles.length > 0 ? "healthy" : usage >= 1 ? "watch" : "at_risk";

      return {
        id: company.id,
        name: company.name,
        createdAt: company.created_at,
        trialEndsAt: company.trial_ends_at ?? null,
        trialDaysLeft,
        users: companyProfiles.length,
        drivers: companyDrivers.length,
        activeJobs: companyActiveJobs.length,
        completed30: companyCompleted.length,
        revenue30: companyCompleted.reduce(
          (sum: number, row: any) => sum + Number(row.price ?? 0) + Number(row.tax_amount ?? 0),
          0,
        ),
        health,
      };
    });

    const healthBreakdown = {
      healthy: accounts.filter((a) => a.health === "healthy").length,
      watch: accounts.filter((a) => a.health === "watch").length,
      at_risk: accounts.filter((a) => a.health === "at_risk").length,
    };

    const trialsExpiringSoon = accounts.filter(
      (a) => a.trialDaysLeft !== null && a.trialDaysLeft >= 0 && a.trialDaysLeft <= 7,
    ).length;
    const trialsExpired = accounts.filter(
      (a) => a.trialDaysLeft !== null && a.trialDaysLeft < 0,
    ).length;

    // Feature usage — REAL adoption derived from existing tables.
    const companiesWithJobs = new Set(jobs.map((j: any) => j.company_id).filter(Boolean)).size;
    const companiesWithDrivers = new Set(drivers.map((d: any) => d.company_id).filter(Boolean))
      .size;
    const companiesWithCompleted = new Set(completed.map((j: any) => j.company_id).filter(Boolean))
      .size;
    const denom = Math.max(totalCompanies, 1);

    const featureUsage = [
      {
        feature: "Dispatch board (jobs created)",
        companies: companiesWithJobs,
        adoptionPct: Math.round((companiesWithJobs / denom) * 100),
      },
      {
        feature: "Driver app (drivers added)",
        companies: companiesWithDrivers,
        adoptionPct: Math.round((companiesWithDrivers / denom) * 100),
      },
      {
        feature: "Job completion / billing",
        companies: companiesWithCompleted,
        adoptionPct: Math.round((companiesWithCompleted / denom) * 100),
      },
    ];

    const conversionPct =
      totalApplications > 0 ? Math.round((invitedApplications / totalApplications) * 100) : 0;
    const activeCampaigns = campaignStats.filter((c: any) => c.status === "active").length;
    const totalCampaignBudget = campaignStats
      .filter((c: any) => c.status === "active")
      .reduce((sum: number, c: any) => sum + Number(c.budget ?? 0), 0);
    const attributedApplications = applications.filter((app: any) => app.utm_source || app.utm_campaign)
      .length;
    const campaignLeads = campaignStats.reduce((sum: number, c: any) => sum + c.leads, 0);

    return {
      generatedAt: new Date().toISOString(),

      // ---- REAL platform-wide data ----
      platform: {
        companies: totalCompanies,
        newCompanies30,
        users: totalUsers,
        drivers: totalDrivers,
        activeJobs,
        completedJobsAll,
        completedJobs30: completed.length,
        applications: totalApplications,
        newApplications30,
        newApplications7,
        pendingApplications,
        invitedApplications,
        pendingInvites,
        conversionPct,
        avgResponse30,
        activeCampaigns,
        totalCampaignBudget,
        attributedApplications,
        campaignLeads,
      },

      // ---- REAL: customer-side job revenue tracked (NOT Hooked SaaS MRR) ----
      customerRevenue: {
        tracked30: customerRevenue30,
        paid30: paidRevenue30,
        unpaid30: customerRevenue30 - paidRevenue30,
        completedJobs30: completed.length,
      },

      // ---- PLACEHOLDER: Hooked's own SaaS billing. No Stripe/billing tables yet. ----
      // These are illustrative and clearly flagged as not-yet-instrumented.
      revenuePlaceholder: {
        isPlaceholder: true as const,
        note: "Hooked SaaS MRR/ARR is not yet instrumented. No Stripe/subscriptions table exists. Values below are illustrative placeholders derived from active accounts at an assumed plan price, not real billing.",
        assumedMonthlyPlanUsd: 199,
        billableAccounts: healthBreakdown.healthy + healthBreakdown.watch,
        estimatedMrrUsd: (healthBreakdown.healthy + healthBreakdown.watch) * 199,
        estimatedArrUsd: (healthBreakdown.healthy + healthBreakdown.watch) * 199 * 12,
      },

      featureUsage,

      accountHealth: {
        breakdown: healthBreakdown,
        trialsExpiringSoon,
        trialsExpired,
        accounts: accounts.slice(0, 25),
      },

      breakdowns: {
        applicationStatus: countBy(applications, "status"),
        heardFrom: countBy(applications, "heard_from"),
        utmSource: countBy(applications.filter((a: any) => a.utm_source), "utm_source"),
        utmCampaign: countBy(applications.filter((a: any) => a.utm_campaign), "utm_campaign"),
        jobStatus: countBy(jobs, "status"),
        jobPriority: countBy(jobs, "priority"),
        completedJobType30: countBy(completed, "job_type"),
      },

      recentApplications: applications.slice(0, 8),
      campaigns: campaignStats,

      // ---- PLACEHOLDER: product analytics / event-tracking not yet wired ----
      analyticsPlaceholder: {
        isPlaceholder: true as const,
        note: "No product-analytics/event-tracking table exists yet (e.g. logins, feature clicks, session length). Wire an events table or analytics provider to populate these.",
        metrics: [
          { label: "Daily active operators", value: "—" },
          { label: "Avg session length", value: "—" },
          { label: "7-day retention", value: "—" },
          { label: "Churned accounts (30d)", value: "—" },
        ],
      },
    };
  });
