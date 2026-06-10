import { createServerFn } from "@tanstack/react-start";
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

async function tableCount(table: string, filters?: (query: any) => any) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let query = (supabaseAdmin as any).from(table).select("*", { count: "exact", head: true });
  if (filters) query = filters(query);
  const { count, error } = (await query) as CountResult;
  if (error) throw error;
  return count ?? 0;
}

export const getOwnerMetrics = createServerFn({ method: "GET" })
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
    ] = await Promise.all([
      tableCount("companies"),
      tableCount("profiles"),
      tableCount("jobs"),
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
        .select("id, created_at, full_name, business_name, email, city_state, truck_count, current_software, heard_from, billing_preference, status, invited_at")
        .order("created_at", { ascending: false })
        .limit(100),
      admin
        .from("jobs")
        .select("id, company_id, status, priority, job_type, estimated_price, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      admin
        .from("completed_jobs")
        .select("id, company_id, completed_at, price, tax_amount, payment_status, response_minutes, job_type")
        .gte("completed_at", since30)
        .order("completed_at", { ascending: false })
        .limit(1000),
    ]);

    for (const result of [companiesRes, profilesRes, applicationsRes, activeJobsRes, completedJobsRes]) {
      if (result.error) throw result.error;
    }

    const companies = companiesRes.data ?? [];
    const profiles = profilesRes.data ?? [];
    const applications = applicationsRes.data ?? [];
    const jobs = activeJobsRes.data ?? [];
    const completed = completedJobsRes.data ?? [];

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
      },
      breakdowns: {
        applicationStatus: countBy(applications, "status"),
        truckCount: countBy(applications, "truck_count"),
        software: countBy(applications, "current_software"),
        heardFrom: countBy(applications, "heard_from"),
        jobStatus: countBy(jobs, "status"),
        jobPriority: countBy(jobs, "priority"),
        completedJobType30: countBy(completed, "job_type"),
      },
      recentApplications: applications.slice(0, 12),
      companies: companyStats.slice(0, 12),
    };
  });
