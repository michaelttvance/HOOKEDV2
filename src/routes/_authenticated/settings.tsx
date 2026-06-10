import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Save, Link2, Check, Smartphone, ArrowLeft, DollarSign, RotateCcw, Pencil, Mail, Inbox } from "lucide-react";
import { useDispatch, type SmsTemplates, type PricingConfig, DEFAULT_PRICING } from "../../lib/dispatch-store";
import { useAuth } from "../../lib/use-auth";
import { supabase } from "../../integrations/supabase/client";
import { cn } from "../../lib/utils";

const INBOUND_DOMAIN = "inbound.hookaidashboard.com";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Hooked" }] }),
  component: SettingsPage,
});

const PLACEHOLDERS: Record<keyof SmsTemplates, string[]> = {
  assigned: ["{name}", "{driver}", "{truck}", "{eta}", "{phone}", "{company}"],
  on_scene: ["{name}", "{driver}", "{company}"],
  complete: ["{name}", "{amount}", "{company}"],
};

const LABELS: Record<keyof SmsTemplates, { title: string; sub: string }> = {
  assigned: { title: "On assignment", sub: "Sent when dispatcher assigns a driver." },
  on_scene: { title: "On scene", sub: "Sent when the driver marks On Scene." },
  complete: { title: "On complete", sub: "Sent when the job is marked Complete." },
};

const SERVICE_LABELS: Record<keyof PricingConfig["base"], string> = {
  Tow: "Tow (hook fee)",
  Lockout: "Lockout (flat)",
  Jumpstart: "Jumpstart (flat)",
  Tire: "Flat Tire (flat)",
  Winch: "Winch / Recovery (hook fee)",
  Other: "Other (flat)",
};

const FEE_LABELS: Record<keyof PricingConfig["fees"], string> = {
  oversized: "Oversized vehicle (RV, semi, lifted)",
  hazmat: "Hazmat / fluid cleanup",
  longWait: "Long wait (30+ min)",
  secondTruck: "Second truck required",
  highway: "Highway / freeway service",
  storage: "Storage (per day)",
};

