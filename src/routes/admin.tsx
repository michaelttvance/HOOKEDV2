import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listPendingSignups, setApprovalStatus } from "@/lib/approval.functions";
import {
  listApplications,
  approveAndInviteApplication,
} from "@/lib/applications.functions";
import {
  Truck,
  Check,
  X,
  Loader2,
  LogOut,
  Download,
  UserPlus,
  ArrowLeft,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminHead = () => ({
  meta: [
    { title: "Admin — Hooked" },
    { name: "robots", content: "noindex" },
  ],
});

const adminBeforeLoad = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw redirect({ to: "/auth", search: { redirect: "/admin" } });
  }
  const adminEmails = ["mike@hookaidashboard.com", "michaelttvance@gmail.com"];
  if (!adminEmails.includes((data.user.email ?? "").toLowerCase())) {
    throw redirect({ to: "/dashboard" });
  }
};

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: adminHead,
  beforeLoad: adminBeforeLoad,
  component: AdminPage,
});

type Tab = "signups" | "applications";

function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("signups");

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface px-4 py-3 shadow-sm sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">Hooked Admin</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Internal approvals
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/founder"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Rocket className="h-3.5 w-3.5" /> Founder
            </Link>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
          This page is for Hooked staff only. Client admins don't approve anyone here — they
          invite their own drivers and dispatchers directly from their dashboard.
        </div>

        <div className="mb-4 flex items-center gap-2 border-b border-border">
          {([
            { id: "signups", label: "Pending Signups" },
            { id: "applications", label: "Applications" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
                tab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "signups" ? <SignupsTab /> : <ApplicationsTab />}
      </main>
    </div>
  );
}

function SignupsTab() {
  const list = useServerFn(listPendingSignups);
  const setStatus = useServerFn(setApprovalStatus);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "signups"],
    queryFn: () => list(),
  });

  const m = useMutation({
    mutationFn: (vars: { profileId: string; action: "approve" | "reject" }) =>
      setStatus({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "signups"] }),
  });

  const profiles = (data?.profiles ?? []).filter((p) =>
    filter === "pending" ? p.status === "pending" : true,
  );

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        {(["pending", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-medium capitalize",
              filter === f
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border bg-surface text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}
      {error && (
        <div className="rounded-md border border-urgent/20 bg-urgent/10 p-3 text-sm text-urgent">
          {(error as Error).message}
        </div>
      )}

      {!isLoading && profiles.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground shadow-sm">
          {filter === "pending" ? "No pending signups — all caught up." : "No signups yet."}
        </div>
      )}

      <div className="space-y-2">
        {profiles.map((p) => (
          <div
            key={p.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{p.fullName ?? "—"}</span>
                <StatusBadge status={p.status} />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {p.companyName ?? "—"} · {p.email ?? "—"} · {p.phone ?? "no phone"}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                Signed up {new Date(p.createdAt).toLocaleString()}
              </div>
            </div>
            {p.status === "pending" && (
              <div className="flex gap-2">
                <button
                  disabled={m.isPending}
                  onClick={() => m.mutate({ profileId: p.id, action: "approve" })}
                  className="inline-flex items-center gap-1.5 rounded-md bg-success px-3 py-2 text-xs font-semibold text-success-foreground hover:bg-success/90 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button
                  disabled={m.isPending}
                  onClick={() => m.mutate({ profileId: p.id, action: "reject" })}
                  className="inline-flex items-center gap-1.5 rounded-md bg-urgent px-3 py-2 text-xs font-semibold text-urgent-foreground hover:bg-urgent/90 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

type Application = {
  id: string;
  created_at: string;
  full_name: string;
  business_name: string;
  email: string;
  phone: string;
  city_state: string;
  truck_count: string;
  current_software: string;
  software_complaints: string | null;
  heard_from: string;
  biggest_challenge: string | null;
  billing_preference: string;
  status: string;
  invited_at: string | null;
};

function ApplicationsTab() {
  const list = useServerFn(listApplications);
  const invite = useServerFn(approveAndInviteApplication);
  const qc = useQueryClient();
  const [truckFilter, setTruckFilter] = useState<string>("all");
  const [softwareFilter, setSoftwareFilter] = useState<string>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: () => list(),
  });

  const m = useMutation({
    mutationFn: (applicationId: string) => invite({ data: { applicationId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "applications"] }),
  });

  const apps = (data?.applications ?? []) as Application[];
  const filtered = useMemo(
    () =>
      apps.filter(
        (a) =>
          (truckFilter === "all" || a.truck_count === truckFilter) &&
          (softwareFilter === "all" || a.current_software === softwareFilter),
      ),
    [apps, truckFilter, softwareFilter],
  );

  function exportCsv() {
    const headers = [
      "Date",
      "Name",
      "Business",
      "Email",
      "Phone",
      "City/State",
      "Trucks",
      "Current Software",
      "Software Complaints",
      "Heard From",
      "Biggest Challenge",
      "Billing",
      "Status",
    ];
    const rows = filtered.map((a) => [
      new Date(a.created_at).toISOString(),
      a.full_name,
      a.business_name,
      a.email,
      a.phone,
      a.city_state,
      a.truck_count,
      a.current_software,
      a.software_complaints ?? "",
      a.heard_from,
      a.biggest_challenge ?? "",
      a.billing_preference,
      a.status,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hookai-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const trucks = ["all", "1-2", "3-5", "6-10", "10+"];
  const softwares = [
    "all",
    "No",
    "Yes — Dispatch software",
    "Yes — Other",
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Trucks
          </span>
          <select
            value={truckFilter}
            onChange={(e) => setTruckFilter(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-foreground"
          >
            {trucks.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All" : t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Software
          </span>
          <select
            value={softwareFilter}
            onChange={(e) => setSoftwareFilter(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-foreground"
          >
            {softwares.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All" : s}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {apps.length}
          </span>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}
      {error && (
        <div className="rounded-md border border-urgent/20 bg-urgent/10 p-3 text-sm text-urgent">
          {(error as Error).message}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground shadow-sm">
          No applications.
        </div>
      )}

      {filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-accent text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Trucks</th>
                <th className="px-4 py-3">Software</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.full_name}</div>
                    <div className="text-xs text-muted-foreground">{a.email}</div>
                    <div className="text-xs text-muted-foreground">{a.phone}</div>
                  </td>
                  <td className="px-4 py-3 font-medium">{a.business_name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {a.city_state}
                  </td>
                  <td className="px-4 py-3">{a.truck_count}</td>
                  <td className="px-4 py-3 text-xs">{a.current_software}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        a.status === "invited"
                          ? "bg-success/15 text-success"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {a.status === "invited" ? (
                      <span className="text-[11px] text-muted-foreground">
                        Invited{" "}
                        {a.invited_at
                          ? new Date(a.invited_at).toLocaleDateString()
                          : ""}
                      </span>
                    ) : (
                      <button
                        disabled={m.isPending}
                        onClick={() => m.mutate(a.id)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        <UserPlus className="h-3.5 w-3.5" /> Approve & Invite
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {m.isSuccess && (
        <div className="mt-3 rounded-md border border-emerald-200 bg-success/10 p-3 text-sm text-success">
          ✓ Approved — invite created and the applicant's account-setup link is on its way.
        </div>
      )}
      {m.error && (
        <div className="mt-3 rounded-md border border-urgent/20 bg-urgent/10 p-3 text-sm text-urgent">
          {(m.error as Error).message}
        </div>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const cls =
    status === "approved"
      ? "bg-success/15 text-success"
      : status === "rejected"
        ? "bg-urgent/15 text-urgent"
        : "bg-primary/10 text-primary";
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        cls,
      )}
    >
      {status}
    </span>
  );
}
