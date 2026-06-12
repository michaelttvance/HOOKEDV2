import { createFileRoute, Link } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import type { ReactNode } from "react";

import { PublicFooter } from "@/components/public-footer";

const privacyHead = () => ({
  meta: [
    { title: "Privacy Policy — Hooked" },
    {
      name: "description",
      content: "How Hooked collects, uses, stores, and shares information for towing operations.",
    },
  ],
});

export const Route = createFileRoute("/privacy")({
  head: privacyHead,
  component: PrivacyPage,
});

function PrivacyPage() {
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
                Privacy Policy
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Privacy</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            This policy explains how Hooked collects and uses information when towing companies,
            drivers, and customers use our website, trial, and dispatch tools.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          <Section title="Information we may collect">
            <ul className="list-disc space-y-2 pl-5">
              <li>Business and contact details you share when you apply, sign in, or request support.</li>
              <li>Job, customer, vehicle, location, and dispatch details entered into the platform.</li>
              <li>Phone, email, and SMS-related information used for account and job communications.</li>
              <li>Usage and analytics information such as page views, feature usage, and product interactions.</li>
            </ul>
          </Section>

          <Section title="How we use information">
            <ul className="list-disc space-y-2 pl-5">
              <li>Provide, operate, and improve the Hooked service.</li>
              <li>Respond to questions, demo requests, applications, and support tickets.</li>
              <li>Send service-related messages, including account, job, and product communications.</li>
              <li>Analyze usage to improve the product and understand what features are valuable.</li>
            </ul>
          </Section>

          <Section title="Service providers and processors">
            <p>
              We may use service providers to host the app, store data, send email, power analytics,
              or deliver messaging features. Those providers only receive the information needed to
              operate the service on our behalf.
            </p>
          </Section>

          <Section title="Retention and deletion">
            <p>
              We keep information for as long as needed to provide the service, support our business
              operations, meet legal or accounting requirements, and maintain service records.
              Customers may request deletion or export of account data where supported by the service
              and applicable law.
            </p>
          </Section>

          <Section title="Customer responsibility">
            <p>
              Customers are responsible for the information they enter, for keeping account access
              secure, and for using the service in a way that complies with their own legal,
              regulatory, and business obligations.
            </p>
          </Section>

          <Section title="Contact and support">
            <p>
              Questions about privacy or data handling can be sent to{" "}
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
