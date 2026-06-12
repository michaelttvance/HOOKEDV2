import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { track } from "@/lib/analytics";
import { PublicFooter } from "@/components/public-footer";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Building2,
  Camera,
  CheckCircle2,
  FileText,
  Gauge,
  LifeBuoy,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  PlayCircle,
  Receipt,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Timer,
  Truck,
  Warehouse,
} from "lucide-react";

const demoHead = () => ({
  meta: [
    { title: "Hooked Demo — Dispatch, Driver App, Billing & More" },
    {
      name: "description",
      content:
        "Watch how Hooked works for towing company owners, dispatchers, and drivers with a guided product walkthrough.",
    },
    { property: "og:title", content: "Hooked Demo — Dispatch, Driver App, Billing & More" },
    {
      property: "og:description",
      content:
        "A guided product walkthrough for tow operators covering dispatch, driver workflow, customer tracking, billing, and impound.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://hookaidashboard.com/demo" },
  ],
});

export const Route = createFileRoute("/demo")({
  head: demoHead,
  component: DemoPage,
});

function DemoPage() {
  useEffect(() => {
    track("demo_page_view");
  }, []);

  const modules = [
    {
      id: "owner",
      title: "Owner command center",
      icon: BarChart3,
      eyebrow: "Owner view",
      copy:
        "See response-time trends, revenue signals, trial health, team throughput, and the bottlenecks that are slowing down the office.",
      bullets: [
        "Track response-time performance without waiting for end-of-day reports",
        "Spot missed opportunities and where jobs are stalling",
        "Keep revenue, workload, and team performance visible in one place",
      ],
      panel: <OwnerPreview />,
    },
    {
      id: "dispatch",
      title: "Dispatcher board",
      icon: Navigation,
      eyebrow: "Dispatch",
      copy:
        "Run the active queue, assign the right truck quickly, and keep customer updates tied to the job instead of scattered across calls and texts.",
      bullets: [
        "Work active jobs, urgent calls, and driver readiness from one screen",
        "See the live map, queue, and closest-driver context together",
        "Open job detail, status timeline, and customer communication without leaving the board",
      ],
      panel: <DispatchPreview />,
    },
    {
      id: "driver",
      title: "Driver workflow",
      icon: Smartphone,
      eyebrow: "Driver app",
      copy:
        "Give drivers a road-ready workflow with only the controls they actually need while they are moving from assignment to completion.",
      bullets: [
        "Open the current job, call the customer, and navigate in a tap",
        "Update status, capture photos, collect a signature, and request backup",
        "Keep the driver experience focused instead of buried in dispatcher UI",
      ],
      panel: <DriverPreview />,
    },
    {
      id: "ai",
      title: "Dispatch assist",
      icon: Sparkles,
      eyebrow: "Smart dispatch",
      copy:
        "Turn messy notes into a clean dispatch-ready job and get fast operational suggestions without replacing the dispatcher’s judgment.",
      bullets: [
        "Parse inbound call notes into service type, location, vehicle, and priority",
        "Recommend the best available truck for the job",
        "Draft customer follow-up texts and surface missing information",
      ],
      panel: <AiPreview />,
    },
    {
      id: "tracking",
      title: "Live tracking",
      icon: MapPin,
      eyebrow: "Customer visibility",
      copy:
        "Let the customer see the truck coming so the office takes fewer ETA calls while dispatch stays focused on the queue.",
      bullets: [
        "Share a tracking link with ETA and real-time progress",
        "Reduce “where are you?” calls into the office",
        "Keep customer expectations aligned while the job is in motion",
      ],
      panel: <TrackingPreview />,
    },
    {
      id: "updates",
      title: "Customer updates",
      icon: MessageSquare,
      eyebrow: "Communication",
      copy:
        "Keep updates connected to the job so the team knows what the customer saw, what was sent, and what still needs a reply.",
      bullets: [
        "Draft ETA or follow-up texts from inside the workflow",
        "Keep the conversation attached to the tow, not buried in a separate thread",
        "Make customer communication part of dispatch, not a side task",
      ],
      panel: <UpdatesPreview />,
    },
    {
      id: "sla",
      title: "SLA and stalled-job alerts",
      icon: ShieldAlert,
      eyebrow: "Ops control",
      copy:
        "Surface jobs that are sitting too long before they become service failures or angry callbacks.",
      bullets: [
        "Flag unassigned calls that are approaching response thresholds",
        "Highlight stalled or idle jobs that need dispatcher attention",
        "Keep the operation honest on busy days when details slip fastest",
      ],
      panel: <AlertsPreview />,
    },
    {
      id: "billing",
      title: "Billing and invoicing",
      icon: Receipt,
      eyebrow: "Closeout",
      copy:
        "Carry the job cleanly into invoice and statement workflow so the office is not rebuilding paperwork after the tow is already done.",
      bullets: [
        "Move completed jobs into invoice flow with less re-entry",
        "Keep payment status and account statements visible",
        "Help the office close the loop faster after dispatch work is done",
      ],
      panel: <BillingPreview />,
    },
    {
      id: "impound",
      title: "Impound management",
      icon: Warehouse,
      eyebrow: "Lot operations",
      copy:
        "Track impound vehicles, release status, storage exposure, and paperwork in the same operating system as dispatch.",
      bullets: [
        "Keep lot inventory and release work visible",
        "Connect impound follow-up back to the original job history",
        "Reduce manual handoff between dispatch and lot administration",
      ],
      panel: <ImpoundPreview />,
    },
    {
      id: "motor",
      title: "Motor club tracking",
      icon: Building2,
      eyebrow: "Contract work",
      copy:
        "Work club jobs with clearer visibility into volume, payout, and contract value instead of treating them like mystery margin.",
      bullets: [
        "Track club-facing jobs inside the same board as direct calls",
        "Keep contract workflows visible to dispatch and leadership",
        "Understand which relationships are worth the operational load",
      ],
      panel: <MotorClubPreview />,
    },
    {
      id: "support",
      title: "Support assistant",
      icon: LifeBuoy,
      eyebrow: "Help flow",
      copy:
        "Give operators a lightweight path to troubleshoot and escalate issues without leaving the workspace or hunting for support contact details.",
      bullets: [
        "Present quick fixes for common operator issues",
        "Escalate unresolved problems into a support ticket path",
        "Keep support available from inside the working screen",
      ],
      panel: <SupportPreview />,
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0B1220] font-sans text-slate-200">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B1220]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:flex-nowrap">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FACC15] shadow-[0_0_20px_rgba(250,204,21,0.35)]">
              <Truck className="h-[18px] w-[18px] text-black" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Hooked</span>
          </Link>
          <div className="order-3 flex w-full items-center justify-center gap-4 text-xs font-medium text-slate-400 sm:text-sm lg:order-none lg:w-auto lg:gap-6">
            <Link to="/" className="transition-colors hover:text-white">Back to Home</Link>
            <a href="#walkthrough" className="transition-colors hover:text-white">Product Walkthrough</a>
            <a href="#video" className="hidden transition-colors hover:text-white sm:inline">Video</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/apply"
              onClick={() => track("start_trial_click", { location: "demo_nav" })}
              className="rounded-xl bg-[#FACC15] px-4 py-2 text-sm font-bold text-black shadow-[0_4px_14px_0_rgba(250,204,21,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#EAB308] hover:shadow-[0_8px_28px_0_rgba(250,204,21,0.35)]"
            >
              <span className="hidden sm:inline">Start 30-day trial</span>
              <span className="sm:hidden">Start Trial</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(250,204,21,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(250,204,21,0.12) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
          <div className="absolute inset-x-0 top-0 h-[520px] bg-[linear-gradient(180deg,rgba(250,204,21,0.14),rgba(14,165,233,0.06)_38%,transparent_78%)]" />
        </div>

        <section className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:pt-24">
          <div>
            <DemoEyebrow>Free product walkthrough</DemoEyebrow>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.03] tracking-tight text-white sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-[#FACC15] via-amber-300 to-[#FACC15] bg-clip-text text-transparent">
                See Hooked work
              </span>
              <br />
              before your team logs in.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
              A concise walkthrough for tow owners, dispatchers, and drivers. See how calls become jobs,
              how trucks get assigned, and how the office keeps customers, billing, and performance under control.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#video"
                onClick={() => track("watch_demo_click", { location: "hero" })}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FACC15] px-6 py-3.5 text-sm font-bold text-black shadow-[0_4px_14px_0_rgba(250,204,21,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#EAB308] hover:shadow-[0_8px_28px_0_rgba(250,204,21,0.4)] sm:w-auto"
              >
                <PlayCircle className="h-4 w-4" />
                Watch the demo
              </a>
              <Link
                to="/apply"
                onClick={() => track("start_trial_click", { location: "demo_hero" })}
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 sm:w-auto"
              >
                Start your free trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="mt-7 grid max-w-xl grid-cols-1 gap-3 min-[440px]:grid-cols-3">
              {[
                ["45-75 sec", "video format"],
                ["3 roles", "owner, dispatch, driver"],
                ["No fluff", "real workflows"],
              ].map(([value, label]) => (
                <div key={value} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-sm font-bold text-white">{value}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-white/10 bg-[#07111f]/95 p-3 shadow-[0_32px_100px_-36px_rgba(250,204,21,0.45)]">
              <div className="rounded-[1.55rem] border border-white/10 bg-[#0B1220] p-4 sm:p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="rounded-full border border-[#FACC15]/20 bg-[#FACC15]/10 px-3 py-1 text-[11px] font-semibold text-[#FACC15]">
                    Live product flow
                  </div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-3">
                    {[
                      ["Parsed job", "F-150, flat tire, I-24 exit 8", "Ready"],
                      ["Closest truck", "Maya R. - 8 min ETA", "Assign"],
                      ["Customer link", "Tracking text queued", "Send"],
                    ].map(([label, detail, action]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-white">{label}</div>
                          <span className="rounded-full bg-[#FACC15]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#FACC15]">
                            {action}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-400">{detail}</div>
                      </div>
                    ))}
                  </div>
                  <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-white/10 bg-[#101a2c]">
                    <div
                      className="absolute inset-0 opacity-60"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                        backgroundSize: "30px 30px",
                      }}
                    />
                    <div className="absolute left-[18%] top-[22%] rounded-full bg-[#FACC15] p-2 text-black shadow-[0_0_28px_rgba(250,204,21,0.45)]">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div className="absolute right-[18%] top-[44%] rounded-full bg-sky-400 p-2 text-black shadow-[0_0_24px_rgba(56,189,248,0.35)]">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-[#07111f]/90 p-4 backdrop-blur">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-white">Priority tow assigned</div>
                          <div className="mt-1 text-xs text-slate-400">Customer ETA visible in tracking view</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-[#FACC15]">8m</div>
                          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">ETA</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="video" className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-[2rem] border border-white/10 bg-[#07111f] p-4 shadow-[0_32px_100px_-36px_rgba(250,204,21,0.45)] sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Video overview</div>
                <div className="mt-1 text-lg font-semibold text-white">Hooked product walkthrough</div>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-slate-300">
                45-75 second format
              </div>
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#0B1220] shadow-[0_24px_70px_-40px_rgba(0,0,0,0.9)]">
                <video
                  className="h-full w-full bg-[#0B1220] object-cover"
                  src="/videos/hooked-product-demo.webm"
                  poster="/videos/hooked-product-demo-poster.png"
                  controls
                  autoPlay={false}
                  playsInline
                  muted
                  loop
                  preload="metadata"
                >
                  Your browser does not support embedded video. {""}
                  <a href="/videos/hooked-product-demo.webm" className="text-[#FACC15] underline">
                    Download the Hooked product demo
                  </a>
                  .
                </video>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">What the video should cover</div>
                <div className="mt-4 space-y-3">
                  {[
                    "How an inbound call becomes a clean dispatch-ready job",
                    "How dispatch sees the live queue, map, and driver readiness",
                    "How drivers work the job without office back-and-forth",
                    "How customers get tracking and text updates",
                    "How the job closes into billing and operator visibility",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FACC15]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <Link
                  to="/apply"
                  onClick={() => track("start_trial_click", { location: "demo_video_sidebar" })}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#FACC15] hover:underline"
                >
                  Start your free trial <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="proof" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <DemoEyebrow>Proof in action</DemoEyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Real surfaces from the live product
            </h2>
            <p className="mt-4 text-slate-400">
              Screens pulled straight from Hooked — the dispatch board, the driver&apos;s mobile view, live customer tracking, and clean billing.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {[
              {
                src: "/screenshots/landing-demo-section.png",
                caption: "Dispatch board",
                detail: "Live queue, map, and one-tap driver assignment.",
              },
              {
                src: "/screenshots/demo-static-start.png",
                caption: "Driver mobile",
                detail: "Road-ready job view with status, photos, and signature.",
              },
              {
                src: "/screenshots/live-landing-demo-section.png",
                caption: "Live tracking",
                detail: "Customers follow their truck with live ETA updates.",
              },
              {
                src: "/screenshots/demo-static-54s.png",
                caption: "Billing",
                detail: "Jobs close into clean invoices and paid status.",
              },
            ].map((shot) => (
              <figure
                key={shot.src}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B1220] shadow-[0_24px_70px_-44px_rgba(0,0,0,0.9)]"
              >
                <div className="aspect-video overflow-hidden bg-[#07111f]">
                  <img
                    src={shot.src}
                    alt={`Hooked ${shot.caption} screenshot`}
                    loading="lazy"
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <figcaption className="flex items-start gap-3 border-t border-white/10 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FACC15]" />
                  <div>
                    <div className="text-sm font-semibold text-white">{shot.caption}</div>
                    <div className="text-xs text-slate-400">{shot.detail}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="roles" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <DemoEyebrow>By role</DemoEyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              One platform, shaped around how each team member actually works
            </h2>
            <p className="mt-4 text-slate-400">
              Owners, dispatchers, and drivers all work from the same operating system, but each role gets a surface designed for its job.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <RoleCard
              icon={BarChart3}
              title="Owner / operator"
              text="Watch performance, revenue, response-time pressure, and company health without calling the office for a verbal recap."
              bullets={["Command-center metrics", "Operational bottlenecks", "Revenue visibility"]}
            />
            <RoleCard
              icon={Navigation}
              title="Dispatcher"
              text="Run the board, keep calls moving, and match the right truck with less manual coordination and fewer dropped details."
              bullets={["Live queue + map", "Assignment flow", "Customer comms in context"]}
            />
            <RoleCard
              icon={Smartphone}
              title="Driver"
              text="Open the current job, navigate, update status, capture proof, and request help from one simple road-ready interface."
              bullets={["Large tap targets", "Photo + signature flow", "Backup request path"]}
            />
          </div>
        </section>

        <section id="walkthrough" className="border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <DemoEyebrow>Product walkthrough</DemoEyebrow>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                A deeper look at the operational layers inside Hooked
              </h2>
              <p className="mt-4 text-slate-400">
                Each section below explains one part of the system the way a towing company owner would evaluate it before rolling it out to the team.
              </p>
            </div>

            <div className="mt-12 space-y-6">
              {modules.map((module) => (
                <WalkthroughSection key={module.id} {...module} />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="relative overflow-hidden rounded-3xl border border-[#FACC15]/20 bg-[linear-gradient(135deg,rgba(250,204,21,0.14),rgba(255,255,255,0.05)_44%,rgba(14,165,233,0.08))] p-8 shadow-[0_28px_90px_-46px_rgba(250,204,21,0.5)] sm:p-12">
            <div className="relative mx-auto max-w-3xl text-center">
              <DemoEyebrow>Next step</DemoEyebrow>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Ready to see whether Hooked fits your operation?
              </h2>
              <p className="mt-4 text-slate-400">
                Start the 30-day trial or request access and we will help you get the core dispatch workflow live first.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/apply"
                  onClick={() => track("start_trial_click", { location: "demo_footer" })}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#FACC15] px-6 py-3.5 text-sm font-bold text-black shadow-[0_4px_14px_0_rgba(250,204,21,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#EAB308] hover:shadow-[0_8px_28px_0_rgba(250,204,21,0.4)] sm:w-auto"
                >
                  Start your free trial
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 sm:w-auto"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter tone="dark" />
    </div>
  );
}

function DemoEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#FACC15]">
      {children}
    </span>
  );
}

function RoleCard({
  icon: Icon,
  title,
  text,
  bullets,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  bullets: string[];
}) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_-48px_rgba(250,204,21,0.35)] transition-all hover:-translate-y-1 hover:border-[#FACC15]/30 hover:bg-white/[0.06]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FACC15]/15 text-[#FACC15]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
      <div className="mt-5 space-y-2">
        {bullets.map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FACC15]" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WalkthroughSection({
  title,
  icon: Icon,
  eyebrow,
  copy,
  bullets,
  panel,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  copy: string;
  bullets: string[];
  panel: ReactNode;
}) {
  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-[#0F1A2E] p-5 shadow-[0_22px_80px_-58px_rgba(0,0,0,0.9)] transition-colors hover:border-white/20 sm:p-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{eyebrow}</div>
        <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FACC15]/15 text-[#FACC15]">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mt-5 text-2xl font-bold text-white">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{copy}</p>
        <div className="mt-6 space-y-3">
          {bullets.map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm text-slate-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FACC15]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
      <div>{panel}</div>
    </div>
  );
}

function PreviewShell({
  title,
  status = "Live preview",
  children,
}: {
  title: string;
  status?: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B1220] shadow-[0_18px_60px_-30px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </div>
        <span className="text-xs font-medium text-slate-400">{title}</span>
        <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-400">
          {status}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function OwnerPreview() {
  return (
    <PreviewShell title="Owner console">
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Jobs booked", value: "186", icon: Gauge },
          { label: "Missed calls recovered", value: "27", icon: Phone },
          { label: "Avg response", value: "11 min", icon: Timer },
          { label: "Est. monthly revenue", value: "$84.2k", icon: BarChart3 },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <card.icon className="h-4 w-4 text-[#FACC15]" />
            <div className="mt-3 text-2xl font-extrabold text-white">{card.value}</div>
            <div className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">{card.label}</div>
          </div>
        ))}
      </div>
    </PreviewShell>
  );
}

function DispatchPreview() {
  const jobs = [
    { name: "Amanda Reyes", meta: "Tow · I-280 N", badge: "Urgent", cls: "border-red-400/20 bg-red-400/10 text-red-400" },
    { name: "Marcus Lee", meta: "Tire · Hwy 101", badge: "Assigned", cls: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400" },
    { name: "Devon Park", meta: "Lockout · Market St", badge: "Standard", cls: "border-white/10 bg-white/[0.03] text-slate-300" },
  ];
  return (
    <PreviewShell title="Dispatch board">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-2">
          {jobs.map((job) => (
            <div key={job.name} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">{job.name}</div>
                <div className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${job.cls}`}>
                  {job.badge}
                </div>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">{job.meta}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/10 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:24px_24px] bg-[#0F1A2E] p-4">
          <div className="flex h-full min-h-[200px] flex-col justify-between">
            <div className="flex items-start gap-2 rounded-xl border border-[#FACC15]/30 bg-[#FACC15]/[0.06] p-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#FACC15]" />
              <p className="text-[11px] text-slate-300">
                Best match: Sara P. in truck T-12 is 1.2 miles out with a 6-minute ETA.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["T-07", "T-12", "T-03"].map((truck, i) => (
                <div key={truck} className="rounded-xl bg-white/[0.05] px-3 py-4 text-center text-xs font-semibold text-white">
                  {truck}
                  <div className="mt-1 text-[10px] text-slate-500">{i === 1 ? "closest" : "live"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PreviewShell>
  );
}

function DriverPreview() {
  return (
    <PreviewShell title="Driver app">
      <div className="mx-auto max-w-[270px] rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Current job</div>
        <div className="mt-2 text-base font-bold text-white">Tow · I-280 N, mile 42</div>
        <div className="mt-1 text-xs text-slate-400">Amanda Reyes · 4 min out</div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            { icon: Phone, label: "Call customer" },
            { icon: Navigation, label: "Navigate" },
            { icon: MessageSquare, label: "Send tracker" },
            { icon: Camera, label: "Add photos" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-white/10 bg-[#0B1220] px-3 py-3 text-center">
              <item.icon className="mx-auto h-4 w-4 text-[#FACC15]" />
              <div className="mt-2 text-[11px] font-medium text-slate-300">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-center text-[11px] font-semibold text-emerald-400">
          Status flow, proof, and updates in one screen
        </div>
      </div>
    </PreviewShell>
  );
}

function AiPreview() {
  return (
    <PreviewShell title="Dispatch assist">
      <div className="space-y-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Messy notes</div>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            “Amanda on I-280 northbound silver Tahoe won’t start needs tow asap near marker 42”
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { label: "Service", value: "Tow" },
            { label: "Vehicle", value: "Silver Tahoe" },
            { label: "Priority", value: "Urgent" },
            { label: "Location", value: "I-280 N · Mile 42" },
          ].map((field) => (
            <div key={field.label} className="rounded-xl border border-[#FACC15]/20 bg-[#FACC15]/[0.05] p-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{field.label}</div>
              <div className="mt-1 text-sm font-semibold text-white">{field.value}</div>
            </div>
          ))}
        </div>
      </div>
    </PreviewShell>
  );
}

function TrackingPreview() {
  return (
    <PreviewShell title="Customer tracking">
      <div className="grid gap-4 sm:grid-cols-[1fr_0.8fr]">
        <div className="relative min-h-[220px] overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:24px_24px] bg-[#0F1A2E]">
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <line x1="15%" y1="75%" x2="78%" y2="22%" stroke="#FACC15" strokeWidth="2" strokeDasharray="6 6" />
          </svg>
          <div className="absolute left-[15%] top-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FACC15] p-2">
            <Truck className="h-4 w-4 text-black" />
          </div>
          <div className="absolute left-[78%] top-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-400 p-2">
            <MapPin className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Customer view</div>
          <div className="mt-4 text-3xl font-extrabold text-white">6 min</div>
          <div className="mt-1 text-xs text-slate-400">Sara P. in truck T-12 is on the way</div>
          <div className="mt-4 rounded-lg bg-[#FACC15]/10 px-3 py-2 text-[11px] text-[#FACC15]">
            Live ETA and status without calling the office
          </div>
        </div>
      </div>
    </PreviewShell>
  );
}

function UpdatesPreview() {
  return (
    <PreviewShell title="Customer updates">
      <div className="space-y-3">
        {[
          { label: "ETA update", text: "Your Hooked driver is 6 minutes away in truck T-12." },
          { label: "Review request", text: "Thanks for choosing us. If we helped, would you leave a quick review?" },
          { label: "Payment reminder", text: "Your tow is complete. We can help you wrap up the remaining balance." },
        ].map((msg) => (
          <div key={msg.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{msg.label}</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{msg.text}</p>
          </div>
        ))}
      </div>
    </PreviewShell>
  );
}

function AlertsPreview() {
  return (
    <PreviewShell title="Ops alerts">
      <div className="space-y-3">
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-400">
            <ShieldAlert className="h-4 w-4" /> Unassigned for 6 min
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-300">
            Amanda Reyes on I-280 is approaching the response threshold and needs an assignment.
          </p>
        </div>
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
            <Bell className="h-4 w-4" /> Long on-scene time
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-300">
            Truck T-03 has been on scene longer than expected and may need dispatcher follow-up.
          </p>
        </div>
      </div>
    </PreviewShell>
  );
}

function BillingPreview() {
  return (
    <PreviewShell title="Billing workflow">
      <div className="space-y-2">
        {[
          { id: "INV-1047", amount: "$185.00", state: "Paid" },
          { id: "INV-1048", amount: "$95.00", state: "Due" },
          { id: "INV-1049", amount: "$240.00", state: "Paid" },
        ].map((row) => (
          <div key={row.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#FACC15]" />
              <div>
                <div className="text-sm font-semibold text-white">{row.id}</div>
                <div className="text-[10px] text-slate-500">Built from completed tow</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-white">{row.amount}</div>
              <div className={`text-[10px] font-semibold uppercase ${row.state === "Paid" ? "text-emerald-400" : "text-amber-300"}`}>
                {row.state}
              </div>
            </div>
          </div>
        ))}
      </div>
    </PreviewShell>
  );
}

function ImpoundPreview() {
  return (
    <PreviewShell title="Impound management">
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Vehicles in lot", value: "34" },
          { label: "Pending releases", value: "6" },
          { label: "Storage exposure", value: "$4,820" },
          { label: "Paperwork ready", value: "12" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{card.label}</div>
            <div className="mt-2 text-2xl font-extrabold text-white">{card.value}</div>
          </div>
        ))}
      </div>
    </PreviewShell>
  );
}

function MotorClubPreview() {
  return (
    <PreviewShell title="Motor club tracking">
      <div className="space-y-2">
        {[
          { club: "Agero", jobs: "42 jobs", note: "Strong volume this week" },
          { club: "Allstate", jobs: "18 jobs", note: "Watching margin" },
          { club: "GEICO", jobs: "24 jobs", note: "Steady demand" },
        ].map((row) => (
          <div key={row.club} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">{row.club}</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{row.jobs}</div>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">{row.note}</div>
          </div>
        ))}
      </div>
    </PreviewShell>
  );
}

function SupportPreview() {
  return (
    <PreviewShell title="Support assistant">
      <div className="space-y-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Bot className="h-4 w-4 text-[#FACC15]" /> Hooked help
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-300">
            “Map is not loading” suggests likely fixes and keeps the operator inside the workflow.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <LifeBuoy className="h-4 w-4 text-[#FACC15]" /> Escalate if needed
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-300">
            If the fix does not work, the operator can send a support ticket with the page and issue context attached.
          </p>
        </div>
      </div>
    </PreviewShell>
  );
}
