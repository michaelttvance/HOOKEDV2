import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Truck, Loader2, CheckCircle2 } from "lucide-react";
import { submitApplication } from "@/lib/applications.functions";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const applyHead = () => ({
  meta: [
    { title: "Start your 30-day trial — Hooked" },
    {
      name: "description",
      content:
        "Start your 30-day Hooked trial or request a personalized demo. Tell us about your towing business and our team will follow up.",
    },
    { property: "og:title", content: "Start your 30-day trial — Hooked" },
    {
      property: "og:description",
      content:
        "Tell us about your towing business and we'll help you get set up. Our team typically responds within one business day.",
    },
  ],
});

export const Route = createFileRoute("/apply")({
  head: applyHead,
  component: ApplyPage,
});

type FormState = {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  cityState: string;
  truckCount: "1-2" | "3-5" | "6-10" | "10+" | "";
  currentSoftware: "No" | "Yes — Dispatch software" | "Yes — Other" | "";
  softwareComplaints: string;
  heardFrom:
    | "Facebook Group"
    | "Google"
    | "Friend/Referral"
    | "Towing Association"
    | "Other"
    | "";
  biggestChallenge: string;
  billingPreference: "Monthly" | "Annual" | "Not sure yet" | "";
};

const empty: FormState = {
  fullName: "",
  businessName: "",
  email: "",
  phone: "",
  cityState: "",
  truckCount: "",
  currentSoftware: "",
  softwareComplaints: "",
  heardFrom: "",
  biggestChallenge: "",
  billingPreference: "",
};

