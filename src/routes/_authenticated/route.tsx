import { createFileRoute, Outlet, redirect, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Smartphone,
  Receipt,
  Sparkles,
  Bell,
  Truck,
  PanelRightOpen,
  PanelRightClose,
  LogOut,
  UserPlus,
  Mail,
  Link2,
  Check,
  Menu,
  X,
  Settings as SettingsIcon,
  Warehouse,
  ShieldCheck,
  Building2,
  BarChart3,
  Crown,
  Rocket,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DispatchProvider, useDispatch } from "../../lib/dispatch-store";
import { AuthProvider, useAuth } from "../../lib/use-auth";
import { AiAssistant } from "../../components/ai-assistant";
import { Onboarding } from "../../components/onboarding";
import { InviteDialog } from "../../components/invite-dialog";
import { SupportWidget } from "../../components/support-widget";
import { cn } from "../../lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    // Gate by approval status
    const { data: profile } = await supabase
      .from("profiles")
      .select("status, companies(trial_ends_at)")
      .eq("id", data.user.id)
      .maybeSingle();
    const status = (profile?.status as "pending" | "approved" | "rejected" | undefined) ?? "pending";
    if (status === "pending") throw redirect({ to: "/pending" });
    if (status === "rejected") throw redirect({ to: "/rejected" });

    // Gate by trial expiration (super admin is exempt)
    const isSuperAdmin = ["mike@hookaidashboard.com", "michaelttvance@gmail.com", "michaelthomasvance@gmail.com"].includes(
      (data.user.email ?? "").toLowerCase(),
    );
    if (!isSuperAdmin) {
      const companies = profile?.companies as
        | { trial_ends_at?: string }
        | { trial_ends_at?: string }[]
        | null;
      const companyRow = Array.isArray(companies) ? companies[0] : companies;
      const trialEndsAt = companyRow?.trial_ends_at ? new Date(companyRow.trial_ends_at) : null;
      if (trialEndsAt && trialEndsAt.getTime() < Date.now() && location.pathname !== "/trial-expired") {
        throw redirect({ to: "/trial-expired" });
      }
    }
  },
  component: AuthenticatedLayout,
});


function AuthenticatedLayout() {
  return (
    <AuthProvider>
      <DispatchProvider>
        <AppShell />
      </DispatchProvider>
    </AuthProvider>
  );
}

