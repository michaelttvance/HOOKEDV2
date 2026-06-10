import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
  Clock,
  Bell,
  Navigation,
  Zap,
  Camera,
  BarChart3,
  Bot,
  Quote,
  Check,
  Minus,
  TrendingUp,
  Users,
  Timer,
  ChevronDown,
  Gauge,
  MessageSquare,
  FileText,
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

/* ------------------------------------------------------------------ */
/* Animation helpers                                                   */
/* ------------------------------------------------------------------ */

function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, ...options },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform",
        inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function useCountUp(target: number, run: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return value;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function MarketingPage() {
  const [authed, setAuthed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setScrolled(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const homeLink = authed ? "/dashboard" : "/auth";

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0B1220] font-sans text-slate-200">
      <PageStyles />

      {/* Scroll progress bar */}
      <div className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-[#FACC15] to-amber-300 transition-[width] duration-150"
          style={{ width: `${scrolled}%` }}
        />
      </div>

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(#FACC15 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
        <div className="absolute -top-48 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[#FACC15]/10 blur-[140px]" />
        <div className="absolute top-[40%] -left-40 h-[400px] w-[400px] rounded-full bg-sky-500/10 blur-[130px]" />
        <div className="absolute top-[70%] -right-40 h-[420px] w-[420px] rounded-full bg-amber-400/10 blur-[130px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0B1220]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FACC15] shadow-[0_0_20px_rgba(250,204,21,0.35)]">
              <Truck className="h-[18px] w-[18px] text-black" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Hooked</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 lg:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-white">How it works</a>
            <a href="#roi" className="transition-colors hover:text-white">ROI calculator</a>
            <a href="#compare" className="transition-colors hover:text-white">Compare</a>
            <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
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
              className="group rounded-xl bg-[#FACC15] px-4 py-2 text-sm font-bold text-black shadow-[0_4px_14px_0_rgba(250,204,21,0.25)] transition-all hover:bg-[#EAB308] hover:shadow-[0_6px_20px_0_rgba(250,204,21,0.35)] active:scale-[0.98]"
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
              <a href="#roi" onClick={() => setNavOpen(false)}>ROI calculator</a>
              <a href="#compare" onClick={() => setNavOpen(false)}>Compare</a>
              <a href="#pricing" onClick={() => setNavOpen(false)}>Pricing</a>
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
        <section className="mx-auto max-w-6xl px-4 pb-12 pt-16 text-center sm:px-6 sm:pb-16 sm:pt-24">
          <Reveal>
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-[#FACC15]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FACC15] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FACC15]" />
              </span>
              AI-powered dispatch for tow operators
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Dispatch smarter.
              <br />
              <span className="bg-gradient-to-r from-[#FACC15] via-amber-300 to-[#FACC15] bg-clip-text text-transparent">
                Tow faster.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
              Hooked is the modern dispatch board, driver app, and billing platform built for
              towing &amp; recovery companies — with an AI assistant that matches drivers,
              tracks SLAs, and keeps your office running itself.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/apply"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#FACC15] px-6 py-3.5 text-sm font-bold text-black shadow-[0_4px_14px_0_rgba(250,204,21,0.25)] transition-all hover:bg-[#EAB308] hover:shadow-[0_8px_28px_0_rgba(250,204,21,0.4)] active:scale-[0.98] sm:w-auto"
              >
                Start your free trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to={homeLink}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/30 hover:bg-white/10 sm:w-auto"
              >
                {authed ? "Go to dashboard" : "Sign in"}
              </Link>
            </div>
          </Reveal>
          <Reveal delay={300}>
            <p className="mt-4 text-xs text-slate-500">
              30-day free trial · No credit card required · Onboarding in under a day
            </p>
          </Reveal>
        </section>

        {/* Product preview — live animated */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
          <Reveal>
            <div className="relative">
              <div className="absolute -inset-x-6 -top-6 bottom-0 -z-10 rounded-[2rem] bg-gradient-to-b from-[#FACC15]/15 to-transparent blur-2xl" />
              <LiveDashboardPreview />
            </div>
          </Reveal>
        </section>

        {/* Stat strip — count up */}
        <CountUpStats />

        {/* Trust / integrations */}
        <IntegrationStrip />

        {/* Features — bento */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <SectionEyebrow>Everything in one place</SectionEyebrow>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Everything your dispatch office needs
              </h2>
              <p className="mt-4 text-slate-400">
                Replace spreadsheets, paper logs, and clunky legacy software with one
                connected system built for how modern tow companies actually work.
              </p>
            </div>
          </Reveal>
          <BentoFeatures />
        </section>

        {/* Interactive feature showcase */}
        <section className="border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <SectionEyebrow>See it in action</SectionEyebrow>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  One platform, every workflow
                </h2>
                <p className="mt-4 text-slate-400">
                  Click through the tools your team uses every shift.
                </p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <FeatureTabs />
            </Reveal>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <SectionEyebrow>Onboarding in under a day</SectionEyebrow>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Up and running in three steps
              </h2>
              <p className="mt-4 text-slate-400">
                Switching from paper, texts, or another platform is easier than you think.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                icon: Zap,
                title: "Apply & get set up",
                description:
                  "Tell us about your fleet. We'll set up your company, import your drivers, and configure your dispatch board.",
              },
              {
                step: "02",
                icon: Users,
                title: "Invite your team",
                description:
                  "Add dispatchers and drivers in seconds. Drivers get the mobile app — dispatchers get the full board.",
              },
              {
                step: "03",
                icon: Navigation,
                title: "Start dispatching",
                description:
                  "Jobs come in, the AI suggests the best driver, and your team tracks everything from pickup to invoice.",
              },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 120}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-[#FACC15]/30">
                  <div className="pointer-events-none absolute right-3 top-1 text-6xl font-extrabold text-white/[0.04] transition-colors group-hover:text-[#FACC15]/10">
                    {s.step}
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FACC15]/15 text-[#FACC15]">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{s.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ROI calculator */}
        <section id="roi" className="border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <SectionEyebrow>Built to pay for itself</SectionEyebrow>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  See what Hooked could save you
                </h2>
                <p className="mt-4 text-slate-400">
                  Drag the sliders to match your operation. These are estimates based on faster
                  dispatch and higher job-capture rates from real tow workflows.
                </p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <RoiCalculator />
            </Reveal>
          </div>
        </section>

        {/* Comparison */}
        <section id="compare" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <SectionEyebrow>Why operators switch</SectionEyebrow>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Hooked vs. the old way
              </h2>
              <p className="mt-4 text-slate-400">
                Everything legacy software bolts on as add-ons is built in from day one.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <ComparisonTable />
          </Reveal>
        </section>

        {/* Testimonials */}
        <section className="border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <Reveal>
              <div className="mx-auto mb-12 max-w-2xl text-center">
                <div className="flex justify-center gap-1 text-[#FACC15]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Operators are getting their evenings back
                </h2>
              </div>
            </Reveal>
            <div className="grid gap-5 lg:grid-cols-3">
              {[
                {
                  quote:
                    "We switched from spreadsheets and group texts to Hooked and our dispatch times dropped almost immediately. The AI suggestions actually save us time.",
                  name: "Early access operator",
                  role: "12-truck fleet · Midwest",
                },
                {
                  quote:
                    "The driver app is the first one my guys didn't complain about. Photos, status, navigation — all in one place. No more 'where are you' phone calls.",
                  name: "Dispatch lead",
                  role: "Recovery & impound · West Coast",
                },
                {
                  quote:
                    "Billing used to take me a full day a week. Now invoices generate off completed jobs automatically and I just review and send.",
                  name: "Owner / operator",
                  role: "Family-run tow company",
                },
              ].map((t, i) => (
                <Reveal key={t.name} delay={i * 120}>
                  <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6">
                    <Quote className="h-7 w-7 text-[#FACC15]/40" />
                    <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-200">
                      {t.quote}
                    </blockquote>
                    <figcaption className="mt-5 border-t border-white/5 pt-4">
                      <div className="text-sm font-semibold text-white">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.role}</div>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <SectionEyebrow>Simple, fleet-based pricing</SectionEyebrow>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Try it free for 30 days
              </h2>
              <p className="mt-4 text-slate-400">
                Start your free 30-day trial — full platform, no credit card required. After your
                trial, pricing is tailored to your fleet size.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="mx-auto mt-12 max-w-md">
              <div className="relative overflow-hidden rounded-3xl border border-[#FACC15]/30 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-8 text-center shadow-[0_0_60px_-20px_rgba(250,204,21,0.4)]">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#FACC15]/10 blur-3xl" />
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FACC15]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#FACC15]">
                  <Sparkles className="h-3.5 w-3.5" /> Free Trial
                </div>
                <div className="mt-5 text-5xl font-extrabold text-white">30 days</div>
                <p className="mt-2 text-sm text-slate-400">
                  on us — then custom pricing based on your number of trucks
                </p>
                <ul className="mt-7 space-y-3 text-left text-sm text-slate-300">
                  {[
                    "Full access to every feature, no limits",
                    "Unlimited dispatchers & drivers",
                    "AI dispatch assistant included",
                    "Driver mobile app",
                    "Billing, impound & rotations",
                    "Motor club tracking",
                    "No credit card required",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FACC15]/15">
                        <Check className="h-3 w-3 text-[#FACC15]" />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/apply"
                  className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FACC15] px-6 py-3.5 text-sm font-bold text-black shadow-[0_4px_14px_0_rgba(250,204,21,0.25)] transition-all hover:bg-[#EAB308] hover:shadow-[0_8px_28px_0_rgba(250,204,21,0.4)] active:scale-[0.98]"
                >
                  Start your free trial
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <h2 className="text-center text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Frequently asked questions
            </h2>
          </Reveal>
          <div className="mt-10 space-y-3">
            {[
              {
                q: "How is Hooked different from TowBook?",
                a: "Hooked is built from the ground up with AI assistance baked into the dispatch workflow — automatic driver matching, SLA monitoring, and smart notes parsing — alongside the dispatch board, driver app, billing, impound management, and motor club tracking you'd expect.",
              },
              {
                q: "Do my drivers need special hardware?",
                a: "No. Drivers use the Hooked driver app from any smartphone browser — no extra devices or installs required.",
              },
              {
                q: "Can I import my existing jobs and drivers?",
                a: "Yes — during onboarding we'll help you get your fleet, drivers, and active jobs set up so you can start dispatching on day one.",
              },
              {
                q: "Is there a contract or long-term commitment?",
                a: "We offer monthly and annual billing. Let us know your preference when you apply and we'll walk you through the options.",
              },
              {
                q: "What happens after my 30-day free trial?",
                a: "Nothing breaks and we never auto-charge a card. Near the end of your trial we'll reach out with pricing tailored to your fleet size so you can decide whether to continue.",
              },
            ].map((f, i) => (
              <Reveal key={f.q} delay={i * 60}>
                <FaqItem q={f.q} a={f.a} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-[#FACC15]/20 bg-gradient-to-br from-[#FACC15]/10 via-white/5 to-transparent p-10 text-center sm:p-16">
              <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-[#FACC15]/10 blur-3xl" />
              <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-sky-500/10 blur-3xl" />
              <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Ready to modernize your dispatch?
              </h2>
              <p className="relative mx-auto mt-4 max-w-xl text-slate-400">
                Join the tow operators leaving spreadsheets and outdated software behind.
              </p>
              <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/apply"
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#FACC15] px-6 py-3.5 text-sm font-bold text-black shadow-[0_4px_14px_0_rgba(250,204,21,0.25)] transition-all hover:bg-[#EAB308] hover:shadow-[0_8px_28px_0_rgba(250,204,21,0.4)] active:scale-[0.98] sm:w-auto"
                >
                  Start your free trial
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to={homeLink}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/30 hover:bg-white/10 sm:w-auto"
                >
                  {authed ? "Go to dashboard" : "Sign in"}
                </Link>
              </div>
            </div>
          </Reveal>
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

/* ------------------------------------------------------------------ */
/* Small shared bits                                                   */
/* ------------------------------------------------------------------ */

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#FACC15]">
      {children}
    </span>
  );
}

function PageStyles() {
  return (
    <style>{`
      @keyframes hk-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      @keyframes hk-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      @keyframes hk-dash { to { stroke-dashoffset: -24; } }
      .hk-float { animation: hk-float 4s ease-in-out infinite; }
      .hk-marquee { animation: hk-marquee 26s linear infinite; }
      @media (prefers-reduced-motion: reduce) {
        .hk-float, .hk-marquee { animation: none; }
      }
    `}</style>
  );
}

/* ------------------------------------------------------------------ */
/* Count-up stats                                                      */
/* ------------------------------------------------------------------ */

function CountUpStats() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const stats = [
    { target: 42, suffix: "%", label: "Faster avg. dispatch", decimals: 0 },
    { target: 30, suffix: " days", label: "Free trial, no card", decimals: 0 },
    { target: 5, prefix: "<", suffix: " min", label: "From call to assigned", decimals: 0 },
    { target: 1, suffix: " platform", label: "Dispatch · billing · impound", decimals: 0 },
  ];
  return (
    <section ref={ref} className="border-y border-white/5 bg-white/[0.02]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-12 text-center sm:grid-cols-4 sm:px-6">
        {stats.map((s, i) => (
          <StatItem key={s.label} {...s} run={inView} delay={i * 120} />
        ))}
      </div>
    </section>
  );
}

function StatItem({
  target,
  prefix = "",
  suffix = "",
  label,
  decimals = 0,
  run,
  delay,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  label: string;
  decimals?: number;
  run: boolean;
  delay: number;
}) {
  const value = useCountUp(target, run);
  return (
    <div className="transition-all duration-700" style={{ transitionDelay: `${delay}ms`, opacity: run ? 1 : 0 }}>
      <div className="text-3xl font-extrabold text-white sm:text-4xl">
        {prefix}
        {value.toFixed(decimals)}
        <span className="text-[#FACC15]">{suffix}</span>
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Integration strip                                                   */
/* ------------------------------------------------------------------ */

function IntegrationStrip() {
  const items = [
    { icon: MapPin, label: "Google Maps" },
    { icon: Smartphone, label: "Any smartphone" },
    { icon: Building2, label: "Motor clubs" },
    { icon: ShieldCheck, label: "Police rotations" },
    { icon: Receipt, label: "Invoicing" },
    { icon: MessageSquare, label: "SMS updates" },
    { icon: Warehouse, label: "Impound lots" },
    { icon: Bot, label: "AI assistant" },
  ];
  const row = [...items, ...items];
  return (
    <section className="overflow-hidden py-10">
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
        Everything connected in one system
      </p>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#0B1220] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#0B1220] to-transparent" />
        <div className="flex w-max hk-marquee gap-4">
          {row.map((it, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-300"
            >
              <it.icon className="h-4 w-4 text-[#FACC15]" />
              {it.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Bento features                                                      */
/* ------------------------------------------------------------------ */

function BentoFeatures() {
  return (
    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Large AI feature */}
      <Reveal className="sm:col-span-2 lg:row-span-2">
        <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#FACC15]/20 bg-gradient-to-br from-[#FACC15]/[0.08] to-white/[0.02] p-7">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#FACC15]/10 blur-3xl transition-opacity group-hover:opacity-80" />
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FACC15]/20 text-[#FACC15]">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-xl font-bold text-white">AI Dispatch Assistant</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-300">
            Auto-suggests the best driver for every job based on location and availability,
            drafts customer text updates, and watches SLA timers so nothing slips through the
            cracks. It's like adding a senior dispatcher who never clocks out.
          </p>
          <div className="mt-6 space-y-2">
            {[
              "Closest-available driver matching",
              "Auto-drafted customer ETA texts",
              "SLA & stalled-job alerts",
            ].map((b) => (
              <div key={b} className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FACC15]" />
                {b}
              </div>
            ))}
          </div>
          <div className="mt-auto pt-6">
            <div className="flex items-center gap-2 rounded-xl border border-[#FACC15]/30 bg-[#0B1220]/60 px-3 py-2.5 text-xs text-slate-300 backdrop-blur">
              <Bot className="h-4 w-4 shrink-0 text-[#FACC15]" />
              <span>
                <span className="font-semibold text-white">AI:</span> Sara P. (T-12) is 1.2 mi from
                the I-280 call — assign &amp; notify customer?
              </span>
            </div>
          </div>
        </div>
      </Reveal>

      {[
        { icon: MapPin, title: "Live Customer Tracking", description: "Customers get an Uber-style link to watch their driver approach in real time — fewer 'where are you?' calls." },
        { icon: Smartphone, title: "Driver Mobile App", description: "Accept jobs, navigate, capture condition photos & customer signatures from any phone." },
        { icon: Receipt, title: "Billing & Invoicing", description: "Auto-generate invoices and statements from completed jobs and get paid faster." },
        { icon: Warehouse, title: "Impound Management", description: "Track lot inventory, release paperwork, and storage-fee calculations." },
        { icon: BarChart3, title: "Business Insights", description: "Revenue trends, driver leaderboards, busiest hours, and response times at a glance." },
        { icon: Building2, title: "Motor Club Tracking", description: "Track motor club jobs, payouts, and which contracts are worth your time." },
      ].map((f, i) => (
        <Reveal key={f.title} delay={i * 80}>
          <FeatureCard {...f} />
        </Reveal>
      ))}
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
    <div className="group h-full rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:-translate-y-1 hover:border-[#FACC15]/30 hover:bg-white/[0.07]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FACC15]/15 text-[#FACC15] transition-transform group-hover:scale-110">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Interactive feature tabs                                            */
/* ------------------------------------------------------------------ */

function FeatureTabs() {
  const tabs = [
    {
      id: "dispatch",
      label: "Dispatch board",
      icon: Navigation,
      points: [
        "Drag-and-drop job assignment",
        "Color-coded priorities & SLA timers",
        "Real-time fleet status at a glance",
      ],
      panel: <DispatchPanel />,
    },
    {
      id: "driver",
      label: "Driver app",
      icon: Smartphone,
      points: [
        "Accept or decline jobs in one tap",
        "Turn-by-turn navigation built in",
        "Photo capture & status updates",
      ],
      panel: <DriverPanel />,
    },
    {
      id: "ai",
      label: "AI assistant",
      icon: Sparkles,
      points: [
        "Smart driver suggestions",
        "Drafted customer messages",
        "Watches every SLA for you",
      ],
      panel: <AiPanel />,
    },
    {
      id: "billing",
      label: "Billing",
      icon: Receipt,
      points: [
        "Invoices auto-built from jobs",
        "Account statements in one click",
        "Track payments & outstanding balances",
      ],
      panel: <BillingPanel />,
    },
  ];
  const [active, setActive] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === active)!;

  return (
    <div className="mt-12">
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all",
              active === t.id
                ? "border-[#FACC15]/40 bg-[#FACC15]/15 text-[#FACC15]"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid items-center gap-8 rounded-3xl border border-white/10 bg-[#0F1A2E] p-5 sm:p-8 lg:grid-cols-2">
        <div>
          <h3 className="text-2xl font-bold text-white">{current.label}</h3>
          <ul className="mt-5 space-y-3">
            {current.points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FACC15]/15">
                  <Check className="h-3.5 w-3.5 text-[#FACC15]" />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <Link
            to="/apply"
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#FACC15] hover:underline"
          >
            Try it free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div key={active} className="min-h-[260px] animate-[fadeIn_0.4s_ease]">
          {current.panel}
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px);} to { opacity:1; transform: translateY(0);} }`}</style>
    </div>
  );
}

function PanelShell({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B1220]">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{title}</span>
        <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function DispatchPanel() {
  const rows = [
    { c: "Amanda Reyes", t: "Tow · I-280 N", p: "Urgent", cls: "text-red-400 bg-red-400/10 border-red-400/20" },
    { c: "Devon Park", t: "Lockout · Market St", p: "Standard", cls: "text-slate-300 bg-white/5 border-white/10" },
    { c: "Nina Alvarez", t: "Tow · Mission Bay", p: "Assigned", cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  ];
  return (
    <PanelShell title="Job queue">
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.c} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">{r.c}</span>
              <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-medium", r.cls)}>{r.p}</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-500">{r.t}</div>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function DriverPanel() {
  return (
    <PanelShell title="Driver · T-12">
      <div className="mx-auto max-w-[220px] rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="text-[10px] uppercase tracking-widest text-slate-500">New job</div>
        <div className="mt-1 text-sm font-bold text-white">Tow — I-280 N, mile 42</div>
        <div className="mt-1 text-xs text-slate-400">Amanda Reyes · 1.2 mi · ~4 min</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-[#FACC15] py-2 text-center text-xs font-bold text-black">Accept</div>
          <div className="rounded-lg border border-white/10 py-2 text-center text-xs font-semibold text-slate-300">Decline</div>
        </div>
        <div className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-white/10 py-2 text-xs text-slate-300">
          <Camera className="h-3.5 w-3.5 text-[#FACC15]" /> Add scene photo
        </div>
      </div>
    </PanelShell>
  );
}

function AiPanel() {
  return (
    <PanelShell title="AI assistant">
      <div className="space-y-2.5">
        <div className="flex items-start gap-2 rounded-xl border border-[#FACC15]/30 bg-[#FACC15]/[0.06] p-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#FACC15]" />
          <p className="text-[11px] text-slate-200">
            <span className="font-semibold text-white">Suggested:</span> Assign Sara P. (T-12) — closest available unit, 1.2 mi out.
          </p>
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
          <p className="text-[11px] text-slate-300">
            Drafted text to customer: “Your Hooked driver is 4 minutes away in truck T-12.”
          </p>
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <Timer className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-[11px] text-slate-300">
            Heads up: job #4831 has been unassigned for 6 min — approaching SLA.
          </p>
        </div>
      </div>
    </PanelShell>
  );
}

function BillingPanel() {
  const lines = [
    { id: "INV-1042", c: "Amanda Reyes", amt: "$185.00", paid: true },
    { id: "INV-1043", c: "Marcus Lee", amt: "$95.00", paid: false },
    { id: "INV-1044", c: "Nina Alvarez", amt: "$240.00", paid: true },
  ];
  return (
    <PanelShell title="Invoices">
      <div className="space-y-2">
        {lines.map((l) => (
          <div key={l.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <div>
                <div className="text-xs font-semibold text-white">{l.id}</div>
                <div className="text-[10px] text-slate-500">{l.c}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xs text-white">{l.amt}</div>
              <div className={cn("text-[9px] font-semibold uppercase", l.paid ? "text-emerald-400" : "text-amber-400")}>
                {l.paid ? "Paid" : "Due"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

/* ------------------------------------------------------------------ */
/* Live animated dashboard preview                                     */
/* ------------------------------------------------------------------ */

function LiveDashboardPreview() {
  const drivers = [
    { name: "Mike D.", truck: "T-07", status: "Available", color: "text-emerald-400 bg-emerald-400/10" },
    { name: "Sara P.", truck: "T-12", status: "En route", color: "text-[#FACC15] bg-[#FACC15]/10" },
    { name: "Luis R.", truck: "T-03", status: "On scene", color: "text-sky-400 bg-sky-400/10" },
    { name: "Jess K.", truck: "T-18", status: "Available", color: "text-emerald-400 bg-emerald-400/10" },
  ];

  const baseJobs = [
    { customer: "Amanda Reyes", type: "Tow", location: "I-280 N, mile 42", priority: "Urgent", eta: 0 },
    { customer: "Devon Park", type: "Lockout", location: "742 Market St", priority: "Standard", eta: 0 },
    { customer: "Marcus Lee", type: "Tire change", location: "Hwy 101 S, exit 432", priority: "Standard", eta: 9 },
    { customer: "Nina Alvarez", type: "Tow", location: "Mission Bay Garage L2", priority: "Standard", eta: 4 },
  ];

  // Rotating AI suggestion + ticking ETAs to feel alive
  const suggestions = [
    "Sara P. (T-12) is closest to Amanda Reyes — suggest assigning?",
    "Mike D. (T-07) frees up in ~3 min — hold Devon Park's lockout?",
    "Traffic on Hwy 101 — reroute Luis R. (T-03) via exit 430?",
  ];
  const [sugIdx, setSugIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const { ref, inView } = useInView<HTMLDivElement>();

  useEffect(() => {
    if (!inView) return;
    const s = setInterval(() => setSugIdx((i) => (i + 1) % suggestions.length), 3500);
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => {
      clearInterval(s);
      clearInterval(t);
    };
  }, [inView]);

  const jobs = baseJobs.map((j) =>
    j.eta > 0 ? { ...j, eta: Math.max(1, j.eta - (tick % j.eta)) } : j,
  );

  const priorityColor: Record<string, string> = {
    Urgent: "text-red-400 bg-red-400/10 border-red-400/20",
    Standard: "text-slate-300 bg-white/5 border-white/10",
  };

  const pins = [
    { left: "20%", top: "30%", bg: "bg-red-500", fg: "text-white", label: "T-07", shadow: "shadow-red-500/40" },
    { left: "55%", top: "55%", bg: "bg-[#FACC15]", fg: "text-black", label: "T-12", shadow: "shadow-[#FACC15]/40" },
    { left: "35%", top: "68%", bg: "bg-sky-500", fg: "text-white", label: "T-03", shadow: "shadow-sky-500/40" },
    { left: "75%", top: "22%", bg: "bg-emerald-500", fg: "text-white", label: "T-18", shadow: "shadow-emerald-500/40" },
  ];

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#0F1A2E] shadow-[0_30px_100px_-30px_rgba(0,0,0,0.7)]"
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.02] px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#FACC15]/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
        </div>
        <div className="ml-2 flex-1 truncate rounded-md bg-white/5 px-3 py-1 text-center text-[11px] text-slate-500 sm:text-left">
          hookaidashboard.com/dashboard
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-400 sm:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Live
        </span>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Driver list */}
        <div className="border-b border-white/5 p-4 lg:col-span-3 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Drivers</span>
            <Bell className="h-3.5 w-3.5 text-slate-600" />
          </div>
          <div className="space-y-2">
            {drivers.map((d) => (
              <div key={d.name} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                <div>
                  <div className="text-xs font-semibold text-white">{d.name}</div>
                  <div className="text-[10px] text-slate-500">Truck {d.truck}</div>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", d.color)}>{d.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="relative min-h-[240px] border-b border-white/5 lg:col-span-5 lg:min-h-[380px] lg:border-b-0 lg:border-r">
          <div
            className="absolute inset-0 bg-[#0B1220]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          {/* Animated route line */}
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <line
              x1="20%" y1="30%" x2="55%" y2="55%"
              stroke="#FACC15" strokeWidth="2" strokeDasharray="6 6" strokeLinecap="round"
              style={{ animation: "hk-dash 1s linear infinite", opacity: 0.5 }}
            />
          </svg>
          {/* Pins */}
          {pins.map((p) => (
            <div key={p.label} className="absolute flex flex-col items-center hk-float" style={{ left: p.left, top: p.top }}>
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-full shadow-lg", p.bg, p.shadow)}>
                <Truck className={cn("h-3.5 w-3.5", p.fg)} />
              </div>
              <span className="mt-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">{p.label}</span>
            </div>
          ))}
          {/* AI suggestion bubble (rotating) */}
          <div className="absolute bottom-3 left-3 right-3 flex items-start gap-2 rounded-xl border border-[#FACC15]/30 bg-[#0B1220]/90 px-3 py-2 backdrop-blur sm:right-auto sm:max-w-xs">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#FACC15]" />
            <p key={sugIdx} className="animate-[fadeIn_0.4s_ease] text-[11px] text-slate-300">
              <span className="font-semibold text-white">AI:</span> {suggestions[sugIdx]}
            </p>
          </div>
        </div>

        {/* Job queue */}
        <div className="p-4 lg:col-span-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Job queue</span>
            <span className="rounded-full bg-[#FACC15]/10 px-2 py-0.5 text-[10px] font-semibold text-[#FACC15]">{jobs.length} open</span>
          </div>
          <div className="space-y-2">
            {jobs.map((j) => (
              <div key={j.customer} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{j.customer}</span>
                  <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-medium", priorityColor[j.priority])}>
                    {j.priority}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                  <Navigation className="h-3 w-3" />
                  <span className="truncate">{j.location}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{j.type}</span>
                  {j.eta > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-[#FACC15]">
                      <Clock className="h-3 w-3" /> ETA {j.eta} min
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Comparison table                                                    */
/* ------------------------------------------------------------------ */

function ComparisonTable() {
  const rows = [
    "AI driver suggestions",
    "Customer 'track my tow' live link",
    "Live GPS map & ETAs",
    "Mobile driver app (no hardware)",
    "Photo & e-signature capture",
    "Built-in billing & statements",
    "Business insights dashboard",
    "Impound lot management",
    "Motor club tracking",
    "Setup in under a day",
  ];
  // index 0 = Hooked, 1 = Legacy software, 2 = Spreadsheets/paper
  const matrix: Array<[boolean, boolean, boolean]> = [
    [true, false, false],
    [true, false, false],
    [true, true, false],
    [true, false, false],
    [true, true, false],
    [true, true, false],
    [true, false, false],
    [true, true, false],
    [true, true, false],
    [true, false, false],
  ];
  const Cell = ({ on }: { on: boolean }) =>
    on ? (
      <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#FACC15]/15">
        <Check className="h-3.5 w-3.5 text-[#FACC15]" />
      </span>
    ) : (
      <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-white/5">
        <Minus className="h-3.5 w-3.5 text-slate-600" />
      </span>
    );

  return (
    <div className="mt-12 overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03]">
            <th className="px-4 py-4 text-left font-medium text-slate-400 sm:px-6">Capability</th>
            <th className="px-3 py-4 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FACC15]/15 px-3 py-1 text-xs font-bold text-[#FACC15]">
                <Truck className="h-3.5 w-3.5" /> Hooked
              </span>
            </th>
            <th className="px-3 py-4 text-center text-xs font-semibold text-slate-400">Legacy software</th>
            <th className="px-3 py-4 text-center text-xs font-semibold text-slate-400">Spreadsheets</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r} className={cn("border-b border-white/5", i % 2 ? "bg-white/[0.01]" : "")}>
              <td className="px-4 py-3 text-slate-200 sm:px-6">{r}</td>
              <td className="bg-[#FACC15]/[0.04] px-3 py-3"><Cell on={matrix[i][0]} /></td>
              <td className="px-3 py-3"><Cell on={matrix[i][1]} /></td>
              <td className="px-3 py-3"><Cell on={matrix[i][2]} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ROI calculator                                                      */
/* ------------------------------------------------------------------ */

function RoiCalculator() {
  const [trucks, setTrucks] = useState(6);
  const [jobsPerTruck, setJobsPerTruck] = useState(6);
  const [avgRevenue, setAvgRevenue] = useState(120);

  const workdays = 26;
  const jobsPerMonth = trucks * jobsPerTruck * workdays;
  const minutesSavedPerJob = 3.5;
  const hoursSaved = Math.round((jobsPerMonth * minutesSavedPerJob) / 60);
  const extraJobs = Math.round(jobsPerMonth * 0.08); // faster response → ~8% more captured
  const addedRevenue = Math.round(extraJobs * avgRevenue);

  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <div className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-[#0F1A2E] p-6 sm:p-8 lg:grid-cols-2">
      {/* Inputs */}
      <div className="space-y-7">
        <Slider label="Trucks in your fleet" value={trucks} min={1} max={40} onChange={setTrucks} suffix={trucks === 1 ? "truck" : "trucks"} />
        <Slider label="Jobs per truck / day" value={jobsPerTruck} min={1} max={20} onChange={setJobsPerTruck} suffix="jobs" />
        <Slider label="Avg. revenue per job" value={avgRevenue} min={40} max={500} step={5} onChange={setAvgRevenue} prefix="$" />
        <p className="text-[11px] leading-relaxed text-slate-500">
          Estimates assume ~3.5 min saved per job from faster dispatch and ~8% more jobs captured
          from quicker response times. Your results will vary — we'll model your real numbers during onboarding.
        </p>
      </div>

      {/* Outputs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RoiStat icon={Timer} value={`${fmt(hoursSaved)} hrs`} label="Dispatcher time saved / month" accent />
        <RoiStat icon={TrendingUp} value={`+${fmt(extraJobs)}`} label="Extra jobs captured / month" />
        <RoiStat icon={Gauge} value={`${fmt(jobsPerMonth)}`} label="Jobs managed / month" />
        <RoiStat icon={BarChart3} value={`$${fmt(addedRevenue)}`} label="Est. added revenue / month" accent />
        <div className="sm:col-span-2">
          <Link
            to="/apply"
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#FACC15] px-6 py-3.5 text-sm font-bold text-black shadow-[0_4px_14px_0_rgba(250,204,21,0.25)] transition-all hover:bg-[#EAB308] active:scale-[0.98]"
          >
            Capture this with a free trial
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  prefix = "",
  suffix = "",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="rounded-lg bg-white/5 px-2.5 py-1 text-sm font-bold text-[#FACC15]">
          {prefix}
          {value.toLocaleString("en-US")}
          {suffix ? ` ${suffix}` : ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#FACC15]"
      />
    </div>
  );
}

function RoiStat({
  icon: Icon,
  value,
  label,
  accent = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        accent ? "border-[#FACC15]/30 bg-[#FACC15]/[0.06]" : "border-white/10 bg-white/[0.03]",
      )}
    >
      <Icon className={cn("h-5 w-5", accent ? "text-[#FACC15]" : "text-slate-400")} />
      <div className="mt-3 text-2xl font-extrabold text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-colors hover:border-white/20">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-white"
      >
        {q}
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-[#FACC15] transition-transform duration-300", open && "rotate-180")} />
      </button>
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-4 text-sm leading-relaxed text-slate-400">{a}</p>
        </div>
      </div>
    </div>
  );
}
