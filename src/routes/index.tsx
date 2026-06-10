import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Truck,
  Sparkles,
  MapPin,
  Receipt,
  ShieldCheck,
  Smartphone,
  Building2,
  Warehouse,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hooked — AI Tow Dispatch & Towing Software" },
      {
        name: "description",
        content:
          "Hooked is modern dispatch software for tow operators — AI-powered driver matching, live GPS tracking, motor club integrations, impound management, and billing in one platform. The TowBook alternative built for 2026.",
      },
      { property: "og:title", content: "Hooked — AI Tow Dispatch & Towing Software" },
      {
        property: "og:description",
        content:
          "Run your towing company on one modern platform: dispatch, driver app, billing, impound, and AI assistance.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hookaidashboard.com/" },
    ],
  }),
  component: MarketingPage,
});

function MarketingPage() {
  const [authed, setAuthed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  const homeLink = authed ? "/dashboard" : "/auth";

  return (
    <div className="min-h-screen w-full bg-[#0B1220] font-sans text-slate-200">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(#FACC15 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[#FACC15]/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0B1220]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FACC15] shadow-[0_0_20px_rgba(250,204,21,0.3)]">
              <Truck className="h-4.5 w-4.5 text-black" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Hooked</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-white">How it works</a>
            <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
            <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to={authed ? "/dashboard" : "/auth"}
              className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              {authed ? "Dashboard" : "Sign in"}
            </Link>
            <Link
              to="/apply"
              className="rounded-xl bg-[#FACC15] px-4 py-2 text-sm font-bold text-black shadow-[0_4px_14px_0_rgba(250,204,21,0.25)] transition-all hover:bg-[#EAB308] active:scale-[0.98]"
            >
              Get started
            </Link>
          </div>

          <button
            onClick={() => setNavOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-slate-300 md:hidden"
            aria-label="Toggle menu"
          >
            {navOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {navOpen && (
          <div className="border-t border-white/5 px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-4 text-sm font-medium text-slate-300">
              <a href="#features" onClick={() => setNavOpen(false)}>Features</a>
              <a href="#how-it-works" onClick={() => setNavOpen(false)}>How it works</a>
              <a href="#pricing" onClick={() => setNavOpen(false)}>Pricing</a>
              <a href="#faq" onClick={() => setNavOpen(false)}>FAQ</a>
              <Link to={homeLink} onClick={() => setNavOpen(false)}>
                {authed ? "Dashboard" : "Sign in"}
              </Link>
              <Link
                to="/apply"
                onClick={() => setNavOpen(false)}
                className="rounded-xl bg-[#FACC15] px-4 py-2 text-center font-bold text-black"
              >
                Get started
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pb-24 sm:pt-24">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-[#FACC15]">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered dispatch for tow operators
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
            Dispatch smarter.
            <br />
            <span className="text-[#FACC15]">Tow faster.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
            Hooked is the modern dispatch board, driver app, and billing platform built for
            towing & recovery companies — with an AI assistant that matches drivers,
            tracks SLAs, and keeps your office running itself.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/apply"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FACC15] px-6 py-3.5 text-sm font-bold text-black shadow-[0_4px_14px_0_rgba(250,204,21,0.25)] transition-all hover:bg-[#EAB308] active:scale-[0.98] sm:w-auto"
            >
              Apply for early access
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to={homeLink}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/30 hover:bg-white/10 sm:w-auto"
            >
              {authed ? "Go to dashboard" : "Sign in"}
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            No credit card required to apply · Onboarding in under a day
          </p>
        </section>

        {/* Stat strip */}
        <section className="border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 text-center sm:grid-cols-4 sm:px-6">
            {[
              { value: "5 min", label: "Avg. dispatch time" },
              { value: "24/7", label: "AI on duty" },
              { value: "100%", label: "Cloud-based" },
              { value: "1 platform", label: "Dispatch + billing + impound" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-extrabold text-white sm:text-3xl">{s.value}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Everything your dispatch office needs
            </h2>
            <p className="mt-4 text-slate-400">
              Replace spreadsheets, paper logs, and clunky legacy software with one
              connected system built for how modern tow companies actually work.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Sparkles}
              title="AI Dispatch Assistant"
              description="Auto-suggests the best driver for every job, drafts customer updates, and watches SLA timers so nothing slips through the cracks."
            />
            <FeatureCard
              icon={MapPin}
              title="Live GPS Tracking"
              description="See every truck on a live map with real-time ETAs powered by Google Maps — know exactly where your fleet is at all times."
            />
            <FeatureCard
              icon={Smartphone}
              title="Driver Mobile App"
              description="Drivers get a clean, mobile-first app for accepting jobs, navigation, photos, and status updates — no extra hardware needed."
            />
            <FeatureCard
              icon={Receipt}
              title="Billing & Invoicing"
              description="Generate invoices and statements automatically, track payments, and get paid faster — all tied directly to completed jobs."
            />
            <FeatureCard
              icon={Warehouse}
              title="Impound Lot Management"
              description="Track vehicles in your impound lot, manage release paperwork, and stay compliant with storage fee calculations."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Police Rotation Tracking"
              description="Manage your rotation schedules and law-enforcement call logs in one organized, auditable place."
            />
            <FeatureCard
              icon={Building2}
              title="Motor Club Integrations"
              description="Track motor club jobs, payouts, and performance so you always know which contracts are worth your time."
            />
            <FeatureCard
              icon={CheckCircle2}
              title="Smart Job Intake"
              description="Customers and motor clubs submit requests through a simple shareable link — jobs land directly on your board, ready to assign."
            />
            <FeatureCard
              icon={Truck}
              title="Built for Towing"
              description="Not a generic field-service tool retrofitted for towing — every workflow is designed around how recovery operators dispatch."
            />
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Up and running in three steps
              </h2>
              <p className="mt-4 text-slate-400">
                Switching from paper, texts, or another platform is easier than you think.
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Apply & get set up",
                  description:
                    "Tell us about your fleet. We'll set up your company, import your drivers, and configure your dispatch board.",
                },
                {
                  step: "02",
                  title: "Invite your team",
                  description:
                    "Add dispatchers and drivers in seconds. Drivers get the mobile app — dispatchers get the full board.",
                },
                {
                  step: "03",
                  title: "Start dispatching",
                  description:
                    "Jobs come in, the AI suggests the best driver, and your team tracks everything from pickup to invoice.",
                },
              ].map((s) => (
                <div key={s.step} className="relative rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-4xl font-extrabold text-[#FACC15]/30">{s.step}</div>
                  <h3 className="mt-3 text-lg font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex justify-center gap-1 text-[#FACC15]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <blockquote className="mt-6 text-xl font-medium text-white sm:text-2xl">
              "We switched from spreadsheets and group texts to Hooked and our dispatch
              times dropped almost immediately. The AI suggestions actually save us time."
            </blockquote>
            <p className="mt-4 text-sm text-slate-500">— Early access tow operator</p>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-slate-400">
                We're onboarding a limited number of operators during early access.
                Pricing is tailored to your fleet size — apply and we'll send you a quote.
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-md rounded-2xl border border-[#FACC15]/30 bg-white/5 p-8 text-center">
              <div className="text-sm font-semibold uppercase tracking-wider text-[#FACC15]">
                Early Access
              </div>
              <div className="mt-4 text-4xl font-extrabold text-white">Custom pricing</div>
              <p className="mt-2 text-sm text-slate-400">Based on your number of trucks</p>
              <ul className="mt-6 space-y-3 text-left text-sm text-slate-300">
                {[
                  "Unlimited dispatchers & drivers",
                  "AI dispatch assistant included",
                  "Driver mobile app",
                  "Billing, impound & rotations",
                  "Motor club tracking",
                  "Priority onboarding support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FACC15]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/apply"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FACC15] px-6 py-3.5 text-sm font-bold text-black shadow-[0_4px_14px_0_rgba(250,204,21,0.25)] transition-all hover:bg-[#EAB308] active:scale-[0.98]"
              >
                Apply for early access
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Frequently asked questions
          </h2>
          <div className="mt-10 space-y-4">
            <FaqItem
              q="How is Hooked different from TowBook?"
              a="Hooked is built from the ground up with AI assistance baked into the dispatch workflow — automatic driver matching, SLA monitoring, and smart notes parsing — alongside the dispatch board, driver app, billing, impound management, and motor club tracking you'd expect."
            />
            <FaqItem
              q="Do my drivers need special hardware?"
              a="No. Drivers use the Hooked driver app from any smartphone browser — no extra devices or installs required."
            />
            <FaqItem
              q="Can I import my existing jobs and drivers?"
              a="Yes — during onboarding we'll help you get your fleet, drivers, and active jobs set up so you can start dispatching on day one."
            />
            <FaqItem
              q="Is there a contract or long-term commitment?"
              a="We offer monthly and annual billing. Let us know your preference when you apply and we'll walk you through the options."
            />
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="rounded-3xl border border-[#FACC15]/20 bg-gradient-to-br from-[#FACC15]/10 via-white/5 to-transparent p-10 text-center sm:p-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ready to modernize your dispatch?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Join the tow operators leaving spreadsheets and outdated software behind.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/apply"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FACC15] px-6 py-3.5 text-sm font-bold text-black shadow-[0_4px_14px_0_rgba(250,204,21,0.25)] transition-all hover:bg-[#EAB308] active:scale-[0.98] sm:w-auto"
              >
                Apply for early access
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={homeLink}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/30 hover:bg-white/10 sm:w-auto"
              >
                {authed ? "Go to dashboard" : "Sign in"}
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FACC15]">
              <Truck className="h-4 w-4 text-black" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">Hooked</span>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Hooked. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <a href="#features" className="hover:text-slate-300">Features</a>
            <a href="#pricing" className="hover:text-slate-300">Pricing</a>
            <Link to="/apply" className="hover:text-slate-300">Apply</Link>
            <Link to="/auth" className="hover:text-slate-300">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-[#FACC15]/30 hover:bg-white/[0.07]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FACC15]/15 text-[#FACC15]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-white/5">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-white",
        )}
      >
        {q}
        <span className="shrink-0 text-[#FACC15]">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="px-5 pb-4 text-sm text-slate-400">{a}</p>}
    </div>
  );
}
