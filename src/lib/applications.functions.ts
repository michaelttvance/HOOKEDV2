import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TRUCK = ["1-2", "3-5", "6-10", "10+"] as const;
const SOFTWARE = [
  "No",
  "Yes — TowBook",
  "Yes — Towbook",
  "Yes — Other",
] as const;
const HEARD = [
  "Facebook Group",
  "Google",
  "Friend/Referral",
  "Towing Association",
  "Other",
] as const;
const BILLING = ["Monthly", "Annual", "Not sure yet"] as const;

const ApplicationInput = z.object({
  fullName: z.string().trim().min(1).max(200),
  businessName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(3).max(40),
  cityState: z.string().trim().min(1).max(200),
  truckCount: z.enum(TRUCK),
  currentSoftware: z.enum(SOFTWARE),
  softwareComplaints: z.string().trim().max(2000).optional().or(z.literal("")),
  heardFrom: z.enum(HEARD),
  biggestChallenge: z.string().trim().max(2000).optional().or(z.literal("")),
  billingPreference: z.enum(BILLING),
});

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ApplicationInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmail, applicationConfirmationEmail, applicationNotificationEmail } =
      await import("./emails.server");

    const { data: row, error } = await supabaseAdmin
      .from("applications")
      .insert({
        full_name: data.fullName,
        business_name: data.businessName,
        email: data.email,
        phone: data.phone,
        city_state: data.cityState,
        truck_count: data.truckCount,
        current_software: data.currentSoftware,
        software_complaints: data.softwareComplaints || null,
        heard_from: data.heardFrom,
        biggest_challenge: data.biggestChallenge || null,
        billing_preference: data.billingPreference,
      })
      .select("id, created_at")
      .single();
    if (error) throw error;

    // Fire emails (don't block response on failures)
    await Promise.allSettled([
      sendEmail({
        to: data.email,
        from: "Mike at Hooked <mike@hookaidashboard.com>",
        reply_to: "michaelttvance@gmail.com",
        subject: "We received your Hooked application",
        html: applicationConfirmationEmail({
          name: data.fullName,
          businessName: data.businessName,
        }),
      }),
      sendEmail({
        to: ["michaelttvance@gmail.com"],
        from: "Hooked Alerts <alerts@hookaidashboard.com>",
        subject: `New Hooked Application — ${data.businessName} — ${data.cityState}`,
        html: applicationNotificationEmail(data),
        reply_to: data.email,
      }),
    ]);

    return { ok: true, id: row.id };
  });

async function isAdmin(userId: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.rpc("is_super_admin", { _user_id: userId });
  return !!data;
}

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context.userId))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { applications: data ?? [] };
  });

const InviteInput = z.object({ applicationId: z.string().uuid() });

export const approveAndInviteApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InviteInput.parse(d))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.userId))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmail, applicationInviteEmail } = await import("./emails.server");

    const { data: app, error: appErr } = await supabaseAdmin
      .from("applications")
      .select("*")
      .eq("id", data.applicationId)
      .single();
    if (appErr || !app) throw appErr ?? new Error("Application not found");

    // Idempotency: if already invited, don't create duplicate companies/invites
    if (app.status === "invited") {
      return { ok: true, alreadyInvited: true as const };
    }

    // Create a fresh company + invite for them
    const { data: company, error: cErr } = await supabaseAdmin
      .from("companies")
      .insert({ name: app.business_name })
      .select("id")
      .single();
    if (cErr || !company) throw cErr ?? new Error("Failed to create company");

    const { data: invite, error: iErr } = await supabaseAdmin
      .from("invites")
      .insert({
        company_id: company.id,
        email: app.email,
        role: "dispatcher",
        invited_by: context.userId,
      })
      .select("token")
      .single();
    if (iErr || !invite) throw iErr ?? new Error("Failed to create invite");

    const origin = process.env.PUBLIC_SITE_URL ?? "https://hookaidashboard.com";
    const signupUrl = `${origin}/auth?mode=signup&token=${invite.token}&email=${encodeURIComponent(app.email)}`;

    await sendEmail({
      to: app.email,
      from: "Mike at Hooked <mike@hookaidashboard.com>",
      reply_to: "michaelttvance@gmail.com",
      subject: "You're approved — set up your Hooked account",
      html: applicationInviteEmail({
        name: app.full_name,
        businessName: app.business_name,
        signupUrl,
      }),
    });

    await supabaseAdmin
      .from("applications")
      .update({ status: "invited", invited_at: new Date().toISOString() })
      .eq("id", app.id);

    return { ok: true };
  });
