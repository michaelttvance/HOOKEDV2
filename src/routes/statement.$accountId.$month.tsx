import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStatement } from "@/lib/billing.functions";

const statementHead = () => ({
  meta: [
    { title: "Statement — Hooked" },
    { name: "robots", content: "noindex" },
  ],
});

const statementBeforeLoad = async ({ location }: { location: { href: string } }) => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw redirect({ to: "/auth", search: { redirect: location.href } });
  }
};

export const Route = createFileRoute("/statement/$accountId/$month")({
  ssr: false,
  head: statementHead,
  beforeLoad: statementBeforeLoad,
  component: StatementPage,
});

function StatementPage() {
  const { accountId, month } = Route.useParams();
  const get = useServerFn(getStatement);
  const { data, isLoading, error } = useQuery({
    queryKey: ["statement", accountId, month],
    queryFn: () => get({ data: { accountId, month } }),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl p-10 text-center text-sm text-muted-foreground">
        Could not load statement.
      </div>
    );
  }

  const { account, company, opening, charges, payments, balance, lines } = data;
  const fmt = (n: number) =>
    `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-background text-foreground print:bg-white print:text-black">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 0.5in; }
        }
      `}</style>
      <div className="mx-auto max-w-3xl p-8">
        <div className="no-print mb-4 flex items-center justify-end gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </button>
        </div>

        <div className="rounded-xl border border-border bg-surface p-8 print:border-0 print:bg-white print:p-0">
          <header className="flex items-start justify-between border-b border-border pb-6">
            <div>
              <h1 className="text-2xl font-bold">{company?.name ?? "Hooked"}</h1>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                Account statement
              </p>
            </div>
            <div className="text-right text-xs">
              <div className="font-semibold">Period</div>
              <div className="font-mono text-muted-foreground">{month}</div>
            </div>
          </header>

          <section className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Bill to
              </div>
              <div className="mt-1 text-base font-semibold">{account.name}</div>
              {account.contact_name && (
                <div className="text-sm text-muted-foreground">{account.contact_name}</div>
              )}
              {account.address && (
                <div className="text-sm text-muted-foreground">{account.address}</div>
              )}
              {account.email && (
                <div className="text-sm text-muted-foreground">{account.email}</div>
              )}
              {account.phone && (
                <div className="text-sm text-muted-foreground">{account.phone}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Balance due
              </div>
              <div className="mt-1 font-mono text-3xl font-bold text-primary">{fmt(balance)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Net {account.net_terms_days} terms
              </div>
            </div>
          </section>

          <section className="mt-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Invoice #</th>
                  <th className="py-2 font-medium">Customer</th>
                  <th className="py-2 font-medium">Service</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      No activity this period.
                    </td>
                  </tr>
                )}
                {lines.map((l) => {
                  const total = Number(l.price) + Number(l.tax_amount ?? 0);
                  return (
                    <tr key={l.id} className="border-b border-border/50">
                      <td className="py-2 font-mono text-xs text-muted-foreground">
                        {(l.completed_at as string).slice(0, 10)}
                      </td>
                      <td className="py-2 font-mono text-xs">{l.invoice_number ?? "—"}</td>
                      <td className="py-2">{l.customer_name}</td>
                      <td className="py-2 text-muted-foreground">{l.job_type}</td>
                      <td className="py-2 text-right font-mono">
                        {fmt(total)}
                        {l.payment_status === "paid" && (
                          <span className="ml-1 text-[10px] uppercase tracking-wider text-success">
                            Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className="mt-6 ml-auto max-w-xs">
            <SummaryRow label="Opening balance" value={fmt(opening)} />
            <SummaryRow label="Charges" value={fmt(charges)} />
            <SummaryRow label="Payments received" value={`(${fmt(payments)})`} />
            <div className="mt-2 border-t border-border pt-2">
              <SummaryRow label="Balance due" value={fmt(balance)} bold />
            </div>
          </section>

          <footer className="mt-12 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            Thank you for your business. Questions? Reply to the statement email.
          </footer>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className={bold ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={`font-mono ${bold ? "font-bold text-primary" : ""}`}>{value}</span>
    </div>
  );
}
