import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Truck, MapPin, Loader2, CheckCircle2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import type { JobType } from "../lib/seed-data";
import { submitPublicRequest } from "@/lib/public-request.functions";
import { PublicFooter } from "@/components/public-footer";
import { safePublicError } from "@/lib/public-errors";

const requestHead = ({ params }: { params: { companyId: string } }) => ({
  meta: [
    { title: "Request Tow Service — Hooked" },
    {
      name: "description",
      content: "Request roadside or tow service. A driver will be assigned shortly.",
    },
    { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
    { name: "robots", content: "noindex, nofollow" },
    { property: "og:title", content: "Request Tow Service — Hooked" },
    {
      property: "og:description",
      content: "Request roadside or tow service. A driver will be assigned shortly.",
    },
    { property: "og:url", content: `https://hookaidashboard.com/request/${params.companyId}` },
  ],
});

export const Route = createFileRoute("/request/$companyId")({
  ssr: false,
  head: requestHead,
  component: RequestPage,
});

const SERVICE_TYPES: { value: JobType; label: string }[] = [
  { value: "Tow", label: "Tow" },
  { value: "Lockout", label: "Lockout" },
  { value: "Jumpstart", label: "Jumpstart" },
  { value: "Tire", label: "Flat Tire" },
  { value: "Winch", label: "Winch / Recovery" },
];

function RequestPage() {
  const { companyId } = Route.useParams();
  const submitRequest = useServerFn(submitPublicRequest);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loadingCo, setLoadingCo] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [type, setType] = useState<JobType | "Other">("Tow");
  const [notes, setNotes] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await (supabase.rpc as any)("get_public_company", { _id: companyId });
        if (!alive) return;
        if (error || !data) setCompanyName(null);
        else setCompanyName(data as string);
      } finally {
        if (alive) setLoadingCo(false);
      }
    })();
    return () => { alive = false; };
  }, [companyId]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setErr("Location not supported on this device.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        setLocation(`GPS ${lat}, ${lng}`);
        setGeoLoading(false);
      },
      (e) => {
        setErr(e.message || "Could not get location.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim() || !phone.trim() || !location.trim()) {
      setErr("Please fill in your name, phone, and location.");
      return;
    }
    setSubmitting(true);
    try {
      await submitRequest({
        data: {
          companyId,
          name: name.trim(),
          phone: phone.trim(),
          location: location.trim(),
          year: year ? Number(year) || null : null,
          make: make.trim() || null,
          model: model.trim() || null,
          type,
          notes: type === "Other" ? `Other: ${notes}`.slice(0, 600) : notes.trim().slice(0, 600),
          honeypot,
        },
      });
      setSubmitted(true);
    } catch (e: any) {
      setErr(
        safePublicError(
          "We couldn't send your request right now. Please try again in a moment.",
          e,
          "[request] submit failed",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingCo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!companyName) {
    return (
      <div className="flex min-h-screen flex-col bg-background px-4 py-10 text-foreground">
        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-sm text-center">
            <h1 className="text-xl font-semibold">Link not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This request link is invalid or has been disabled.
            </p>
          </div>
        </div>
        <div className="mx-auto mt-8 w-full max-w-md">
          <PublicFooter tone="light" />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col bg-background px-4 py-10 text-foreground">
        <Header companyName={companyName} />
        <div className="mx-auto mt-12 w-full max-w-md rounded-xl border border-success/40 bg-success/10 p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
          <h2 className="mt-3 text-lg font-semibold">Request received</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Hi {name.split(" ")[0]}, we got it. {companyName} dispatch will review the request,
            assign a driver shortly, and contact you at {phone} if needed.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3.5 w-3.5" /> Keep your phone nearby
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            If {companyName} uses text updates for this request, message and data rates may apply.
            Reply STOP to opt out of automated texts if they are enabled.
          </p>
        </div>
        <div className="mx-auto mt-8 w-full max-w-md">
          <PublicFooter tone="light" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground">
      <Header companyName={companyName} />

      <form
        onSubmit={submit}
        className="mx-auto mt-8 w-full max-w-md space-y-4 rounded-xl border border-border bg-surface p-5"
      >
        <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
          <label>
            Website
            <input
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
            />
          </label>
        </div>

        <h2 className="text-base font-semibold">Tell us what you need</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          By sending this request, you agree {companyName} may contact you about service updates
          or dispatch follow-up related to this job. Please avoid sharing sensitive personal
          information in the notes field.
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          See our{" "}
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>{" "}
          for more details on how we handle request data.
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          If {companyName} uses SMS to confirm or update this request, message and data rates may
          apply and you can reply STOP to opt out of automated texts.
        </p>

        <Field label="Full name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
            className="form-input"
            placeholder="Jane Smith"
            autoComplete="name"
          />
        </Field>

        <Field label="Phone number">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            maxLength={40}
            className="form-input"
            placeholder="(555) 123-4567"
            autoComplete="tel"
          />
        </Field>

        <Field label="Current location">
          <div className="space-y-2">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              maxLength={300}
              className="form-input"
              placeholder="Street address or nearest landmark"
            />
            <button
              type="button"
              onClick={useMyLocation}
              disabled={geoLoading}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-60"
            >
              {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              Use My Location
            </button>
          </div>
        </Field>

        <div className="grid grid-cols-3 gap-2">
          <Field label="Year">
            <input
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              className="form-input"
              placeholder="2020"
            />
          </Field>
          <Field label="Make">
            <input
              value={make}
              onChange={(e) => setMake(e.target.value)}
              maxLength={40}
              className="form-input"
              placeholder="Honda"
            />
          </Field>
          <Field label="Model">
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              maxLength={40}
              className="form-input"
              placeholder="Civic"
            />
          </Field>
        </div>

        <Field label="Service needed">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="form-input"
          >
            {SERVICE_TYPES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
            <option value="Other">Other</option>
          </select>
        </Field>

        <Field label="Additional notes (optional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={600}
            className="form-input"
            placeholder="Anything the driver should know"
          />
        </Field>

        {err && (
          <div className="rounded-md border border-urgent/40 bg-urgent/10 px-3 py-2 text-xs text-urgent">
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Request Help Now
        </button>

        <p className="text-center text-[11px] text-muted-foreground">
          By submitting, you agree {companyName} may text you about your request.
        </p>
      </form>

      <style>{`
        .form-input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: hsl(var(--foreground));
          outline: none;
        }
        .form-input:focus {
          border-color: hsl(var(--primary));
          box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
        }
      `}</style>
      <div className="mx-auto mt-8 w-full max-w-md">
        <PublicFooter tone="light" />
      </div>
    </div>
  );
}

function Header({ companyName }: { companyName: string }) {
  return (
    <div className="mx-auto flex w-full max-w-md items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Truck className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-base font-semibold tracking-tight">{companyName}</div>
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Powered by Hooked Dispatch
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}
