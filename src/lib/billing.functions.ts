import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ──────────────────────────── Customer Accounts ────────────────────────────

const AccountInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  type: z.enum(["body_shop", "dealership", "police", "motor_club", "fleet", "other"]),
  contact_name: z.string().max(200).nullable().optional(),
  email: z.string().email().max(255).nullable().optional().or(z.literal("")),
  phone: z.string().max(40).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  net_terms_days: z.number().int().min(0).max(180),
  credit_limit: z.number().min(0).max(10_000_000),
  custom_pricing: z.record(z.string(), z.number().min(0)).optional(),
  notes: z.string().max(2000).nullable().optional(),
  active: z.boolean().optional(),
});

export const listAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("customer_accounts")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return { accounts: data ?? [] };
  });

export const upsertAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AccountInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: company } = await context.supabase
      .rpc("current_company_id")
      .single();
    if (!company) throw new Error("No company context");

    const row = {
      id: data.id,
      company_id: company as unknown as string,
      name: data.name.trim(),
      type: data.type,
      contact_name: data.contact_name || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      net_terms_days: data.net_terms_days,
      credit_limit: data.credit_limit,
      custom_pricing: data.custom_pricing ?? {},
      notes: data.notes || null,
      active: data.active ?? true,
    };

    const { data: saved, error } = await context.supabase
      .from("customer_accounts")
      .upsert(row)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { account: saved };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("customer_accounts")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ──────────────────────────── Invoices ────────────────────────────

const InvoiceFilter = z.object({
  accountId: z.string().uuid().nullable().optional(),
  status: z.enum(["all", "paid", "invoiced", "pending"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  query: z.string().max(200).optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

export const listInvoices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InvoiceFilter.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("completed_jobs")
      .select(
        "id, completed_at, customer_name, driver_name, job_type, duration_minutes, response_minutes, price, tax_enabled, tax_amount, payment_status, payment_method, paid_at, invoice_number, account_id, customer_accounts(name)",
      )
      .order("completed_at", { ascending: false })
      .limit(data.limit ?? 200);

    if (data.accountId) q = q.eq("account_id", data.accountId);
    if (data.status && data.status !== "all") q = q.eq("payment_status", data.status);
    if (data.from) q = q.gte("completed_at", data.from);
    if (data.to) q = q.lte("completed_at", data.to);
    if (data.query && data.query.trim()) {
      const like = `%${data.query.trim()}%`;
      q = q.or(`customer_name.ilike.${like},driver_name.ilike.${like},invoice_number.ilike.${like}`);
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { invoices: rows ?? [] };
  });

export const markInvoicePaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        method: z.enum(["cash", "card", "check", "motor_club"]),
        paidAt: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("completed_jobs")
      .update({
        payment_status: "paid",
        payment_method: data.method,
        paid_at: data.paidAt ?? new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markInvoiceSent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Get or allocate invoice number
    const { data: existing } = await context.supabase
      .from("completed_jobs")
      .select("invoice_number")
      .eq("id", data.id)
      .single();
    let invoiceNumber = existing?.invoice_number ?? null;
    if (!invoiceNumber) {
      const { data: num, error: numErr } = await context.supabase.rpc("next_invoice_number");
      if (numErr) throw new Error(numErr.message);
      invoiceNumber = num as unknown as string;
    }
    const { error } = await context.supabase
      .from("completed_jobs")
      .update({ payment_status: "invoiced", invoice_number: invoiceNumber })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, invoiceNumber };
  });

export const setInvoiceAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ id: z.string().uuid(), accountId: z.string().uuid().nullable() })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("completed_jobs")
      .update({ account_id: data.accountId })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleInvoiceTax = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), enabled: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    // Look up company tax rate to compute tax_amount
    const { data: job } = await context.supabase
      .from("completed_jobs")
      .select("price, company_id")
      .eq("id", data.id)
      .single();
    if (!job) throw new Error("Job not found");
    let tax = 0;
    if (data.enabled) {
      const { data: company } = await context.supabase
        .from("companies")
        .select("tax_rate")
        .eq("id", job.company_id)
        .single();
      const rate = Number(company?.tax_rate ?? 0);
      tax = Math.round(Number(job.price) * (rate / 100) * 100) / 100;
    }
    const { error } = await context.supabase
      .from("completed_jobs")
      .update({ tax_enabled: data.enabled, tax_amount: tax })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, tax };
  });

// ──────────────────────────── Billing settings ────────────────────────────

export const getBillingSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: companyId } = await context.supabase.rpc("current_company_id").single();
    if (!companyId) return { settings: null };
    const { data, error } = await context.supabase
      .from("companies")
      .select("id, name, tax_rate, tax_enabled_default, invoice_prefix")
      .eq("id", companyId as unknown as string)
      .single();
    if (error) throw new Error(error.message);
    return { settings: data };
  });

