import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// --- Trigger admin email on new signup ---
// Called from the signup success path. The user IS authenticated at that
// moment (just signed up) so we can identify them via the auth middleware.
export const notifyAdminOfSignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { adminNotificationEmail, sendEmail } = await import("./emails.server");

    const userId = context.userId;
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, phone, company_id, status, companies(name)")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile) {
      console.error("[notifyAdminOfSignup] profile lookup failed", error);
      return { ok: false };
    }
    if (profile.status !== "pending") {
      return { ok: true, skipped: "not_pending" as const };
    }

    // Create approval token
    const { data: token, error: tokenErr } = await supabaseAdmin
      .from("approval_tokens")
      .insert({ profile_id: profile.id })
      .select("token")
      .single();
    if (tokenErr || !token) {
      console.error("[notifyAdminOfSignup] token create failed", tokenErr);
      return { ok: false };
    }

    const origin =
      process.env.PUBLIC_SITE_URL ?? "https://hookaidashboard.com";
    const approveUrl = `${origin}/api/public/approval-action?token=${token.token}&action=approve`;
    const rejectUrl = `${origin}/api/public/approval-action?token=${token.token}&action=reject`;

    const companies = profile.companies as { name?: string } | { name?: string }[] | null;
    const companyName = Array.isArray(companies)
      ? companies[0]?.name ?? "—"
      : companies?.name ?? "—";

    await sendEmail({
      to: ["michaelttvance@gmail.com"],
      from: "Hooked Alerts <alerts@hookaidashboard.com>",
      subject: `New Hooked Signup Request — ${companyName}`,
      html: adminNotificationEmail({
        applicantName: profile.full_name ?? profile.email ?? "Unknown",
        applicantEmail: profile.email ?? "",
        companyName,
        phone: profile.phone,
        signedUpAt: new Date(),
        approveUrl,
        rejectUrl,
      }),
      reply_to: profile.email ?? undefined,
    });

    return { ok: true };
  });

// --- Get current user's approval status ---
export const getMyApprovalStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return { status: (data?.status ?? "pending") as "pending" | "approved" | "rejected" };
  });

// --- Admin: list pending signups ---
export const listPendingSignups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await isAdmin(context.userId))) throw new Error("Forbidden");

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, phone, created_at, status, companies(name)")
      .order("created_at", { ascending: false });
    if (error) throw error;

    return {
      profiles: (data ?? []).map((p) => {
        const c = p.companies as { name?: string } | { name?: string }[] | null;
        const companyName = Array.isArray(c) ? c[0]?.name ?? null : c?.name ?? null;
        return {
          id: p.id as string,
          fullName: (p.full_name as string | null) ?? null,
          email: (p.email as string | null) ?? null,
          phone: (p.phone as string | null) ?? null,
          createdAt: p.created_at as string,
          status: p.status as "pending" | "approved" | "rejected",
          companyName,
        };
      }),
    };
  });

// --- Admin: approve / reject ---
const SetStatusInput = z.object({
  profileId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
});

export const setApprovalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SetStatusInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await isAdmin(context.userId))) throw new Error("Forbidden");
    return applyApproval(supabaseAdmin, data.profileId, data.action);
  });

async function isAdmin(userId: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.rpc("is_super_admin", { _user_id: userId });
  return !!data;
}

// Shared apply function used by both admin RPC and public token endpoint.
export async function applyApproval(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  profileId: string,
  action: "approve" | "reject",
): Promise<{ ok: true; status: "approved" | "rejected" }> {
  const { approvedEmail, rejectedEmail, sendEmail } = await import("./emails.server");

  const newStatus = action === "approve" ? "approved" : "rejected";
  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .update({ status: newStatus })
    .eq("id", profileId)
    .select("full_name, email")
    .single();
  if (pErr) throw pErr;

  const name = (profile.full_name as string | null) ?? "there";
  const email = profile.email as string | null;
  if (email) {
    await sendEmail({
      to: email,
      subject:
        action === "approve"
          ? "You're approved — welcome to Hooked"
          : "About your Hooked application",
      html: action === "approve" ? approvedEmail({ name }) : rejectedEmail({ name }),
    });
  }

  return { ok: true, status: newStatus };
}