const NAV_ADMIN = [
  { to: "/dashboard", label: "Dispatch", icon: LayoutDashboard },
  { to: "/owner", label: "Owner", icon: Crown },
  { to: "/impound", label: "Impound Lot", icon: Warehouse },
  { to: "/billing", label: "Billing", icon: Receipt },
  { to: "/insights", label: "Insights", icon: BarChart3 },
  { to: "/rotations", label: "Rotations", icon: ShieldCheck },
  { to: "/motor-clubs", label: "Motor Clubs", icon: Building2 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

const NAV_DISPATCHER = [
  { to: "/dashboard", label: "Dispatch", icon: LayoutDashboard },
  { to: "/impound", label: "Impound Lot", icon: Warehouse },
  { to: "/rotations", label: "Rotations", icon: ShieldCheck },
  { to: "/motor-clubs", label: "Motor Clubs", icon: Building2 },
] as const;

const NAV_DRIVER = [{ to: "/driver", label: "My Job", icon: Smartphone }] as const;

const ADMIN_EMAILS = ["mike@hookaidashboard.com", "michaelttvance@gmail.com", "michaelthomasvance@gmail.com"];

function AppShell() {
  const [aiOpen, setAiOpen] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { jobs, drivers } = useDispatch();
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  // Close mobile nav on route change
  useEffect(() => { setNavOpen(false); }, [pathname]);

  const isDriver = profile.role === "driver";
  const isClientAdmin = profile.role === "admin";
  const isHookedAdmin = ADMIN_EMAILS.includes((user?.email ?? "").toLowerCase());
  const nav = isDriver ? NAV_DRIVER : isClientAdmin ? NAV_ADMIN : NAV_DISPATCHER;

  const stalled = jobs.filter(
    (j) => j.status === "Unassigned" && Date.now() - j.receivedAt > 5 * 60_000,
  ).length;

  // Drivers shouldn't see dispatcher pages — bounce them
  useEffect(() => {
    if (isDriver && pathname !== "/driver") navigate({ to: "/driver", replace: true });
  }, [isDriver, pathname, navigate]);

  useEffect(() => {
    if (!profile.role || isDriver || isClientAdmin) return;
    const adminOnlyPaths = ["/billing", "/insights", "/settings"];
    if (adminOnlyPaths.some((path) => pathname.startsWith(path))) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [isClientAdmin, isDriver, navigate, pathname, profile.role]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  // Empty-state onboarding only for dispatchers with no drivers yet
  if (!isDriver && drivers.length === 0) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
        <Onboarding />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Mobile backdrop */}
      {navOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface transition-transform md:static md:w-60 md:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Truck className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold tracking-tight">{profile.companyName ?? "Hooked"}</div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>{isDriver ? "Driver" : isClientAdmin ? "Admin" : "Dispatcher"}</span>
              {!isDriver && <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />}
              {!isDriver && <span>Operations Workspace</span>}
            </div>
          </div>
          <button
            onClick={() => setNavOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3">
          {!isDriver && (
            <div className="mb-4 rounded-xl border border-border bg-background/50 px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Today</div>
              <div className="mt-1 text-lg font-semibold tracking-tight">{jobs.length} active jobs</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {drivers.filter((d) => d.status === "Available").length} drivers ready · {stalled} jobs need attention
              </div>
            </div>
          )}
          {nav.map((item) => {
            const active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          {isClientAdmin && (
            <button
              onClick={() => setInviteOpen(true)}
              className="mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <UserPlus className="h-4 w-4" />
              Invite teammate
            </button>
          )}
          {!isDriver && <ShareRequestLink companyId={profile.companyId} />}
          {!isDriver && isHookedAdmin && (
            <div className="mt-4 border-t border-border pt-4">
              <div className="mb-1 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Hooked Staff
              </div>
              <Link
                to="/founder"
                className={cn(
                  "mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  pathname.startsWith("/founder")
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Rocket className="h-4 w-4" />
                Founder Command Center
              </Link>
            </div>
          )}
        </nav>
        <div className="space-y-2 p-3">
          <TrialBanner trialEndsAt={profile.trialEndsAt} />
          {!isDriver && (
            <div className="hidden rounded-md border border-border bg-background/40 p-3 md:block">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                AI operations assist
              </div>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                Prioritizing jobs, suggesting drivers, and flagging anything that needs attention.
              </p>
            </div>
          )}
          <div className="rounded-md border border-border bg-background/40 p-3">
            <div className="flex items-center gap-2 text-[11px]">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <span className="truncate font-mono text-muted-foreground">{user?.email}</span>
            </div>
            <button
              onClick={signOut}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-2 border-b border-border bg-surface/70 px-3 backdrop-blur sm:px-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              onClick={() => setNavOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Hooked workspace
              </div>
              <div className="truncate font-semibold tracking-tight">
              {pathname.startsWith("/dashboard") ? "Dispatch Board"
                : pathname.startsWith("/driver") ? "Driver App"
                : pathname.startsWith("/impound") ? "Impound Lot"
                : pathname.startsWith("/rotations") ? "Police Rotations"
                : pathname.startsWith("/motor-clubs") ? "Motor Clubs"
                : pathname.startsWith("/billing") ? "Billing & Invoicing"
                : pathname.startsWith("/insights") ? "Insights"
                : pathname.startsWith("/settings") ? "Settings"
                : "Jobs & Billing"}
              </div>
            </div>
            <span className="hidden rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-success sm:inline">
              Live
            </span>
            {!isDriver && (
              <span className="hidden rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline">
                {drivers.filter((d) => d.status === "Available").length} drivers ready
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="relative flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              {stalled > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-urgent px-1 text-[10px] font-bold text-urgent-foreground">
                  {stalled}
                </span>
              )}
            </button>
            {!isDriver && (
              <button
                onClick={() => setAiOpen((v) => !v)}
                className="hidden h-8 items-center gap-2 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground hover:text-foreground lg:flex"
              >
                {aiOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                AI Assistant
              </button>
            )}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>

      {!isDriver && aiOpen && (
        <aside className="hidden w-[340px] shrink-0 border-l border-border bg-surface lg:flex">
          <AiAssistant />
        </aside>
      )}

      {inviteOpen && <InviteDialog onClose={() => setInviteOpen(false)} />}
      <SupportWidget userEmail={user?.email} />
    </div>
  );
}

function TrialBanner({ trialEndsAt }: { trialEndsAt: string | null }) {
  if (!trialEndsAt) return null;
  const msLeft = new Date(trialEndsAt).getTime() - Date.now();
  const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
  if (daysLeft > 30) return null;

  return (
    <div className="rounded-md border border-primary/30 bg-primary/10 p-3">
      <div className="text-xs font-semibold text-primary">
        {daysLeft > 0
          ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in free trial`
          : "Your free trial has ended"}
      </div>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
        {daysLeft > 0
          ? "Enjoying Hooked? Reach out anytime to discuss plans."
          : "Contact us to keep using Hooked."}
      </p>
      <a
        href="mailto:mike@hookaidashboard.com"
        className="mt-2 inline-block text-[11px] font-semibold text-primary hover:underline"
      >
        mike@hookaidashboard.com
      </a>
    </div>
  );
}

function ShareRequestLink({ companyId }: { companyId: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!companyId) return null;
  const url =
    (typeof window !== "undefined" ? window.location.origin : "") + `/request/${companyId}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link", url);
    }
  }
  return (
    <button
      onClick={copy}
      title={url}
      className="mb-1 flex w-full items-center gap-3 rounded-md border border-border bg-background/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground"
    >
      {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
      {copied ? "Request link copied" : "Copy customer request link"}
    </button>
  );
}
