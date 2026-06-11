import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type CountResult = { count: number | null; error: unknown };

async function isOwner(userId: string): Promise<boolean> {
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
  url.searchParams.set("utm_medium", "owner_console");
  url.searchParams.set("utm_campaign", slugify(campaign.name));
  return url.toString();
}

const DEFAULT_CAMPAIGNS = [
  {
    name: "Google Search - Tow Dispatch",
    channel: "Google",
    status: "active",
    budget: 500,
    goal: "Capture towing companies searching for smarter dispatch software.",
    notes: "Use with Google Search keywords around towing dispatch, tow software, live tracking, and impound management.",
    target_url: "https://hookedv-2.vercel.app/apply",
  },
  {
    name: "Facebook Towing Groups",
    channel: "Facebook Group",
    status: "active",
    budget: 250,
    goal: "Test owner-operator interest from towing community posts.",
    notes: "Use in towing group posts and comments when operators ask for simpler dispatch software.",
    target_url: "https://hookedv-2.vercel.app/apply",
  },
  {
    name: "Referral Partners",
    channel: "Referral",
    status: "active",
    budget: 0,
    goal: "Track referrals from industry contacts, drivers, shops, and dispatch partners.",
    notes: "Share this link directly with people recommending Hooked.",
    target_url: "https://hookedv-2.vercel.app/apply",
  },
] as const;

async function tableCount(table: string, filters?: (query: any) => any) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let query = (supabaseAdmin as any).from(table).select("*", { count: "exact", head: true });
  if (filters) query = filters(query);
  let { count, error } = (await query) as CountResult;
  if (error && filters) {
    const message = String(error instanceof Error ? error.message : error);
    if (/closed_at|schema cache|does not exist/i.test(message)) {
      const fallback = (supabaseAdmin as any).from(table).select("*", { count: "exact", head: true });
      ({ count, error } = (await fallback) as CountResult);
    }
  }
  if (error) throw error;
  return count ?? 0;
}