export const updateBillingSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        taxRate: z.number().min(0).max(50),
        taxEnabledDefault: z.boolean(),
        invoicePrefix: z.string().min(1).max(16),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: companyId } = await context.supabase.rpc("current_company_id").single();
    if (!companyId) throw new Error("No company context");
    const { error } = await context.supabase
      .from("companies")
      .update({
        tax_rate: data.taxRate,
        tax_enabled_default: data.taxEnabledDefault,
        invoice_prefix: data.invoicePrefix,
      })
      .eq("id", companyId as unknown as string);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ──────────────────────────── Revenue reports ────────────────────────────

const ReportInput = z.object({
  from: z.string(),
  to: z.string(),
  groupBy: z.enum(["driver", "job_type", "account", "payment_method"]),
});

export const revenueReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReportInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("completed_jobs")
      .select(
        "completed_at, price, tax_amount, payment_status, payment_method, driver_name, job_type, account_id, customer_accounts(name)",
      )
      .gte("completed_at", data.from)
      .lte("completed_at", data.to);
    if (error) throw new Error(error.message);

    type Row = (typeof rows)[number];
    const buckets = new Map<string, { key: string; revenue: number; paid: number; tax: number; jobs: number }>();
    const daily = new Map<string, number>();
    let revenue = 0;
    let paid = 0;
    let tax = 0;
    const list = (rows ?? []) as Row[];

    for (const r of list) {
      const price = Number(r.price) || 0;
      const taxAmt = Number(r.tax_amount) || 0;
      revenue += price;
      tax += taxAmt;
      if (r.payment_status === "paid") paid += price + taxAmt;

      const day = (r.completed_at as string).slice(0, 10);
      daily.set(day, (daily.get(day) ?? 0) + price + taxAmt);

      const key =
        data.groupBy === "driver"
          ? r.driver_name ?? "Unassigned"
          : data.groupBy === "job_type"
            ? (r.job_type as string)
            : data.groupBy === "account"
              ? (r.customer_accounts as { name: string } | null)?.name ?? "Walk-in"
              : (r.payment_method as string) ?? "—";
      const b = buckets.get(key) ?? { key, revenue: 0, paid: 0, tax: 0, jobs: 0 };
      b.revenue += price;
      b.tax += taxAmt;
      if (r.payment_status === "paid") b.paid += price + taxAmt;
      b.jobs += 1;
      buckets.set(key, b);
    }

    const breakdown = [...buckets.values()].sort((a, b) => b.revenue - a.revenue);
    const dailySeries = [...daily.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total: Math.round(total * 100) / 100 }));

    return {
      totals: {
        revenue: Math.round(revenue * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        paid: Math.round(paid * 100) / 100,
        outstanding: Math.round((revenue + tax - paid) * 100) / 100,
        jobs: list.length,
        avgTicket: list.length ? Math.round((revenue / list.length) * 100) / 100 : 0,
      },
      breakdown,
      daily: dailySeries,
    };
  });

// ──────────────────────────── Statements ────────────────────────────

export const getStatement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        accountId: z.string().uuid(),
        month: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const [year, mo] = data.month.split("-").map(Number);
    const from = new Date(Date.UTC(year, mo - 1, 1)).toISOString();
    const to = new Date(Date.UTC(year, mo, 1)).toISOString();

    const { data: account, error: accErr } = await context.supabase
      .from("customer_accounts")
      .select("*")
      .eq("id", data.accountId)
      .single();
    if (accErr) throw new Error(accErr.message);

    const { data: jobs, error: jErr } = await context.supabase
      .from("completed_jobs")
      .select(
        "id, completed_at, customer_name, job_type, price, tax_amount, payment_status, payment_method, paid_at, invoice_number",
      )
      .eq("account_id", data.accountId)
      .gte("completed_at", from)
      .lt("completed_at", to)
      .order("completed_at", { ascending: true });
    if (jErr) throw new Error(jErr.message);

    // Opening balance: unpaid jobs from before this month
    const { data: prior } = await context.supabase
      .from("completed_jobs")
      .select("price, tax_amount, payment_status")
      .eq("account_id", data.accountId)
      .lt("completed_at", from);

    const opening = (prior ?? []).reduce(
      (s, r) =>
        r.payment_status === "paid"
          ? s
          : s + Number(r.price) + Number(r.tax_amount ?? 0),
      0,
    );

    const list = jobs ?? [];
    const charges = list.reduce(
      (s, r) => s + Number(r.price) + Number(r.tax_amount ?? 0),
      0,
    );
    const payments = list
      .filter((r) => r.payment_status === "paid")
      .reduce((s, r) => s + Number(r.price) + Number(r.tax_amount ?? 0), 0);

    const { data: company } = await context.supabase
      .from("companies")
      .select("name")
      .eq("id", account.company_id)
      .single();

    return {
      account,
      company,
      month: data.month,
      opening: Math.round(opening * 100) / 100,
      charges: Math.round(charges * 100) / 100,
      payments: Math.round(payments * 100) / 100,
      balance: Math.round((opening + charges - payments) * 100) / 100,
      lines: list,
    };
  });

