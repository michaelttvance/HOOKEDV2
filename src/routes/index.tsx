import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { track } from "@/lib/analytics";
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
  Phone,
  DollarSign,
  Wrench,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const COPYRIGHT_YEAR = 2026;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hooked — Tow Dispatch & Towing Management Software" },
      {
        name: "description",
        content:
          "Hooked is modern dispatch software for tow operators — call intake, driver coordination, live tracking, motor club workflows, impound management, billing, and owner reporting in one platform.",
      },
      { property: "og:title", content: "Hooked — Tow Dispatch & Towing Management Software" },
      {
        property: "og:description",
        content:
          "Run your towing company on one modern platform: intake, dispatch, driver app, customer tracking, billing, and impound.",
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
            <a href="#compare" className="transition-colors hover:text-white">Platform</a>
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
              to="/demo"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-all hover:border-white/30 hover:bg-white/10"
            >
              Watch the demo
            </Link>
            <Link
              to="/apply"
              className="group rounded-xl bg-[#FACC15] px-4 py-2 text-sm font-bold text-black shadow-[0_4px_14px_0_rgba(250,204,21,0.25)] transition-all hover:bg-[#EAB308] hover:shadow-[0_6px_20px_0_rgba(250,204,21,0.35)] active:scale-[0.98]"
            >
              Start free trial
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
              <a href="#compare" onClick={() => setNavOpen(false)}>Platform</a>
              <a href="#pricing" onClick={() => setNavOpen(false)}>Pricing</a>
              <Link to={homeLink} onClick={() => setNavOpen(false)}>
                {authed ? "Dashboard" : "Sign in"}
              </Link>
              <Link
                to="/demo"
                onClick={() => setNavOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center font-semibold text-white"
              >
                Watch the demo
              </Link>
              <Link
                to="/apply"
                onClick={() => setNavOpen(false)}
                className="rounded-xl bg-[#FACC15] px-4 py-2 text-center font-bold text-black"
              >
                Start free trial
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 text-center sm:px-6 sm:pb-14 sm:pt-20">
          <Reveal>
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-[#FACC15]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FACC15] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FACC15]" />
              </span>
              Dispatch software built for tow operators
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Run the tow operation
              <br />
              <span className="bg-gradient-to-r from-[#FACC15] via-amber-300 to-[#FACC15] bg-clip-text text-transparent">
                your team deserves.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
              Hooked gives tow operators one operating system for intake, dispatch, driver coordination,
              customer tracking, billing, and release paperwork without the usual office chaos.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/apply"
                onClick={() => track("start_trial_click", { location: "home_hero" })}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#FACC15] px-6 py-3.5 text-sm font-bold text-black shadow-[0_4px_14px_0_rgba(250,204,21,0.25)] transition-all hover:bg-[#EAB308] hover:shadow-[0_8px_28px_0_rgba(250,204,21,0.4)] active:scale-[0.98] sm:w-auto"
              >
                Start free trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/demo"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/30 hover:bg-white/10 sm:w-auto"
              >
                Watch the demo
              </Link>
            </div>
          </Reveal>
          <Reveal delay={300}>
            <p className="mt-4 text-xs text-slate-500">
              30-day free trial · No credit card required · We'll help you get set up
            </p>
          </Reveal>
          <Reveal delay={360}>
            <div className="mx-auto mt-8 grid max-w-4xl gap-3 text-left sm:grid-cols-3">
              {[
                {
                  title: "The office gets one source of truth",
                  body: "Calls, active jobs, ETAs, customer updates, and closeout all stay on the same board.",
                },
                {
                  title: "Drivers work from one road-ready flow",
                  body: "Status, navigation, photos, signatures, and tracking texts live in a single driver experience.",
                },
                {
                  title: "Owners see the operation clearly",
                  body: "Response times, bottlenecks, and revenue signals are visible without chasing dispatch for updates.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Product demo video */}
        <section id="demo" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <SectionEyebrow>Watch it work</SectionEyebrow>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                From first call to paid invoice
              </h2>
              <p className="mt-4 text-slate-400">
                Watch the exact sequence an operator cares about: intake, structured dispatch, fast assignment,
                live tracking, and clean closeout.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <ProductDemoFilm />
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
                Built for the whole shift, not just the first phone call
              </h2>
              <p className="mt-4 text-slate-400">
                Hooked keeps intake, dispatch, field execution, paperwork, and owner visibility connected so
                the team is not stitching together radios, calls, notes, and billing by hand.
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
                  One platform, every core workflow
                </h2>
                <p className="mt-4 text-slate-400">
                  Explore the screens your dispatchers, drivers, and office staff work from every shift.
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
                Launch without a long rollout
              </h2>
              <p className="mt-4 text-slate-400">
                We keep setup focused on the parts that matter first so your team can start dispatching quickly.
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
                  See what smoother operations can unlock
                </h2>
                <p className="mt-4 text-slate-400">
                  Estimate the upside from faster assignment, fewer missed jobs, and cleaner office follow-through.
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
                A cleaner operating model for towing
              </h2>
              <p className="mt-4 text-slate-400">
                Hooked is built so dispatch, drivers, customer updates, and billing finally work from the same system.
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
                  Built for operators who want the office to feel under control
                </h2>
                <p className="mt-4 text-slate-400">
                  The value is not more software. It is fewer dropped details, faster assignments, and a team that knows what is happening.
                </p>
              </div>
            </Reveal>
            <div className="grid gap-5 lg:grid-cols-3">
              {[
                {
                  quote:
                    "We moved our dispatch team into Hooked and our assignment times dropped almost immediately. The AI suggestions actually save us time.",
                  name: "Towing operations lead",
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
                Start with the full product
              </h2>
              <p className="mt-4 text-slate-400">
                Start your free 30-day trial with the full Hooked platform. After that, pricing is shaped around fleet size and operating complexity.
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
                  on us, then fleet-based pricing shaped around truck count and workflow needs
                </p>
                <ul className="mt-7 space-y-3 text-left text-sm text-slate-300">
                  {[
                    "Dispatch board with live queue and map",
                    "Driver mobile app",
                    "Customer tracking and updates",
                    "Billing, impound & rotations",
                    "Motor club tracking",
                    "Owner reporting and visibility",
                    "No credit card required to start",
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

        {/* Why operators choose Hooked */}
        <section id="why" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <SectionEyebrow>Why towing businesses choose Hooked</SectionEyebrow>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Built around how real tow operations run
              </h2>
              <p className="mt-4 text-slate-400">
                Hooked is designed with working tow companies — not generic field-service
                software dressed up for towing. The goal is fewer dropped details on busy days
                and a clearer picture for the people running the operation.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "One source of truth",
                body: "Intake, dispatch, driver updates, customer tracking, and closeout stay connected instead of scattered across calls, texts, and paper.",
              },
              {
                title: "Made for the road",
                body: "Drivers get a focused mobile workflow for the job in front of them — status, navigation, photos, signatures, and tracking links.",
              },
              {
                title: "Visibility for owners",
                body: "Response times, bottlenecks, and revenue signals are visible without chasing dispatch for a verbal recap.",
              },
              {
                title: "Covers the whole job",
                body: "From the first call through billing, impound, rotations, and motor club work — the operation lives in one place.",
              },
              {
                title: "Customer experience",
                body: "Live tracking and timely updates help reduce 'where's my truck?' calls and keep customers informed.",
              },
              {
                title: "A team that supports you",
                body: "We help you get set up and stay reachable, so you're not left figuring out new software on your own.",
              },
            ].map((item) => (
              <Reveal key={item.title}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FACC15]/15 text-[#FACC15]">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* What to expect during onboarding */}
        <section id="onboarding" className="border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <SectionEyebrow>What to expect during onboarding</SectionEyebrow>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  A practical path to getting your team live
                </h2>
                <p className="mt-4 text-slate-400">
                  Every operation is different, so timelines vary. Here's the general path most
                  teams follow — we'll adapt it to how your company actually works.
                </p>
              </div>
            </Reveal>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: "1",
                  title: "Talk it through",
                  body: "We learn how your office, drivers, and billing work today and where the friction is.",
                },
                {
                  step: "2",
                  title: "Set up your account",
                  body: "We help configure your company, users, and the core dispatch workflow so it fits your operation.",
                },
                {
                  step: "3",
                  title: "Get drivers running",
                  body: "Drivers start on the mobile workflow first, so live jobs and tracking come online early.",
                },
                {
                  step: "4",
                  title: "Layer in the rest",
                  body: "Billing, impound, rotations, motor clubs, and reporting come in cleanly as your team gets comfortable.",
                },
              ].map((item) => (
                <Reveal key={item.step}>
                  <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FACC15] text-sm font-extrabold text-black">
                      {item.step}
                    </div>
                    <h3 className="mt-4 text-base font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Security and data responsibility */}
        <section id="security" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <SectionEyebrow>Security and data responsibility</SectionEyebrow>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                We take your operational data seriously
              </h2>
              <p className="mt-4 text-slate-400">
                Your dispatch and customer information is core to your business, and we treat it
                that way.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Access controls",
                body: "Each company's data is kept separate, and users only see what their role is meant to see.",
              },
              {
                icon: Building2,
                title: "Your data stays yours",
                body: "We don't sell your business or customer data. It's used to provide and improve the service you're paying for.",
              },
              {
                icon: FileText,
                title: "Shared responsibility",
                body: "We secure the platform; you control who on your team has access and how it's used day to day.",
              },
            ].map((item) => (
              <Reveal key={item.title}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FACC15]/15 text-[#FACC15]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-slate-500">
              Hooked helps you run your operation, but it does not provide legal, regulatory, or
              compliance advice. You are responsible for complying with the laws, licensing, and
              regulations that apply to your towing business and the jurisdictions you operate in.
            </p>
          </Reveal>
        </section>

        {/* 30-day trial explained */}
        <section id="trial" className="border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <SectionEyebrow>30-day trial explained</SectionEyebrow>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  How the free trial works
                </h2>
              </div>
            </Reveal>
            <div className="mt-10 space-y-3">
              {[
                {
                  title: "No credit card to start",
                  body: "You can begin your 30-day trial without entering payment details up front.",
                },
                {
                  title: "Nothing auto-charges",
                  body: "When the trial ends, you aren't automatically billed. We reach out first with pricing shaped around your operation.",
                },
                {
                  title: "You decide what's next",
                  body: "If Hooked is a fit, we help you continue on a plan. If it isn't, there's no obligation to keep going.",
                },
              ].map((item) => (
                <Reveal key={item.title}>
                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#FACC15]" />
                    <div>
                      <div className="text-sm font-semibold text-white">{item.title}</div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-slate-500">
                Trial access is provided as-is and is subject to our Terms of Service. Features
                and availability may change over time. Pricing after the trial depends on your
                fleet size and workflow needs.
              </p>
            </Reveal>
          </div>
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
                q: "How fast can my team start using Hooked?",
                a: "It depends on your operation, but we help you get started quickly. We focus on drivers, dispatch, and live jobs first, then layer in billing, impound, rotations, and reporting cleanly.",
              },
              {
                q: "What does Hooked replace in the office?",
                a: "For most towing companies, Hooked replaces the messy mix of handwritten notes, text threads, ETA phone calls, disconnected driver updates, and after-the-fact billing rebuilds.",
              },
              {
                q: "Will drivers actually use the driver app?",
                a: "The driver app is designed around the real road workflow: current job, call customer, navigate, send the tracking link, update status, capture photos, collect a signature, and ask for backup when needed.",
              },
              {
                q: "Can customers track the driver?",
                a: "Yes. Dispatch or the driver can send a live tracking link so the customer sees ETA and progress without tying up the office phone.",
              },
              {
                q: "Does Hooked handle billing after the job is done?",
                a: "Yes. Completed jobs can flow into invoices and account statements so the office is not rebuilding paperwork after dispatch work is already finished.",
              },
              {
                q: "What happens if my team runs into an issue?",
                a: "Hooked includes in-app help with common fixes and a clear ticket path so operators can get unstuck without leaving the workflow.",
              },
              {
                q: "What happens after the 30-day free trial?",
                a: "Nothing auto-charges. Before your trial ends, we reach out with pricing shaped around your operation so you can decide whether Hooked is the right fit.",
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
                Run a sharper towing operation
              </h2>
              <p className="relative mx-auto mt-4 max-w-xl text-slate-400">
                Bring dispatch, drivers, customer updates, and closeout into one operating system your team can trust on a busy day.
              </p>
              <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/apply"
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#FACC15] px-6 py-3.5 text-sm font-bold text-black shadow-[0_4px_14px_0_rgba(250,204,21,0.25)] transition-all hover:bg-[#EAB308] hover:shadow-[0_8px_28px_0_rgba(250,204,21,0.4)] active:scale-[0.98] sm:w-auto"
                >
                  Start free trial
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/demo"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/30 hover:bg-white/10 sm:w-auto"
                >
                  Watch the demo
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
            © {COPYRIGHT_YEAR} Hooked. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <a href="#features" className="hover:text-slate-300">Features</a>
            <a href="#pricing" className="hover:text-slate-300">Pricing</a>
            <Link to="/apply" className="hover:text-slate-300">Apply</Link>
            <Link to="/auth" className="hover:text-slate-300">Sign in</Link>
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-6xl border-t border-white/5 pt-6">
          <p className="text-center text-[11px] leading-relaxed text-slate-600">
            Use of Hooked is subject to our Terms of Service, and information is handled in
            accordance with our Privacy Policy. Hooked provides dispatch and operations
            software; it does not provide legal, regulatory, or compliance advice. Customers
            are responsible for complying with the laws and regulations that apply to their
            towing business. Free trials are subject to the applicable terms.
          </p>
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
      @keyframes hk-fill { from { width: 0%; } to { width: 100%; } }
      @keyframes hk-caret { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
      @keyframes hk-ring { 0%,100% { transform: rotate(0); } 15% { transform: rotate(-14deg); } 30% { transform: rotate(12deg); } 45% { transform: rotate(-10deg); } 60% { transform: rotate(8deg); } 75% { transform: rotate(-4deg); } }
      @keyframes hk-scene-in { from { opacity: 0; transform: translateY(12px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes hk-pop { 0% { opacity: 0; transform: translateY(8px) scale(0.96); } 60% { transform: translateY(0) scale(1.02); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes hk-pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(250,204,21,0.5); } 70% { box-shadow: 0 0 0 14px rgba(250,204,21,0); } 100% { box-shadow: 0 0 0 0 rgba(250,204,21,0); } }
      .hk-float { animation: hk-float 4s ease-in-out infinite; }
      .hk-marquee { animation: hk-marquee 26s linear infinite; }
      .hk-caret { animation: hk-caret 1s step-end infinite; }
      .hk-ring { animation: hk-ring 1.1s ease-in-out infinite; transform-origin: 50% 0%; }
      .hk-scene-in { animation: hk-scene-in 0.55s ease both; }
      .hk-pop { animation: hk-pop 0.5s ease both; }
      .hk-pulse-ring { animation: hk-pulse-ring 1.6s ease-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .hk-float, .hk-marquee, .hk-ring, .hk-scene-in, .hk-pop, .hk-pulse-ring, .hk-caret { animation: none; }
      }
    `}</style>
  );
}

/* ------------------------------------------------------------------ */
/* Interactive product film — self-playing dispatch story             */
/* ------------------------------------------------------------------ */

const DEMO_SCENES = [
  { key: "call", label: "Call comes in", dur: 3600 },
  { key: "entry", label: "AI Quick Entry", dur: 6200 },
  { key: "assign", label: "Smart assign", dur: 4800 },
  { key: "track", label: "Customer tracking", dur: 5200 },
  { key: "paid", label: "Done & paid", dur: 4400 },
] as const;

const DEMO_NOTE = "Amanda stuck on I-280 N mile 42 — silver Tahoe won't start, needs a tow ASAP";

function ProductDemoFilm() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [loops, setLoops] = useState(0); // bump to restart per-scene animations on replay

  // Scene clock
  useEffect(() => {
    if (!inView || !playing) return;
    const id = setTimeout(() => {
      setScene((s) => {
        const next = (s + 1) % DEMO_SCENES.length;
        if (next === 0) setLoops((l) => l + 1);
        return next;
      });
    }, DEMO_SCENES[scene].dur);
    return () => clearTimeout(id);
  }, [inView, playing, scene]);

  const active = DEMO_SCENES[scene].key;

  return (
    <div ref={ref} className="relative mt-10">
      <div className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-gradient-to-b from-[#FACC15]/20 via-sky-500/10 to-transparent blur-3xl" />
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#07111f] shadow-[0_32px_100px_-36px_rgba(250,204,21,0.45)]">
        {/* Chrome bar */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-400/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-300/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-xs font-medium text-slate-300">
            <span className="flex h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-400" />
            <span className="truncate">
              <span className="hidden text-slate-500 sm:inline">Hooked live demo · </span>
              {DEMO_SCENES[scene].label}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause demo" : "Play demo"}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/30 text-slate-300 transition-colors hover:text-white"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setScene(0);
                setLoops((l) => l + 1);
                setPlaying(true);
              }}
              aria-label="Replay demo"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/30 text-slate-300 transition-colors hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Progress segments */}
        <div className="flex gap-1.5 border-b border-white/10 bg-black/20 px-4 py-2.5 sm:px-5">
          {DEMO_SCENES.map((s, i) => (
            <div key={s.key} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#FACC15]"
                style={
                  i < scene
                    ? { width: "100%" }
                    : i === scene
                      ? {
                          width: "0%",
                          animation: `hk-fill ${DEMO_SCENES[scene].dur}ms linear forwards`,
                          animationPlayState: playing && inView ? "running" : "paused",
                        }
                      : { width: "0%" }
                }
                // restart fill animation each time this scene becomes active / on replay
                key={`${s.key}-${scene === i ? loops : "idle"}-${scene}`}
              />
            </div>
          ))}
        </div>

        {/* Stage */}
        <div className="relative aspect-[16/11] w-full bg-[#0B1220] sm:aspect-[16/9]">
          <SceneCall active={active === "call"} />
          <SceneEntry active={active === "entry"} loops={loops} />
          <SceneAssign active={active === "assign"} loops={loops} />
          <SceneTrack active={active === "track"} loops={loops} />
          <ScenePaid active={active === "paid"} loops={loops} />
        </div>

        {/* Footer chips */}
        <div className="grid gap-3 border-t border-white/10 bg-white/[0.035] p-4 text-xs text-slate-400 sm:grid-cols-4 sm:p-5">
          {["AI Quick Entry", "Closest-driver assign", "Live customer tracking", "Paid in one tap"].map(
            (item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#FACC15]" />
                <span>{item}</span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function SceneShell({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col p-4 transition-opacity duration-500 sm:p-7",
        active ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0",
      )}
    >
      {children}
    </div>
  );
}

/* Scene 1 — incoming call */
function SceneCall({ active }: { active: boolean }) {
  return (
    <SceneShell active={active}>
      <div className="flex h-full items-center justify-center">
        {active && (
          <div className="hk-scene-in w-full max-w-sm rounded-2xl border border-white/10 bg-[#0F1A2E] p-5 shadow-2xl sm:p-6">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Incoming call
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FACC15]/15">
                <Phone className="hk-ring h-7 w-7 text-[#FACC15]" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-lg font-bold text-white">Amanda Reyes</div>
                <div className="text-xs text-slate-400">Mobile · stranded motorist</div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-slate-300">
              <MapPin className="h-4 w-4 shrink-0 text-[#FACC15]" />
              <span className="truncate">I-280 N · near mile marker 42</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-[#FACC15]" />
              Hooked logs the call and opens Quick Entry automatically
            </div>
          </div>
        )}
      </div>
    </SceneShell>
  );
}

/* Scene 2 — AI Quick Entry: messy note types, AI structures it */
function SceneEntry({ active, loops }: { active: boolean; loops: number }) {
  const [typed, setTyped] = useState("");
  const done = typed.length >= DEMO_NOTE.length;

  useEffect(() => {
    if (!active) {
      setTyped("");
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(DEMO_NOTE.slice(0, i));
      if (i >= DEMO_NOTE.length) clearInterval(id);
    }, 34);
    return () => clearInterval(id);
  }, [active, loops]);

  const fields = [
    { icon: Wrench, label: "Service", value: "Tow" },
    { icon: Truck, label: "Vehicle", value: "Silver Chevy Tahoe" },
    { icon: MapPin, label: "Location", value: "I-280 N · Mile 42" },
    { icon: Zap, label: "Priority", value: "Urgent" },
  ];

  return (
    <SceneShell active={active}>
      <div className="grid h-full gap-3 sm:grid-cols-2 sm:gap-4">
        {/* Notes */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0F1A2E] p-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Dispatcher notes
          </div>
          <div className="mt-2 flex-1 text-sm leading-relaxed text-slate-200">
            {typed}
            {!done && <span className="hk-caret ml-0.5 inline-block h-4 w-[2px] -translate-y-[1px] bg-[#FACC15] align-middle" />}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
            <FileText className="h-3 w-3" /> Type it the way you'd say it
          </div>
        </div>
        {/* AI parsed */}
        <div className="flex flex-col rounded-2xl border border-[#FACC15]/25 bg-gradient-to-br from-[#FACC15]/[0.08] to-white/[0.02] p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#FACC15]">
            <Sparkles className="h-3.5 w-3.5" /> AI Quick Entry
          </div>
          <div className="mt-3 grid flex-1 grid-cols-2 gap-2.5 content-start">
            {fields.map((f, i) => (
              <div
                key={f.label}
                className={cn(
                  "rounded-xl border border-white/10 bg-black/30 p-2.5 transition-all duration-300",
                  done ? "hk-pop opacity-100" : "opacity-0",
                )}
                style={done ? { animationDelay: `${i * 130}ms` } : undefined}
              >
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-500">
                  <f.icon className="h-3 w-3 text-[#FACC15]" />
                  {f.label}
                </div>
                <div className="mt-1 text-xs font-semibold text-white">{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

/* Scene 3 — smart assign with closest-driver suggestion */
function SceneAssign({ active, loops }: { active: boolean; loops: number }) {
  const [assigned, setAssigned] = useState(false);
  useEffect(() => {
    if (!active) {
      setAssigned(false);
      return;
    }
    const id = setTimeout(() => setAssigned(true), 2400);
    return () => clearTimeout(id);
  }, [active, loops]);

  return (
    <SceneShell active={active}>
      <div className="flex h-full items-center justify-center">
        {active && (
          <div className="hk-scene-in w-full max-w-md space-y-3">
            {/* Job card */}
            <div className="rounded-2xl border border-white/10 bg-[#0F1A2E] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Amanda Reyes</span>
                <span className="rounded border border-red-400/20 bg-red-400/10 px-1.5 py-0.5 text-[9px] font-medium text-red-400">
                  Urgent
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                <Navigation className="h-3 w-3" /> I-280 N · Mile 42 · Tow
              </div>
            </div>
            {/* AI suggestion */}
            <div className="flex items-start gap-2 rounded-2xl border border-[#FACC15]/30 bg-[#0B1220] px-3.5 py-3">
              <Bot className="mt-0.5 h-4 w-4 shrink-0 text-[#FACC15]" />
              <p className="text-xs text-slate-300">
                <span className="font-semibold text-white">AI:</span> Sara P. (T-12) is closest —
                <span className="font-semibold text-[#FACC15]"> 1.2 mi · ETA 6 min</span>. Assign &amp; notify Amanda?
              </p>
            </div>
            {/* Action */}
            {assigned ? (
              <div className="hk-pop flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 px-5 py-3 text-sm font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Assigned to Sara P. · customer texted
              </div>
            ) : (
              <div className="hk-pulse-ring flex items-center justify-center gap-2 rounded-xl bg-[#FACC15] px-5 py-3 text-sm font-bold text-black">
                <Zap className="h-4 w-4" /> Assign &amp; notify customer
              </div>
            )}
          </div>
        )}
      </div>
    </SceneShell>
  );
}

/* Scene 4 — live customer tracking with traveling truck */
function SceneTrack({ active, loops }: { active: boolean; loops: number }) {
  const [moved, setMoved] = useState(false);
  useEffect(() => {
    if (!active) {
      setMoved(false);
      return;
    }
    const id = setTimeout(() => setMoved(true), 150);
    return () => clearTimeout(id);
  }, [active, loops]);

  return (
    <SceneShell active={active}>
      <div className="grid h-full gap-3 sm:grid-cols-5 sm:gap-4">
        {/* Map */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 sm:col-span-3">
          <div
            className="absolute inset-0 bg-[#0B1220]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <line
              x1="18%" y1="78%" x2="78%" y2="24%"
              stroke="#FACC15" strokeWidth="2" strokeDasharray="6 6" strokeLinecap="round"
              style={{ animation: "hk-dash 1s linear infinite", opacity: 0.5 }}
            />
          </svg>
          {/* Destination pin */}
          <div className="absolute" style={{ left: "78%", top: "24%", transform: "translate(-50%,-50%)" }}>
            <MapPin className="h-6 w-6 text-red-400" fill="currentColor" />
          </div>
          {/* Traveling truck */}
          <div
            className="absolute transition-all duration-[4200ms] ease-linear"
            style={{
              left: moved ? "78%" : "18%",
              top: moved ? "24%" : "78%",
              transform: "translate(-50%,-50%)",
            }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FACC15] shadow-lg shadow-[#FACC15]/40">
              <Truck className="h-4 w-4 text-black" />
            </div>
          </div>
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-medium text-emerald-400 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Sara P. en route
          </div>
        </div>
        {/* Customer phone */}
        <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-[#0F1A2E] p-4 sm:col-span-2">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            What Amanda sees
          </div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Truck className="h-4 w-4 text-[#FACC15]" /> Track your tow
            </div>
            <div className="mt-3 text-3xl font-extrabold text-white">
              6<span className="ml-1 text-base font-semibold text-slate-400">min away</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">Sara P. · Truck T-12</div>
            <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#FACC15]/10 px-2.5 py-1.5 text-[10px] text-[#FACC15]">
              <MessageSquare className="h-3 w-3" /> "We'll text you 2 min out"
            </div>
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

/* Scene 5 — completed & paid, revenue ticks up */
function ScenePaid({ active, loops }: { active: boolean; loops: number }) {
  const revenue = useCountUp(4720, active, 1600);
  const jobs = useCountUp(23, active, 1600);
  return (
    <SceneShell active={active}>
      <div className="flex h-full items-center justify-center">
        {active && (
          <div key={loops} className="hk-scene-in w-full max-w-md space-y-3">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Job complete</div>
                <div className="text-[11px] text-slate-400">Photos, signature & timeline saved</div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0F1A2E] p-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Receipt className="h-4 w-4 text-[#FACC15]" /> Invoice #1047
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-white">$185.00</span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  Paid
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#FACC15]/20 bg-[#FACC15]/[0.06] p-4">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400">
                  <DollarSign className="h-3 w-3 text-[#FACC15]" /> Collected today
                </div>
                <div className="mt-1 text-2xl font-extrabold text-white">
                  ${revenue.toLocaleString("en-US")}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0F1A2E] p-4">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400">
                  <Gauge className="h-3 w-3 text-[#FACC15]" /> Jobs today
                </div>
                <div className="mt-1 text-2xl font-extrabold text-white">{jobs}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SceneShell>
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
          <h3 className="mt-5 text-xl font-bold text-white">Dispatch Assistant</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-300">
            An assistant that helps your dispatcher work faster — it can suggest a
            closest-available driver, draft customer text updates for review, and surface SLA
            timers so jobs are less likely to slip. It supports your dispatcher's judgment
            rather than replacing it.
          </p>
          <div className="mt-6 space-y-2">
            {[
              "Closest-available driver suggestions",
              "Draft customer ETA texts for review",
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
        { icon: MapPin, title: "Live Customer Tracking", description: "Customers get a real-time tracking link to watch their driver approach — fewer 'where are you?' calls." },
        { icon: Smartphone, title: "Simple Driver App", description: "Large buttons for job status, navigation, customer calls, tracking texts, photos, signatures, and backup requests." },
        { icon: Receipt, title: "Billing & Invoicing", description: "Auto-generate invoices and statements from completed jobs and get paid faster." },
        { icon: Warehouse, title: "Impound Management", description: "Track lot inventory, release paperwork, and storage-fee calculations." },
        { icon: BarChart3, title: "Owner Command Center", description: "Revenue, response times, missed calls, campaign ROI, driver productivity, and job volume in one view." },
        { icon: Building2, title: "Motor Club Tracking", description: "Track motor club jobs, payouts, and which contracts are worth your time." },
        { icon: MessageSquare, title: "Support Assistant", description: "In-app troubleshooting and ticket escalation when your team hits a workflow issue." },
        { icon: Timer, title: "SLA Watchtower", description: "Automatic alerts for unassigned calls, stalled jobs, long on-scene time, and late updates." },
        { icon: Camera, title: "Proof Package", description: "Photos, signatures, notes, job timeline, and invoice details stay connected to every tow." },
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
  // index 0 = Hooked, 1 = Disconnected tools, 2 = Manual process
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
            <th className="px-3 py-4 text-center text-xs font-semibold text-slate-400">Disconnected tools</th>
            <th className="px-3 py-4 text-center text-xs font-semibold text-slate-400">Manual process</th>
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