export const getCompanyOwnerMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;

    const { data: roleRows, error: roleError } = await admin
      .from("user_roles")
      .select("company_id, role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .limit(1);
    if (roleError) throw roleError;

    const companyId = roleRows?.[0]?.company_id as string | undefined;
    if (!companyId) throw new Error("Forbidden");

    const since30 = startOfDay(30);

    const [
      companyRes,
      profilesRes,
      rolesRes,
      driversRes,
      jobsRes,
      completed30Res,
      completedAllCount,
    ] = await Promise.all([
      admin
        .from("companies")
        .select("id, name, created_at, trial_ends_at")
        .eq("id", companyId)
        .single(),
      admin
        .from("profiles")
        .select("id, email, full_name, status, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(500),
      admin
        .from("user_roles")
        .select("user_id, role, created_at")
        .eq("company_id", companyId)
        .limit(500),
      admin
        .from("drivers")
        .select("id, name, truck_number, phone, status, current_job_id, eta_min, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(500),
      admin
        .from("jobs")
        .select(
          "id, customer_name, location, status, priority, job_type, estimated_price, assigned_driver_id, created_at",
        )
        .eq("company_id", companyId)
        .is("closed_at", null)
        .order("created_at", { ascending: false })
        .limit(500),
      admin
        .from("completed_jobs")
        .select(
          "id, customer_name, driver_name, job_type, completed_at, price, tax_amount, payment_status, response_minutes",
        )
        .eq("company_id", companyId)
        .gte("completed_at", since30)
        .order("completed_at", { ascending: false })
        .limit(1000),
      tableCount("completed_jobs", (q) => q.eq("company_id", companyId)),
    ]);

    for (const result of [companyRes, profilesRes, rolesRes, driversRes, jobsRes, completed30Res]) {
      if (result.error) throw result.error;
    }

    const company = companyRes.data;
    const profiles = profilesRes.data ?? [];
    const roles = rolesRes.data ?? [];
    const drivers = driversRes.data ?? [];
    const jobs = jobsRes.data ?? [];
    const completed30 = completed30Res.data ?? [];

    const roleByUser = new Map<string, string>();
    for (const role of roles) roleByUser.set(role.user_id, role.role);

    const revenue30 = completed30.reduce(
      (sum: number, row: any) => sum + Number(row.price ?? 0) + Number(row.tax_amount ?? 0),
      0,
    );
    const paid30 = completed30
      .filter((row: any) => row.payment_status === "paid")
      .reduce(
        (sum: number, row: any) => sum + Number(row.price ?? 0) + Number(row.tax_amount ?? 0),
        0,
      );
    const avgResponse30 =
      completed30.length > 0
        ? Math.round(
            completed30.reduce(
              (sum: number, row: any) => sum + Number(row.response_minutes ?? 0),
              0,
            ) / completed30.length,
          )
        : 0;

    const trialEndsAt = company?.trial_ends_at ? new Date(company.trial_ends_at) : null;
    const trialDaysLeft = trialEndsAt
      ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      : null;
    const lastActive =
      [jobs[0]?.created_at, completed30[0]?.completed_at, profiles[0]?.created_at]
        .filter(Boolean)
        .sort()
        .at(-1) ?? null;

    const insights = [
      jobs.filter((j: any) => j.status === "unassigned").length > 0
        ? {
            tone: "urgent",
            title: "Unassigned work needs attention",
            detail: `${jobs.filter((j: any) => j.status === "unassigned").length} active job${
              jobs.filter((j: any) => j.status === "unassigned").length === 1 ? "" : "s"
            } still need a driver.`,
          }
        : {
            tone: "success",
            title: "Dispatch queue is covered",
            detail: "No active jobs are currently sitting unassigned.",
          },
      avgResponse30 > 0
        ? {
            tone: avgResponse30 <= 25 ? "success" : "warning",
            title: "Response-time trend",
            detail: `Average completed-job response time is ${avgResponse30} minutes over the last 30 days.`,
          }
        : {
            tone: "muted",
            title: "Response data will appear after completions",
            detail: "Complete jobs from the board to unlock response-time reporting.",
          },
      drivers.filter((d: any) => d.status === "available").length > 0
        ? {
            tone: "success",
            title: "Fleet availability",
            detail: `${drivers.filter((d: any) => d.status === "available").length} driver${
              drivers.filter((d: any) => d.status === "available").length === 1 ? "" : "s"
            } available right now.`,
          }
        : {
            tone: "warning",
            title: "No available drivers",
            detail: "All drivers are busy or off. Review schedule coverage before more calls come in.",
          },
    ];

    return {
      generatedAt: new Date().toISOString(),
      scope: {
        companyId,
        companyName: company?.name ?? "Your company",
        createdAt: company?.created_at ?? null,
        trialEndsAt: company?.trial_ends_at ?? null,
        trialDaysLeft,
        lastActive,
      },
      totals: {
        activeJobs: jobs.length,
        completedJobs30: completed30.length,
        completedJobsAll: completedAllCount,
        revenue30,
        paid30,
        unpaid30: revenue30 - paid30,
        avgResponse30,
        users: profiles.length,
        owners: roles.filter((r: any) => r.role === "admin").length,
        dispatchers: roles.filter((r: any) => r.role === "dispatcher").length,
        driverUsers: roles.filter((r: any) => r.role === "driver").length,
        drivers: drivers.length,
        availableDrivers: drivers.filter((d: any) => d.status === "available").length,
      },
      breakdowns: {
        jobStatus: countBy(jobs, "status"),
        jobPriority: countBy(jobs, "priority"),
        completedJobType30: countBy(completed30, "job_type"),
        paymentStatus30: countBy(completed30, "payment_status"),
        driverStatus: countBy(drivers, "status"),
        teamRoles: countBy(roles, "role"),
      },
      team: profiles.map((profile: any) => ({
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        status: profile.status,
        role: roleByUser.get(profile.id) ?? "dispatcher",
        createdAt: profile.created_at,
      })),
      drivers: drivers.map((driver: any) => ({
        id: driver.id,
        name: driver.name,
        truckNumber: driver.truck_number,
        phone: driver.phone,
        status: driver.status,
        currentJobId: driver.current_job_id,
        etaMin: driver.eta_min,
      })),
      recentJobs: jobs.slice(0, 10),
      recentCompleted: completed30.slice(0, 10),
      insights,
    };
  });

export const getOwnerMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isOwner(context.userId))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;

    const since30 = startOfDay(30);
    const since7 = startOfDay(7);

    const [
      totalCompanies,
      totalUsers,
      activeJobs,
      completedJobs,
      totalApplications,
      newApplications30,
      pendingApplications,
      invitedApplications,
      pendingInvites,
      companiesRes,
      profilesRes,
      applicationsRes,
      activeJobsRes,
      completedJobsRes,
      campaignsRes,
    ] = await Promise.all([
      tableCount("companies"),
      tableCount("profiles"),
      tableCount("jobs", (q) => q.is("closed_at", null)),
      tableCount("completed_jobs"),
      tableCount("applications"),
      tableCount("applications", (q) => q.gte("created_at", since30)),
      tableCount("applications", (q) => q.eq("status", "new")),
      tableCount("applications", (q) => q.eq("status", "invited")),
      tableCount("invites", (q) => q.is("accepted_at", null)),
      admin
        .from("companies")
        .select("id, name, created_at, trial_ends_at")
        .order("created_at", { ascending: false })
        .limit(50),
      admin
        .from("profiles")
        .select("id, company_id, email, full_name, status, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      admin
        .from("applications")
        .select("id, created_at, full_name, business_name, email, city_state, truck_count, current_software, heard_from, billing_preference, status, invited_at, utm_source, utm_medium, utm_campaign, utm_content, referrer")
        .order("created_at", { ascending: false })
        .limit(100),
      admin
        .from("jobs")
        .select("id, company_id, status, priority, job_type, estimated_price, created_at")
        .is("closed_at", null)
        .order("created_at", { ascending: false })
        .limit(500),
      admin
        .from("completed_jobs")
        .select("id, company_id, completed_at, price, tax_amount, payment_status, response_minutes, job_type")
        .gte("completed_at", since30)
        .order("completed_at", { ascending: false })
        .limit(1000),
      admin
        .from("marketing_campaigns")
        .select("id, name, channel, status, budget, goal, notes, target_url, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    for (const result of [companiesRes, profilesRes, applicationsRes, completedJobsRes, campaignsRes]) {
      if (result.error) throw result.error;
    }

    const companies = companiesRes.data ?? [];
    const profiles = profilesRes.data ?? [];
    const applications = applicationsRes.data ?? [];
    let jobs = activeJobsRes.data ?? [];
    if (activeJobsRes.error) {
      const message = String(activeJobsRes.error instanceof Error ? activeJobsRes.error.message : activeJobsRes.error);
      if (/closed_at|schema cache|does not exist/i.test(message)) {
        const { data: fallbackJobs, error: fallbackError } = await admin
          .from("jobs")
          .select("id, company_id, status, priority, job_type, estimated_price, created_at")
          .order("created_at", { ascending: false })
          .limit(500);
        if (!fallbackError) jobs = fallbackJobs ?? [];
      } else {
        throw activeJobsRes.error;
      }
    }
    const completed = completedJobsRes.data ?? [];
    let campaigns = campaignsRes.data ?? [];
    if (campaigns.length === 0) {
      const { error: seedError } = await admin.from("marketing_campaigns").upsert(DEFAULT_CAMPAIGNS, {
        onConflict: "name",
        ignoreDuplicates: true,
      });
      if (!seedError) {
        const { data: seededCampaigns, error: seededError } = await admin
          .from("marketing_campaigns")
          .select("id, name, channel, status, budget, goal, notes, target_url, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(100);
        if (!seededError) campaigns = seededCampaigns ?? [];
      }
    }

    const revenue30 = completed.reduce(
      (sum: number, row: any) => sum + Number(row.price ?? 0) + Number(row.tax_amount ?? 0),
      0,
    );
    const paid30 = completed
      .filter((row: any) => row.payment_status === "paid")
      .reduce((sum: number, row: any) => sum + Number(row.price ?? 0) + Number(row.tax_amount ?? 0), 0);
    const avgResponse30 =
      completed.length > 0
        ? Math.round(completed.reduce((sum: number, row: any) => sum + Number(row.response_minutes ?? 0), 0) / completed.length)
        : 0;

    const companyStats = companies.map((company: any) => {
      const companyProfiles = profiles.filter((p: any) => p.company_id === company.id);
      const companyJobs = jobs.filter((j: any) => j.company_id === company.id);
      const companyCompleted = completed.filter((j: any) => j.company_id === company.id);
      const trialEndsAt = company.trial_ends_at ? new Date(company.trial_ends_at) : null;
      const trialDaysLeft = trialEndsAt
        ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        : null;
      return {
        id: company.id,
        name: company.name,
        createdAt: company.created_at,
        trialEndsAt: company.trial_ends_at ?? null,
        trialDaysLeft,
        users: companyProfiles.length,
        activeJobs: companyJobs.length,
        completed30: companyCompleted.length,
        revenue30: companyCompleted.reduce(
          (sum: number, row: any) => sum + Number(row.price ?? 0) + Number(row.tax_amount ?? 0),
          0,
        ),
      };
    });

    const applications7 = applications.filter((a: any) => new Date(a.created_at).getTime() >= new Date(since7).getTime()).length;
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
    const attributedApplications = applications.filter((app: any) => app.utm_source || app.utm_campaign).length;
    const campaignLeads = campaignStats.reduce((sum: number, c: any) => sum + c.leads, 0);
    const activeCampaigns = campaignStats.filter((c: any) => c.status === "active").length;
    const totalCampaignBudget = campaignStats
      .filter((c: any) => c.status === "active")
      .reduce((sum: number, c: any) => sum + Number(c.budget ?? 0), 0);

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        companies: totalCompanies,
        users: totalUsers,
        activeJobs,
        completedJobs,
        applications: totalApplications,
        newApplications30,
        applications7,
        pendingApplications,
        invitedApplications,
        pendingInvites,
        revenue30,
        paid30,
        avgResponse30,
        attributedApplications,
        campaignLeads,
        activeCampaigns,
        totalCampaignBudget,
      },
      breakdowns: {
        applicationStatus: countBy(applications, "status"),
        truckCount: countBy(applications, "truck_count"),
        software: countBy(applications, "current_software"),
        heardFrom: countBy(applications, "heard_from"),
        utmSource: countBy(applications.filter((a: any) => a.utm_source), "utm_source"),
        utmCampaign: countBy(applications.filter((a: any) => a.utm_campaign), "utm_campaign"),
        jobStatus: countBy(jobs, "status"),
        jobPriority: countBy(jobs, "priority"),
        completedJobType30: countBy(completed, "job_type"),
      },
      recentApplications: applications.slice(0, 12),
      companies: companyStats.slice(0, 12),
      campaigns: campaignStats,
    };
  });

const CampaignInput = z.object({
  name: z.string().trim().min(1).max(160),
  channel: z.string().trim().min(1).max(80),
  budget: z.coerce.number().min(0).max(1_000_000).default(0),
  goal: z.string().trim().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  targetUrl: z.string().trim().url().max(500).default("https://hookedv-2.vercel.app/apply"),
});

export const createMarketingCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CampaignInput.parse(d))
  .handler(async ({ data, context }) => {
    if (!(await isOwner(context.userId))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await (supabaseAdmin as any)
      .from("marketing_campaigns")
      .insert({
        name: data.name,
        channel: data.channel,
        budget: data.budget,
        goal: data.goal || null,
        notes: data.notes || null,
        target_url: data.targetUrl,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

const CampaignStatusInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["active", "paused", "ended"]),
});

export const setMarketingCampaignStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CampaignStatusInput.parse(d))
  .handler(async ({ data, context }) => {
    if (!(await isOwner(context.userId))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("marketing_campaigns")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