function ApplyPage() {
  const submit = useServerFn(submitApplication);
  const [f, setF] = useState<FormState>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Page view only — do NOT fire signup_started here (that event should
    // represent an actual signup intent, not a passive landing on this form).
    track("apply_page_view");
  }, []);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setF((p) => ({ ...p, [k]: v }));
  }

  const attribution = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        utmSource: "",
        utmMedium: "",
        utmCampaign: "",
        utmContent: "",
        landingPath: "",
        referrer: "",
      };
    }
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get("utm_source") ?? "",
      utmMedium: params.get("utm_medium") ?? "",
      utmCampaign: params.get("utm_campaign") ?? "",
      utmContent: params.get("utm_content") ?? "",
      landingPath: `${window.location.pathname}${window.location.search}`,
      referrer: document.referrer,
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (
      !f.fullName ||
      !f.businessName ||
      !f.email ||
      !f.phone ||
      !f.cityState ||
      !f.truckCount ||
      !f.currentSoftware ||
      !f.heardFrom ||
      !f.billingPreference
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    // Fire signup_started on a genuine submit attempt (real intent), not on page view.
    track("signup_started");
    try {
      await submit({
        data: {
          fullName: f.fullName,
          businessName: f.businessName,
          email: f.email,
          phone: f.phone,
          cityState: f.cityState,
          truckCount: f.truckCount,
          currentSoftware: f.currentSoftware,
          softwareComplaints: f.softwareComplaints,
          heardFrom: f.heardFrom,
          biggestChallenge: f.biggestChallenge,
          billingPreference: f.billingPreference,
          ...attribution,
        },
      });
      setDone(true);
    } catch {
      // Never surface raw server/internal errors to applicants.
      setError(
        "We couldn't process your request right now. Please try again, or contact our team at mike@hookaidashboard.com.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="mx-auto max-w-xl px-4 py-16 text-center sm:py-24">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Thanks — we've received your request
          </h1>
          <p className="mt-3 text-muted-foreground">
            A member of our team will review your details and reach out, typically within one
            business day. There's no obligation, and you're not committing to anything by
            submitting this form.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">— The Hooked Team</p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Back to home
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Start your 30-day trial
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
            Tell us about your towing operation and we'll help you get set up — or, if you'd
            prefer, request a personalized demo first. Either way, our team typically responds
            within one business day.
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-border bg-surface/40 p-4 text-sm text-muted-foreground sm:p-5">
          <p className="font-medium text-foreground">What happens after you submit</p>
          <ul className="mt-2 space-y-1.5">
            <li>• A member of our team reviews your details and reaches out — usually within one business day.</li>
            <li>• We'll answer your questions and, when you're ready, walk you through getting started.</li>
            <li>• There's no obligation. Submitting this form doesn't commit you to a contract or purchase.</li>
          </ul>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-xl border border-border bg-surface/60 p-6 sm:p-8"
        >
          <Row>
            <Field label="Full name" required>
              <input
                className={inputCls}
                value={f.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                maxLength={200}
                required
              />
            </Field>
            <Field label="Business name" required>
              <input
                className={inputCls}
                value={f.businessName}
                onChange={(e) => set("businessName", e.target.value)}
                maxLength={200}
                required
              />
            </Field>
          </Row>

          <Row>
            <Field label="Email" required>
              <input
                type="email"
                className={inputCls}
                value={f.email}
                onChange={(e) => set("email", e.target.value)}
                maxLength={320}
                required
              />
            </Field>
            <Field label="Phone" required>
              <input
                type="tel"
                className={inputCls}
                value={f.phone}
                onChange={(e) => set("phone", e.target.value)}
                maxLength={40}
                required
              />
            </Field>
          </Row>

          <Field label="City and state" required>
            <input
              className={inputCls}
              value={f.cityState}
              onChange={(e) => set("cityState", e.target.value)}
              placeholder="e.g. Austin, TX"
              maxLength={200}
              required
            />
          </Field>

          <Row>
            <Field label="How many trucks do you operate?" required>
              <select
                className={inputCls}
                value={f.truckCount}
                onChange={(e) => set("truckCount", e.target.value as FormState["truckCount"])}
                required
              >
                <option value="">Select…</option>
                <option>1-2</option>
                <option>3-5</option>
                <option>6-10</option>
                <option>10+</option>
              </select>
            </Field>
            <Field label="Do you currently use dispatch software?" required>
              <select
                className={inputCls}
                value={f.currentSoftware}
                onChange={(e) =>
                  set("currentSoftware", e.target.value as FormState["currentSoftware"])
                }
                required
              >
                <option value="">Select…</option>
                <option>No</option>
                <option>Yes — Dispatch software</option>
                <option>Yes — Other</option>
              </select>
            </Field>
          </Row>

          <Field label="If yes, what's your biggest frustration with your current software?">
            <textarea
              className={cn(inputCls, "min-h-[88px] resize-y")}
              value={f.softwareComplaints}
              onChange={(e) => set("softwareComplaints", e.target.value)}
              maxLength={2000}
            />
          </Field>

          <Field label="How did you hear about Hooked?" required>
            <select
              className={inputCls}
              value={f.heardFrom}
              onChange={(e) => set("heardFrom", e.target.value as FormState["heardFrom"])}
              required
            >
              <option value="">Select…</option>
              <option>Facebook Group</option>
              <option>Google</option>
              <option>Friend/Referral</option>
              <option>Towing Association</option>
              <option>Other</option>
            </select>
          </Field>

          <Field label="What's your biggest dispatch challenge right now?">
            <textarea
              className={cn(inputCls, "min-h-[88px] resize-y")}
              value={f.biggestChallenge}
              onChange={(e) => set("biggestChallenge", e.target.value)}
              maxLength={2000}
            />
          </Field>

          <Field label="Are you interested in monthly or annual billing?" required>
            <select
              className={inputCls}
              value={f.billingPreference}
              onChange={(e) =>
                set("billingPreference", e.target.value as FormState["billingPreference"])
              }
              required
            >
              <option value="">Select…</option>
              <option>Monthly</option>
              <option>Annual</option>
              <option>Not sure yet</option>
            </select>
          </Field>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit request
          </button>
          <p className="text-center text-xs text-muted-foreground">
            We'll review your details and follow up, typically within one business day.
          </p>
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            By submitting this form you consent to be contacted by Hooked about your request.
            Your information is handled in line with our privacy practices and is not sold.
            Submitting a request does not guarantee acceptance and does not create a contract
            or obligation for either party. Trials are subject to our Terms of Service.
          </p>
        </form>
      </main>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-primary">*</span>}
      </span>
      {children}
    </label>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}

function Header() {
  return (
    <header className="border-b border-border bg-surface/60 px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Truck className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Hooked</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Dispatch
            </div>
          </div>
        </Link>
        <Link
          to="/"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Back to home
        </Link>
      </div>
    </header>
  );
}