export const emailStatement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        accountId: z.string().uuid(),
        month: z.string().regex(/^\d{4}-\d{2}$/),
        to: z.string().email(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    // Re-fetch via the same RLS-safe path
    const [year, mo] = data.month.split("-").map(Number);
    const from = new Date(Date.UTC(year, mo - 1, 1)).toISOString();
    const to = new Date(Date.UTC(year, mo, 1)).toISOString();

    const { data: account } = await context.supabase
      .from("customer_accounts")
      .select("*")
      .eq("id", data.accountId)
      .single();
    if (!account) throw new Error("Account not found");

    const { data: jobs } = await context.supabase
      .from("completed_jobs")
      .select(
        "completed_at, customer_name, job_type, price, tax_amount, payment_status, invoice_number",
      )
      .eq("account_id", data.accountId)
      .gte("completed_at", from)
      .lt("completed_at", to)
      .order("completed_at", { ascending: true });

    const { data: prior } = await context.supabase
      .from("completed_jobs")
      .select("price, tax_amount, payment_status")
      .eq("account_id", data.accountId)
      .lt("completed_at", from);
    const opening = (prior ?? []).reduce(
      (s, r) =>
        r.payment_status === "paid"
          ? s
          : s + Number(r.price) + Number(r.tax_amount ?? 0),
      0,
    );

    const list = jobs ?? [];
    const charges = list.reduce(
      (s, r) => s + Number(r.price) + Number(r.tax_amount ?? 0),
      0,
    );
    const payments = list
      .filter((r) => r.payment_status === "paid")
      .reduce((s, r) => s + Number(r.price) + Number(r.tax_amount ?? 0), 0);
    const balance = opening + charges - payments;

    const { data: company } = await context.supabase
      .from("companies")
      .select("name")
      .eq("id", account.company_id)
      .single();

    const { statementEmail, sendEmail } = await import("./emails.server");
    const html = statementEmail({
      companyName: company?.name ?? "Hooked",
      accountName: account.name,
      month: data.month,
      opening,
      charges,
      payments,
      balance,
      lines: list.map((r) => ({
        date: (r.completed_at as string).slice(0, 10),
        customer: r.customer_name as string,
        jobType: r.job_type as string,
        amount: Number(r.price) + Number(r.tax_amount ?? 0),
        invoice: (r.invoice_number as string | null) ?? "—",
        paid: r.payment_status === "paid",
      })),
    });

    const subject = `Statement — ${company?.name ?? "Hooked"} — ${data.month}`;
    const result = await sendEmail({ to: data.to, subject, html });
    return result;
  });

// ──────────────────────────── QuickBooks CSV ────────────────────────────

export const exportQuickbooksCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ from: z.string(), to: z.string() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("completed_jobs")
      .select(
        "completed_at, customer_name, job_type, price, tax_amount, payment_status, payment_method, paid_at, invoice_number, customer_accounts(name)",
      )
      .gte("completed_at", data.from)
      .lte("completed_at", data.to)
      .order("completed_at", { ascending: true });
    if (error) throw new Error(error.message);

    type Row = (typeof rows)[number];
    const list = (rows ?? []) as Row[];
    const headers = [
      "InvoiceNo",
      "Customer",
      "InvoiceDate",
      "DueDate",
      "Item",
      "ItemDescription",
      "ItemQuantity",
      "ItemRate",
      "ItemAmount",
      "ItemTaxAmount",
      "Total",
      "Status",
      "PaymentMethod",
      "PaymentDate",
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

    const lines: string[] = [headers.join(",")];
    for (const r of list) {
      const date = (r.completed_at as string).slice(0, 10);
      const acc = (r.customer_accounts as { name: string } | null)?.name;
      const customer = acc ?? (r.customer_name as string);
      const subtotal = Number(r.price);
      const tax = Number(r.tax_amount ?? 0);
      lines.push(
        [
          esc(r.invoice_number ?? ""),
          esc(customer),
          esc(date),
          esc(date),
          esc(`Towing — ${r.job_type as string}`),
          esc(`${r.job_type as string} service for ${r.customer_name as string}`),
          esc(1),
          esc(subtotal),
          esc(subtotal),
          esc(tax),
          esc(subtotal + tax),
          esc(r.payment_status as string),
          esc(r.payment_method ?? ""),
          esc(r.paid_at ? (r.paid_at as string).slice(0, 10) : ""),
        ].join(","),
      );
    }
    return { csv: lines.join("\n"), count: list.length };
  });
