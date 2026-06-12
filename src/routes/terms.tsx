import { createFileRoute, Link } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import type { ReactNode } from "react";

import { PublicFooter } from "@/components/public-footer";

const termsHead = () => ({
  meta: [
    { title: "Terms of Service — Hooked" },
    {
      name: "description",
      content: "Terms for using Hooked's towing dispatch platform, trial, and public request tools.",
    },
  ],
});

export const Route = createFileRoute("/terms")({
  head: termsHead,
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface/60 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">Hooked</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Terms of Service
              </div>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
            <Link to="/demo" className="hover:text-foreground">
              Demo
            </Link>
            <Link to="/apply" className="hover:text-foreground">
              Apply
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Terms</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            These terms explain how Hooked can be used by towing operators, dispatchers, drivers,
            and customers who interact with our site and service tools.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          <Section title="Using Hooked">
            <p>
              Hooked is a software platform for managing towing operations. Customers may use the
              product for trials, demos, live dispatch workflows, customer requests, tracking, and
              related operations.
            </p>
          </Section>

          <Section title="Trial and demo access">
            <p>
              Trial or demo access may be offered at Hooked's discretion. Access is provided to help
              evaluate the product and does not guarantee ongoing service or a future contract.
            </p>
          </Section>

          <Section title="Customer responsibility">
            <p>
              Customers are responsible for their towing operations, driver oversight, job
              handling, customer communications, pricing, legal compliance, and the accuracy of the
              information they enter into the platform.
            </p>
          </Section>

          <Section title="Communications and consent">
            <p>
              By using Hooked, you confirm that you have permission to contact your users,
              customers, and team members for operational purposes. If SMS or text messaging is
              used, message and data rates may apply, and recipients should be able to opt out
              where required.
            </p>
          </Section>

          <Section title="Acceptable use">
            <p>
              You agree not to misuse the service, attempt unauthorized access, interfere with the
              platform, or submit false or unlawful information. Hooked may restrict access to
              protect the service and other users.
            </p>
          </Section>

          <Section title="Changes to service or terms">
            <p>
              Hooked may update features, pricing, availability, or these terms from time to time.
              Continued use of the service after changes means you accept the updated terms.
            </p>
          </Section>

          <Section title="Contact and support">
            <p>
              Questions about these terms can be sent to{" "}
              <a href="mailto:support@hookaidashboard.com" className="text-primary hover:underline">
                support@hookaidashboard.com
              </a>
              .
            </p>
          </Section>
        </div>
      </main>

      <PublicFooter tone="light" />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}