function SettingsPage() {
  const { smsTemplates, updateSmsTemplates, pricing, updatePricing, companyName, googleReviewUrl, updateGoogleReviewUrl } = useDispatch();
  const { profile } = useAuth();
  const [draft, setDraft] = useState<SmsTemplates>(smsTemplates);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inboundCopied, setInboundCopied] = useState(false);
  const [reviewUrlDraft, setReviewUrlDraft] = useState(googleReviewUrl);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);

  const inboundCodeQ = useQuery({
    queryKey: ["inbound-email-code", profile.companyId],
    enabled: !!profile.companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("inbound_email_code")
        .eq("id", profile.companyId!)
        .maybeSingle();
      if (error) throw error;
      return (data as { inbound_email_code: string | null } | null)?.inbound_email_code ?? null;
    },
  });
  const inboundAddress = inboundCodeQ.data
    ? `dispatch-${inboundCodeQ.data}@${INBOUND_DOMAIN}`
    : "";

  async function copyInbound() {
    if (!inboundAddress) return;
    try {
      await navigator.clipboard.writeText(inboundAddress);
      setInboundCopied(true);
      setTimeout(() => setInboundCopied(false), 1800);
    } catch {
      window.prompt("Copy this address", inboundAddress);
    }
  }

  useEffect(() => { setDraft(smsTemplates); }, [smsTemplates]);
  useEffect(() => { setReviewUrlDraft(googleReviewUrl); }, [googleReviewUrl]);

  async function saveReviewUrl() {
    setReviewSaving(true);
    try {
      await updateGoogleReviewUrl(reviewUrlDraft.trim());
      setReviewSaved(true);
      setTimeout(() => setReviewSaved(false), 2000);
    } finally {
      setReviewSaving(false);
    }
  }

  const requestUrl =
    typeof window !== "undefined" && profile.companyId
      ? `${window.location.origin}/request/${profile.companyId}`
      : "";

  async function save() {
    setSaving(true);
    try {
      await updateSmsTemplates(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    if (!requestUrl) return;
    try {
      await navigator.clipboard.writeText(requestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link", requestUrl);
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/dashboard" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Back to dispatch
            </Link>
            <h1 className="text-xl font-semibold">Settings</h1>
            <p className="text-xs text-muted-foreground">{companyName}</p>
          </div>
        </div>

        {/* Public request link */}
        <section className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-2 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Customer request link</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this URL on your website, Google Business profile, or text it to customers — they
            submit a request and it lands on your dispatch board instantly.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              readOnly
              value={requestUrl}
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </section>

        {/* Inbound email-to-dispatch */}
        <section className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-2 flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Email-to-dispatch</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Give this address to motor clubs, body shops, or anyone who dispatches by email.
            Incoming emails are parsed by AI and auto-create jobs on your board. View parsed
            emails on the{" "}
            <Link to="/inbound-emails" className="text-primary hover:underline">
              inbound email log
            </Link>
            .
          </p>
          <div className="mt-3 flex gap-2">
            <input
              readOnly
              value={inboundAddress}
              placeholder={inboundCodeQ.isLoading ? "Loading…" : ""}
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              onClick={copyInbound}
              disabled={!inboundAddress}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {inboundCopied ? <Check className="h-4 w-4" /> : <Inbox className="h-4 w-4" />}
              {inboundCopied ? "Copied!" : "Copy"}
            </button>
          </div>
        </section>

        {/* Reputation */}
        <section className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-2 flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Reputation</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste your Google review link. After a non-urgent job is completed, we'll text the
            customer 30 minutes later asking for a review. Leave blank to disable.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="url"
              value={reviewUrlDraft}
              onChange={(e) => setReviewUrlDraft(e.target.value)}
              placeholder="https://g.page/r/..."
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
            />
            <button
              onClick={saveReviewUrl}
              disabled={reviewSaving}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
                reviewSaved ? "bg-success/15 text-success" : "bg-primary text-primary-foreground hover:bg-primary/90",
                reviewSaving && "opacity-60",
              )}
            >
              {reviewSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {reviewSaved ? "Saved" : "Save"}
            </button>
          </div>
        </section>


        {/* Pricing configuration */}
        <PricingSection pricing={pricing} updatePricing={updatePricing} />

        {/* SMS templates */}
        <section className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Customer SMS templates</h2>
            </div>
            <button
              onClick={save}
              disabled={saving}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                saved ? "bg-success/15 text-success" : "bg-primary text-primary-foreground hover:bg-primary/90",
                saving && "opacity-60",
              )}
            >
              {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {saved ? "Saved" : "Save changes"}
            </button>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            These messages are sent automatically as a job progresses. Use the tokens below to
            personalize each text.
          </p>
          <div className="space-y-4">
            {(Object.keys(draft) as (keyof SmsTemplates)[]).map((k) => (
              <div key={k}>
                <div className="mb-1 flex items-baseline justify-between">
                  <div className="text-sm font-semibold">{LABELS[k].title}</div>
                  <div className="text-[10px] text-muted-foreground">{LABELS[k].sub}</div>
                </div>
                <textarea
                  rows={3}
                  value={draft[k]}
                  maxLength={500}
                  onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <div className="mt-1 flex flex-wrap gap-1">
                  {PLACEHOLDERS[k].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setDraft({ ...draft, [k]: draft[k] + " " + p })}
                      className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Twilio status */}
        <section className="rounded-lg border border-success/40 bg-success/5 p-4">
          <div className="mb-1 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-success" />
            <h2 className="text-sm font-semibold">SMS sending — Twilio connected</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Outbound texts are sent live via Twilio when jobs are assigned, on-scene, or completed.
            Each message is logged on the job's SMS history with delivery status.
          </p>
        </section>
      </div>
    </div>
  );
}

// ─────────────── Pricing section ───────────────

function PricingSection({
  pricing,
  updatePricing,
}: {
  pricing: PricingConfig;
  updatePricing: (next: PricingConfig) => Promise<void>;
}) {
  const [draft, setDraft] = useState<PricingConfig>(pricing);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => { setDraft(pricing); }, [pricing]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(pricing), [draft, pricing]);

  async function save() {
    setSaving(true);
    try {
      await updatePricing(draft);
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setDraft(DEFAULT_PRICING);
    setConfirmReset(false);
  }

  // Live example: 10-mile tow, night
  const example = useMemo(() => {
    const base = draft.base.Tow;
    const billable = Math.max(0, 10 - draft.mileage.freeMiles);
    const mileage = billable * draft.mileage.perMile;
    const night = draft.afterHours.enabled ? draft.afterHours.amount : 0;
    const total = base + mileage + night;
    return { base, mileage, night, total, billable };
  }, [draft]);

  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Pricing</h2>
        </div>
        <button
          onClick={save}
          disabled={saving || !dirty}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
            dirty
              ? "bg-warning text-warning-foreground hover:bg-warning/90"
              : savedAt && Date.now() - savedAt < 2000
                ? "bg-success/15 text-success"
                : "bg-muted text-muted-foreground",
            saving && "opacity-60",
          )}
        >
          {!dirty && savedAt && Date.now() - savedAt < 2000 ? (
            <><Check className="h-3.5 w-3.5" /> Saved</>
          ) : (
            <><Save className="h-3.5 w-3.5" /> {dirty ? "Save changes" : "No changes"}</>
          )}
        </button>
      </div>

      {/* Live preview */}
      <div className="mb-4 rounded-md border border-primary/30 bg-primary/5 p-3">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary">Live preview</div>
        <div className="text-xs text-muted-foreground">
          Example job: 10-mile tow at night ={" "}
          <span className="text-foreground">
            ${example.base.toFixed(0)} hook + ${example.mileage.toFixed(2)} mileage
            {example.night > 0 && <> + ${example.night.toFixed(0)} after hours</>}
          </span>{" "}
          = <span className="font-bold text-foreground">${example.total.toFixed(2)} estimated</span>
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">
          ({example.billable} billable miles after {draft.mileage.freeMiles} free)
        </div>
      </div>

      {/* Service base rates */}
      <Group title="Service base rates">
        {(Object.keys(draft.base) as (keyof PricingConfig["base"])[]).map((k) => (
          <RateCard
            key={k}
            label={SERVICE_LABELS[k]}
            value={draft.base[k]}
            prefix="$"
            onChange={(v) => setDraft({ ...draft, base: { ...draft.base, [k]: v } })}
          />
        ))}
      </Group>

      {/* Mileage */}
      <Group title="Mileage">
        <RateCard
          label="Per mile rate"
          value={draft.mileage.perMile}
          prefix="$"
          suffix="/mi"
          step={0.25}
          onChange={(v) => setDraft({ ...draft, mileage: { ...draft.mileage, perMile: v } })}
        />
        <RateCard
          label="Free miles included in hook fee"
          value={draft.mileage.freeMiles}
          suffix=" mi"
          step={1}
          onChange={(v) => setDraft({ ...draft, mileage: { ...draft.mileage, freeMiles: Math.round(v) } })}
        />
      </Group>

      {/* Time & conditions */}
      <Group title="Time & conditions">
        <ToggleCard
          label="After-hours premium"
          enabled={draft.afterHours.enabled}
          onToggle={(b) => setDraft({ ...draft, afterHours: { ...draft.afterHours, enabled: b } })}
          value={draft.afterHours.amount}
          prefix="+$"
          onChange={(v) => setDraft({ ...draft, afterHours: { ...draft.afterHours, amount: v } })}
          extra={
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span>From</span>
              <HourInput
                value={draft.afterHours.startHour}
                onChange={(h) => setDraft({ ...draft, afterHours: { ...draft.afterHours, startHour: h } })}
              />
              <span>to</span>
              <HourInput
                value={draft.afterHours.endHour}
                onChange={(h) => setDraft({ ...draft, afterHours: { ...draft.afterHours, endHour: h } })}
              />
            </div>
          }
        />
        <ToggleCard
          label="Weekend rate"
          enabled={draft.weekend.enabled}
          onToggle={(b) => setDraft({ ...draft, weekend: { ...draft.weekend, enabled: b } })}
          value={draft.weekend.amount}
          prefix="+$"
          onChange={(v) => setDraft({ ...draft, weekend: { ...draft.weekend, amount: v } })}
        />
        <ToggleCard
          label="Holiday multiplier"
          enabled={draft.holiday.enabled}
          onToggle={(b) => setDraft({ ...draft, holiday: { ...draft.holiday, enabled: b } })}
          value={draft.holiday.multiplier}
          suffix="x"
          step={0.1}
          onChange={(v) => setDraft({ ...draft, holiday: { ...draft.holiday, multiplier: v } })}
        />
      </Group>

      {/* Extra fees */}
      <Group title="Extra fees">
        {(Object.keys(draft.fees) as (keyof PricingConfig["fees"])[]).map((k) => (
          <ToggleCard
            key={k}
            label={FEE_LABELS[k]}
            enabled={draft.fees[k].enabled}
            onToggle={(b) => setDraft({ ...draft, fees: { ...draft.fees, [k]: { ...draft.fees[k], enabled: b } } })}
            value={draft.fees[k].amount}
            prefix={k === "storage" ? "$" : "+$"}
            suffix={k === "storage" ? "/day" : undefined}
            onChange={(v) =>
              setDraft({ ...draft, fees: { ...draft.fees, [k]: { ...draft.fees[k], amount: v } } })
            }
          />
        ))}
      </Group>

      {/* Reset */}
      <div className="mt-4 border-t border-border pt-3">
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to defaults
          </button>
        ) : (
          <div className="rounded-md border border-warning/40 bg-warning/5 p-3">
            <p className="mb-2 text-xs text-foreground">
              This will reset all pricing to Hooked defaults. Are you sure?
            </p>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="rounded-md bg-warning px-3 py-1.5 text-xs font-semibold text-warning-foreground hover:bg-warning/90"
              >
                Yes, reset
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function RateCard({
  label,
  value,
  prefix,
  suffix,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  step?: number;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
      <div className="text-sm">{label}</div>
      {editing ? (
        <div className="flex items-center gap-1">
          {prefix && <span className="text-xs text-muted-foreground">{prefix}</span>}
          <input
            autoFocus
            type="number"
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
            className="w-20 rounded border border-primary bg-background px-2 py-1 text-right text-sm focus:outline-none"
          />
          {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="group flex items-center gap-1.5 rounded px-2 py-0.5 text-sm font-semibold hover:bg-accent"
        >
          <span>
            {prefix}
            {value}
            {suffix}
          </span>
          <Pencil className="h-3 w-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
        </button>
      )}
    </div>
  );
}

function ToggleCard({
  label,
  enabled,
  onToggle,
  value,
  prefix,
  suffix,
  step = 1,
  onChange,
  extra,
}: {
  label: string;
  enabled: boolean;
  onToggle: (b: boolean) => void;
  value: number;
  prefix?: string;
  suffix?: string;
  step?: number;
  onChange: (v: number) => void;
  extra?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className={cn("rounded-md border border-border bg-background px-3 py-2", !enabled && "opacity-60")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggle(!enabled)}
            className={cn(
              "relative h-4 w-7 rounded-full transition-colors",
              enabled ? "bg-primary" : "bg-muted",
            )}
            aria-label={`Toggle ${label}`}
          >
            <span
              className={cn(
                "absolute top-0.5 h-3 w-3 rounded-full bg-background transition-all",
                enabled ? "left-3.5" : "left-0.5",
              )}
            />
          </button>
          <div className="text-sm">{label}</div>
        </div>
        {editing ? (
          <div className="flex items-center gap-1">
            {prefix && <span className="text-xs text-muted-foreground">{prefix}</span>}
            <input
              autoFocus
              type="number"
              step={step}
              value={value}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              onBlur={() => setEditing(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
              className="w-20 rounded border border-primary bg-background px-2 py-1 text-right text-sm focus:outline-none"
            />
            {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="group flex items-center gap-1.5 rounded px-2 py-0.5 text-sm font-semibold hover:bg-accent"
          >
            <span>
              {prefix}
              {value}
              {suffix}
            </span>
            <Pencil className="h-3 w-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
          </button>
        )}
      </div>
      {extra && enabled && <div className="mt-2 pl-9">{extra}</div>}
    </div>
  );
}

function HourInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  // 24h hour 0-23 → display as 12h
  const display = (h: number) => {
    const period = h >= 12 ? "pm" : "am";
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}${period}`;
  };
  return (
    <select
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      className="rounded border border-border bg-background px-1.5 py-0.5 text-[11px] focus:outline-none"
    >
      {Array.from({ length: 24 }, (_, i) => (
        <option key={i} value={i}>{display(i)}</option>
      ))}
    </select>
  );
}
