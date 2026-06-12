import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  FileText,
  DollarSign,
  TrendingUp,
  Loader2,
  Download,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ExternalLink,
  Mail,
  Settings as SettingsIcon,
  Users,
  BarChart3,
} from "lucide-react";
import {
  listInvoices,
  listAccounts,
  upsertAccount,
  deleteAccount,
  markInvoicePaid,
  markInvoiceSent,
  setInvoiceAccount,
  toggleInvoiceTax,
  revenueReport,
  exportQuickbooksCsv,
  getBillingSettings,
  updateBillingSettings,
  emailStatement,
} from "@/lib/billing.functions";
import { cn } from "@/lib/utils";
import { safePublicError } from "@/lib/public-errors";

const billingHead = () => ({
  meta: [
    { title: "Billing & Accounting — Hooked" },
    {
      name: "description",
      content:
        "Invoices, customer accounts, statements, QuickBooks export, and revenue reports.",
    },
  ],
});

export const Route = createFileRoute("/_authenticated/billing")({
  head: billingHead,
  component: BillingPage,
});

type Tab = "invoices" | "accounts" | "reports" | "settings";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "accounts", label: "Accounts", icon: Users },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

function BillingPage() {
  const [tab, setTab] = useState<Tab>("invoices");

  return (
    <div className="h-full overflow-auto">
      <div className="border-b border-border bg-surface/60 px-5 pt-4">
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5">
        {tab === "invoices" && <InvoicesTab />}
        {tab === "accounts" && <AccountsTab />}
        {tab === "reports" && <ReportsTab />}
        {tab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}

// ──────────────────────────── Invoices Tab ────────────────────────────

type InvoiceRow = {
  id: string;
  completed_at: string;
  customer_name: string;
  driver_name: string | null;
  job_type: string;
  duration_minutes: number;
  response_minutes: number;
  price: number;
  tax_enabled: boolean;
  tax_amount: number;
  payment_status: "paid" | "invoiced" | "pending";
  payment_method: string | null;
  paid_at: string | null;
  invoice_number: string | null;
  account_id: string | null;
  customer_accounts: { name: string } | null;
};

type AccountRow = {
  id: string;
  company_id: string;
  name: string;
  type: "body_shop" | "dealership" | "police" | "motor_club" | "fleet" | "other";
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  net_terms_days: number;
  credit_limit: number;
  custom_pricing: Record<string, number>;
  notes: string | null;
  active: boolean;
  created_at: string;
};

const TYPE_LABEL: Record<AccountRow["type"], string> = {
  body_shop: "Body Shop",
  dealership: "Dealership",
  police: "Police / PD",
  motor_club: "Motor Club",
  fleet: "Fleet",
  other: "Other",
};

function InvoicesTab() {
  const list = useServerFn(listInvoices);
  const listAcc = useServerFn(listAccounts);
  const markPaid = useServerFn(markInvoicePaid);
  const markSent = useServerFn(markInvoiceSent);
  const setAcc = useServerFn(setInvoiceAccount);
  const toggleTax = useServerFn(toggleInvoiceTax);
  const exportCsv = useServerFn(exportQuickbooksCsv);
  const qc = useQueryClient();

  const [filter, setFilter] = useState<"all" | "paid" | "invoiced" | "pending">("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [payTarget, setPayTarget] = useState<InvoiceRow | null>(null);

  const invoices = useQuery({
    queryKey: ["invoices", filter, accountFilter, query],
    queryFn: () =>
      list({
        data: {
          status: filter,
          accountId: accountFilter === "all" ? null : accountFilter,
          query: query || undefined,
        },
      }),
  });

  const accounts = useQuery({
    queryKey: ["accounts"],
    queryFn: () => listAcc(),
  });

  const mPaid = useMutation({
    mutationFn: (v: { id: string; method: "cash" | "card" | "check" | "motor_club" }) =>
      markPaid({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
  const mSent = useMutation({
    mutationFn: (id: string) => markSent({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
  const mAcc = useMutation({
    mutationFn: (v: { id: string; accountId: string | null }) => setAcc({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
  const mTax = useMutation({
    mutationFn: (v: { id: string; enabled: boolean }) => toggleTax({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const rows = (invoices.data?.invoices ?? []) as InvoiceRow[];
  const accList = (accounts.data?.accounts ?? []) as AccountRow[];

  const totals = useMemo(() => {
    let revenue = 0;
    let paid = 0;
    let tax = 0;
    for (const r of rows) {
      revenue += Number(r.price);
      tax += Number(r.tax_amount);
      if (r.payment_status === "paid") paid += Number(r.price) + Number(r.tax_amount);
    }
    return {
      revenue,
      tax,
      paid,
      outstanding: revenue + tax - paid,
    };
  }, [rows]);

  async function handleExport() {
    const to = new Date().toISOString();
    const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const res = await exportCsv({ data: { from, to } });
    const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hookai-quickbooks-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={DollarSign} label="Subtotal" value={fmt(totals.revenue)} tone="primary" />
        <Stat icon={TrendingUp} label="Paid" value={fmt(totals.paid)} tone="success" />
        <Stat icon={FileText} label="Outstanding" value={fmt(totals.outstanding)} tone="warning" />
        <Stat icon={DollarSign} label="Sales tax" value={fmt(totals.tax)} />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customer, driver, invoice #…"
          className="h-8 w-64 rounded-md border border-border bg-background px-3 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <div className="flex rounded-md border border-border p-0.5">
          {(["all", "pending", "invoiced", "paid"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-sm px-2.5 py-1 text-[11px] font-medium capitalize transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs"
        >
          <option value="all">All accounts</option>
          {accList.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <div className="ml-auto">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary"
          >
            <Download className="h-3.5 w-3.5" /> Export QuickBooks CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-3 font-medium">Date</th>
              <th className="px-3 py-3 font-medium">Invoice #</th>
              <th className="px-3 py-3 font-medium">Customer</th>
              <th className="px-3 py-3 font-medium">Account</th>
              <th className="px-3 py-3 font-medium">Type</th>
              <th className="px-3 py-3 text-right font-medium">Subtotal</th>
              <th className="px-3 py-3 text-center font-medium">Tax</th>
              <th className="px-3 py-3 text-right font-medium">Total</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.isLoading && (
              <tr>
                <td colSpan={10} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}
            {!invoices.isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-12 text-center text-sm text-muted-foreground">
                  No invoices in this view.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const total = Number(r.price) + Number(r.tax_amount);
              return (
                <tr key={r.id} className="border-b border-border/50 hover:bg-background/40">
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                    {r.completed_at.slice(0, 10)}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{r.invoice_number ?? "—"}</td>
                  <td className="px-3 py-3 font-medium">{r.customer_name}</td>
                  <td className="px-3 py-3">
                    <select
                      value={r.account_id ?? ""}
                      onChange={(e) =>
                        mAcc.mutate({ id: r.id, accountId: e.target.value || null })
                      }
                      className="w-32 rounded border border-border bg-background px-1 py-0.5 text-xs"
                    >
                      <option value="">— Walk-in —</option>
                      {accList.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
                      {r.job_type}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono">{fmt(Number(r.price))}</td>
                  <td className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={r.tax_enabled}
                      onChange={(e) => mTax.mutate({ id: r.id, enabled: e.target.checked })}
                      className="h-3.5 w-3.5 accent-primary"
                      title="Apply sales tax"
                    />
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold">{fmt(total)}</td>
                  <td className="px-3 py-3">
                    <StatusPill status={r.payment_status} />
                    {r.payment_method && (
                      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {r.payment_method.replace("_", " ")}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {r.payment_status === "pending" && (
                        <button
                          onClick={() => mSent.mutate(r.id)}
                          className="rounded border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
                        >
                          Invoice
                        </button>
                      )}
                      {r.payment_status !== "paid" && (
                        <button
                          onClick={() => setPayTarget(r)}
                          className="rounded bg-success px-2 py-1 text-[11px] font-semibold text-success-foreground hover:opacity-90"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {payTarget && (
        <PaymentModal
          invoice={payTarget}
          onClose={() => setPayTarget(null)}
          onConfirm={async (method) => {
            await mPaid.mutateAsync({ id: payTarget.id, method });
            setPayTarget(null);
          }}
        />
      )}
    </>
  );
}

function PaymentModal({
  invoice,
  onClose,
  onConfirm,
}: {
  invoice: InvoiceRow;
  onClose: () => void;
  onConfirm: (method: "cash" | "card" | "check" | "motor_club") => void;
}) {
  const [method, setMethod] = useState<"cash" | "card" | "check" | "motor_club">("card");
  const total = Number(invoice.price) + Number(invoice.tax_amount);
  return (
    <Modal title={`Mark paid — ${fmt(total)}`} onClose={onClose}>
      <p className="mb-4 text-sm text-muted-foreground">
        {invoice.customer_name} · {invoice.job_type} ·{" "}
        {invoice.completed_at.slice(0, 10)}
      </p>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {(["cash", "card", "check", "motor_club"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={cn(
              "rounded-md border px-3 py-2 text-xs font-medium capitalize",
              method === m
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {m.replace("_", " ")}
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(method)}
          className="inline-flex items-center gap-1.5 rounded-md bg-success px-4 py-2 text-sm font-semibold text-success-foreground hover:opacity-90"
        >
          <Check className="h-4 w-4" /> Confirm
        </button>
      </div>
    </Modal>
  );
}

// ──────────────────────────── Accounts Tab ────────────────────────────

function AccountsTab() {
  const list = useServerFn(listAccounts);
  const upsert = useServerFn(upsertAccount);
  const del = useServerFn(deleteAccount);
  const email = useServerFn(emailStatement);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<AccountRow> | null>(null);
  const [statementFor, setStatementFor] = useState<AccountRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => list(),
  });
  const accs = (data?.accounts ?? []) as AccountRow[];

  const mSave = useMutation({
    mutationFn: (v: Partial<AccountRow>) => upsert({ data: v as never }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      setEditing(null);
    },
  });
  const mDel = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
  const mEmail = useMutation({
    mutationFn: (v: { accountId: string; month: string; to: string }) =>
      email({ data: v }),
  });

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Customer Accounts</h2>
        <button
          onClick={() =>
            setEditing({
              name: "",
              type: "body_shop",
              net_terms_days: 30,
              credit_limit: 0,
              active: true,
            })
          }
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> New account
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {!isLoading && accs.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          No accounts yet. Add body shops, dealerships, PDs, or motor clubs to assign
          invoices to them.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {accs.map((a) => (
          <div
            key={a.id}
            className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-semibold">{a.name}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {TYPE_LABEL[a.type]} · Net {a.net_terms_days}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditing(a)}
                  className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete account "${a.name}"?`)) mDel.mutate(a.id);
                  }}
                  className="rounded p-1 text-muted-foreground hover:bg-urgent/15 hover:text-urgent"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              {a.contact_name && <div>{a.contact_name}</div>}
              {a.email && <div className="truncate">{a.email}</div>}
              {a.phone && <div>{a.phone}</div>}
              {a.credit_limit > 0 && (
                <div>Credit limit: {fmt(Number(a.credit_limit))}</div>
              )}
            </div>
            <button
              onClick={() => setStatementFor(a)}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary"
            >
              <FileText className="h-3.5 w-3.5" /> Statement
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <AccountForm
          initial={editing}
          saving={mSave.isPending}
          onClose={() => setEditing(null)}
          onSave={(v) => mSave.mutate(v)}
        />
      )}

      {statementFor && (
        <StatementModal
          account={statementFor}
          onClose={() => setStatementFor(null)}
          onEmail={(month, to) =>
            mEmail.mutate({ accountId: statementFor.id, month, to })
          }
          emailing={mEmail.isPending}
          emailResult={mEmail.data}
        />
      )}
    </>
  );
}

function AccountForm({
  initial,
  saving,
  onClose,
  onSave,
}: {
  initial: Partial<AccountRow>;
  saving: boolean;
  onClose: () => void;
  onSave: (v: Partial<AccountRow>) => void;
}) {
  const [v, setV] = useState<Partial<AccountRow>>(initial);
  function patch<K extends keyof AccountRow>(k: K, val: AccountRow[K]) {
    setV((prev) => ({ ...prev, [k]: val }));
  }
  return (
    <Modal title={initial.id ? "Edit account" : "New account"} onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name *">
          <input
            value={v.name ?? ""}
            onChange={(e) => patch("name", e.target.value)}
            className="input-base"
          />
        </Field>
        <Field label="Type">
          <select
            value={v.type ?? "body_shop"}
            onChange={(e) => patch("type", e.target.value as AccountRow["type"])}
            className="input-base"
          >
            {(Object.keys(TYPE_LABEL) as AccountRow["type"][]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Contact name">
          <input
            value={v.contact_name ?? ""}
            onChange={(e) => patch("contact_name", e.target.value)}
            className="input-base"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={v.email ?? ""}
            onChange={(e) => patch("email", e.target.value)}
            className="input-base"
          />
        </Field>
        <Field label="Phone">
          <input
            value={v.phone ?? ""}
            onChange={(e) => patch("phone", e.target.value)}
            className="input-base"
          />
        </Field>
        <Field label="Net terms (days)">
          <select
            value={v.net_terms_days ?? 30}
            onChange={(e) => patch("net_terms_days", Number(e.target.value))}
            className="input-base"
          >
            {[0, 15, 30, 45, 60].map((n) => (
              <option key={n} value={n}>
                Net {n}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Credit limit ($)">
          <input
            type="number"
            min={0}
            value={v.credit_limit ?? 0}
            onChange={(e) => patch("credit_limit", Number(e.target.value))}
            className="input-base"
          />
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <input
            value={v.address ?? ""}
            onChange={(e) => patch("address", e.target.value)}
            className="input-base"
          />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <textarea
            rows={2}
            value={v.notes ?? ""}
            onChange={(e) => patch("notes", e.target.value)}
            className="input-base"
          />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(v)}
          disabled={saving || !v.name}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{" "}
          Save
        </button>
      </div>
    </Modal>
  );
}

function StatementModal({
  account,
  onClose,
  onEmail,
  emailing,
  emailResult,
}: {
  account: AccountRow;
  onClose: () => void;
  onEmail: (month: string, to: string) => void;
  emailing: boolean;
  emailResult: { ok: boolean; error?: string } | undefined;
}) {
  const now = new Date();
  const defaultMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);
  const [to, setTo] = useState(account.email ?? "");
  const previewUrl = `/statement/${account.id}/${month}`;
  return (
    <Modal title={`Statement — ${account.name}`} onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Month">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="input-base"
          />
        </Field>
        <Field label="Send to">
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="customer@example.com"
            className="input-base"
          />
        </Field>
      </div>
      {emailResult && (
        <div
          className={cn(
            "mt-3 rounded-md border p-2 text-xs",
            emailResult.ok
              ? "border-success/40 bg-success/10 text-success"
              : "border-urgent/40 bg-urgent/10 text-urgent",
          )}
        >
          {emailResult.ok
            ? "Statement emailed."
            : "We couldn't send that statement right now. Please try again in a few minutes."}
        </div>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:border-primary hover:text-primary"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Preview / Print
        </a>
        <button
          onClick={() => onEmail(month, to)}
          disabled={emailing || !to}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {emailing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}{" "}
          Email statement
        </button>
      </div>
    </Modal>
  );
}

// ──────────────────────────── Reports Tab ────────────────────────────

function ReportsTab() {
  const report = useServerFn(revenueReport);
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "ytd">("30d");
  const [groupBy, setGroupBy] = useState<"driver" | "job_type" | "account" | "payment_method">(
    "driver",
  );

  const { from, to } = useMemo(() => {
    const now = new Date();
    const toIso = now.toISOString();
    let from: Date;
    if (range === "7d") from = new Date(Date.now() - 7 * 86400000);
    else if (range === "30d") from = new Date(Date.now() - 30 * 86400000);
    else if (range === "90d") from = new Date(Date.now() - 90 * 86400000);
    else from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    return { from: from.toISOString(), to: toIso };
  }, [range]);

  const { data, isLoading } = useQuery({
    queryKey: ["report", from, to, groupBy],
    queryFn: () => report({ data: { from, to, groupBy } }),
  });

  const totals = data?.totals;
  const breakdown = data?.breakdown ?? [];
  const daily = data?.daily ?? [];
  const max = Math.max(1, ...daily.map((d) => d.total));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-border p-0.5">
          {(["7d", "30d", "90d", "ytd"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-sm px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider transition-colors",
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Group by
          </span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs"
          >
            <option value="driver">Driver</option>
            <option value="job_type">Job type</option>
            <option value="account">Account</option>
            <option value="payment_method">Payment method</option>
          </select>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat icon={DollarSign} label="Revenue" value={fmt(totals?.revenue ?? 0)} tone="primary" />
        <Stat icon={TrendingUp} label="Paid" value={fmt(totals?.paid ?? 0)} tone="success" />
        <Stat icon={FileText} label="Outstanding" value={fmt(totals?.outstanding ?? 0)} tone="warning" />
        <Stat icon={DollarSign} label="Tax" value={fmt(totals?.tax ?? 0)} />
        <Stat icon={DollarSign} label="Avg ticket" value={fmt(totals?.avgTicket ?? 0)} />
      </div>

      <div className="mb-4 rounded-xl border border-border bg-surface p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Daily total</div>
        <div className="mt-4 flex h-40 items-end gap-1">
          {daily.length === 0 && (
            <div className="m-auto text-sm text-muted-foreground">No data in range.</div>
          )}
          {daily.map((d) => (
            <div key={d.date} className="group flex flex-1 flex-col items-center">
              <div
                className="w-full rounded-t bg-primary/40 transition-colors group-hover:bg-primary"
                style={{ height: `${Math.max(4, (d.total / max) * 100)}%` }}
                title={`${d.date}: ${fmt(d.total)}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-3 text-sm font-semibold capitalize">
          By {groupBy.replace("_", " ")}
        </div>
        {isLoading && (
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          </div>
        )}
        {!isLoading && breakdown.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No data.</div>
        )}
        {breakdown.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2 font-medium">Bucket</th>
                <th className="px-5 py-2 text-right font-medium">Jobs</th>
                <th className="px-5 py-2 text-right font-medium">Revenue</th>
                <th className="px-5 py-2 text-right font-medium">Paid</th>
                <th className="px-5 py-2 text-right font-medium">Tax</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((b) => (
                <tr key={b.key} className="border-t border-border/50">
                  <td className="px-5 py-2 font-medium">{b.key}</td>
                  <td className="px-5 py-2 text-right font-mono text-xs">{b.jobs}</td>
                  <td className="px-5 py-2 text-right font-mono">{fmt(b.revenue)}</td>
                  <td className="px-5 py-2 text-right font-mono text-success">{fmt(b.paid)}</td>
                  <td className="px-5 py-2 text-right font-mono text-muted-foreground">
                    {fmt(b.tax)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ──────────────────────────── Settings Tab ────────────────────────────

function SettingsTab() {
  const get = useServerFn(getBillingSettings);
  const update = useServerFn(updateBillingSettings);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["billing-settings"],
    queryFn: () => get(),
  });
  const [form, setForm] = useState<{
    taxRate: number;
    taxEnabledDefault: boolean;
    invoicePrefix: string;
  } | null>(null);

  const settings = data?.settings;
  if (settings && !form) {
    setForm({
      taxRate: Number(settings.tax_rate),
      taxEnabledDefault: settings.tax_enabled_default,
      invoicePrefix: settings.invoice_prefix,
    });
  }

  const mSave = useMutation({
    mutationFn: () => update({ data: form! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["billing-settings"] }),
  });

  if (isLoading || !form) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  return (
    <div className="max-w-lg space-y-5 rounded-xl border border-border bg-surface p-5">
      <div>
        <h2 className="text-base font-semibold">Billing settings</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Defaults applied to new invoices for this company.
        </p>
      </div>

      <Field label="Sales tax rate (%)">
        <input
          type="number"
          step="0.001"
          min={0}
          max={50}
          value={form.taxRate}
          onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
          className="input-base"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.taxEnabledDefault}
          onChange={(e) =>
            setForm({ ...form, taxEnabledDefault: e.target.checked })
          }
          className="h-4 w-4 accent-primary"
        />
        Apply sales tax to new invoices by default
      </label>

      <Field label="Invoice number prefix">
        <input
          value={form.invoicePrefix}
          onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
          className="input-base"
        />
      </Field>

      {mSave.isSuccess && (
        <div className="rounded-md border border-success/40 bg-success/10 p-2 text-xs text-success">
          Saved.
        </div>
      )}
      {mSave.error && (
        <div className="rounded-md border border-urgent/40 bg-urgent/10 p-2 text-xs text-urgent">
          {safePublicError(
            "We couldn't save those billing settings right now. Please try again in a few minutes.",
            mSave.error,
            "[billing] billing settings save failed",
          )}
        </div>
      )}

      <button
        onClick={() => mSave.mutate()}
        disabled={mSave.isPending}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {mSave.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}{" "}
        Save settings
      </button>
    </div>
  );
}

// ──────────────────────────── Shared ────────────────────────────

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "primary" | "success" | "warning";
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            tone === "primary" && "text-primary",
            tone === "success" && "text-success",
            tone === "warning" && "text-warning",
          )}
        />
        {label}
      </div>
      <div className="mt-2 font-mono text-xl font-bold">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: "paid" | "invoiced" | "pending" }) {
  const cls =
    status === "paid"
      ? "bg-success/15 text-success border-success/30"
      : status === "invoiced"
        ? "bg-primary/15 text-primary border-primary/30"
        : "bg-warning/15 text-warning border-warning/30";
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        cls,
      )}
    >
      {status}
    </span>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="text-sm font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function fmt(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
