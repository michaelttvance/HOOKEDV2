import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Sparkles, X, Truck, DollarSign, Link2, ClipboardList, ArrowRight } from "lucide-react";
import { useDispatch, DEFAULT_PRICING } from "../lib/dispatch-store";
import { useAuth } from "../lib/use-auth";
import { cn } from "../lib/utils";

/**
 * Dismissible setup checklist shown on the dispatch board until the company
 * has completed the core onboarding steps (or dismissed it). Progress is
 * derived from live data so it stays honest.
 */
export function OnboardingChecklist({ onNewJob }: { onNewJob: () => void }) {
  const { drivers, jobs, history, pricing } = useDispatch();
  const { profile } = useAuth();
  const companyId = profile.companyId;

  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [linkShared, setLinkShared] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    setDismissed(localStorage.getItem(`hk_onboard_dismissed_${companyId}`) === "1");
    setLinkShared(localStorage.getItem(`hk_onboard_link_shared_${companyId}`) === "1");
    setReady(true);
  }, [companyId]);

  const pricingSet = JSON.stringify(pricing) !== JSON.stringify(DEFAULT_PRICING);
  const hasJobs = jobs.length > 0 || history.length > 0;

  async function copyRequestLink() {
    if (!companyId) return;
    const url = (typeof window !== "undefined" ? window.location.origin : "") + `/request/${companyId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy your tow request link", url);
    }
    setCopied(true);
    setLinkShared(true);
    localStorage.setItem(`hk_onboard_link_shared_${companyId}`, "1");
    setTimeout(() => setCopied(false), 1800);
  }

  function dismiss() {
    if (companyId) localStorage.setItem(`hk_onboard_dismissed_${companyId}`, "1");
    setDismissed(true);
  }

  const steps = [
    {
      key: "driver",
      icon: Truck,
      label: "Add your first truck & driver",
      hint: "Build your roster so you can assign jobs.",
      done: drivers.length > 0,
      action: (
        <Link to="/settings" className="onboard-action">
          Add driver <ArrowRight className="h-3 w-3" />
        </Link>
      ),
    },
    {
      key: "pricing",
      icon: DollarSign,
      label: "Set your service pricing",
      hint: "Tow, lockout, winch rates & fees — powers instant estimates.",
      done: pricingSet,
      action: (
        <Link to="/settings" className="onboard-action">
          Set pricing <ArrowRight className="h-3 w-3" />
        </Link>
      ),
    },
    {
      key: "link",
      icon: Link2,
      label: "Share your tow request link",
      hint: "Put it on your site or text it — requests land on your board.",
      done: linkShared,
      action: (
        <button onClick={copyRequestLink} className="onboard-action">
          {copied ? <Check className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
          {copied ? "Copied!" : "Copy link"}
        </button>
      ),
    },
    {
      key: "job",
      icon: ClipboardList,
      label: "Take your first job",
      hint: "Use AI quick-entry to turn a call into a dispatch-ready job.",
      done: hasJobs,
      action: (
        <button onClick={onNewJob} className="onboard-action">
          New job <ArrowRight className="h-3 w-3" />
        </button>
      ),
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;

  if (!ready || dismissed || doneCount === steps.length) return null;

  return (
    <div className="shrink-0 border-b border-primary/20 bg-primary/[0.06] px-4 py-3 sm:px-5">
      <style>{`.onboard-action{display:inline-flex;align-items:center;gap:4px;border-radius:6px;border:1px solid var(--color-primary,rgba(250,204,21,.5));padding:4px 10px;font-size:11px;font-weight:600;color:var(--color-primary,#FACC15);white-space:nowrap}.onboard-action:hover{background:rgba(250,204,21,.12)}`}</style>
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Finish setting up Hooked</span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
              {doneCount}/{steps.length}
            </span>
          </div>
          <button
            onClick={dismiss}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/60">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.key}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border p-2.5",
                s.done ? "border-success/30 bg-success/5" : "border-border bg-background/40",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  s.done ? "bg-success text-success-foreground" : "bg-primary/15 text-primary",
                )}
              >
                {s.done ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className={cn("text-xs font-semibold", s.done && "text-muted-foreground line-through")}>
                  {s.label}
                </div>
                {!s.done && (
                  <>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{s.hint}</p>
                    <div className="mt-1.5">{s.action}</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
