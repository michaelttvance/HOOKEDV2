import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, RefreshCw, Mail, Plus, AlertTriangle, CheckCircle2, Inbox } from "lucide-react";
import {
  listInboundEmails,
  retryInboundEmail,
  createJobFromInbound,
  type InboundEmailRow,
} from "../../lib/inbound.functions";
import { cn } from "../../lib/utils";
import { safePublicError } from "../../lib/public-errors";

export const Route = createFileRoute("/_authenticated/inbound-emails")({
  head: () => ({ meta: [{ title: "Inbound emails — Hooked" }] }),
  component: InboundEmailsPage,
});

const STATUS_TONE: Record<string, string> = {
  received: "bg-muted text-muted-foreground",
  parsed: "bg-warning/15 text-warning",
  job_created: "bg-success/15 text-success",
  failed: "bg-urgent/15 text-urgent",
  unmatched: "bg-urgent/15 text-urgent",
};

function InboundEmailsPage() {
  const qc = useQueryClient();
  const list = useServerFn(listInboundEmails);
  const retry = useServerFn(retryInboundEmail);
  const q = useQuery({
    queryKey: ["inbound-emails"],
    queryFn: () => list(),
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [manualForId, setManualForId] = useState<string | null>(null);

  const rows = q.data?.rows ?? [];
  const openRow = useMemo(() => rows.find((r) => r.id === openId) ?? null, [rows, openId]);

  async function onRetry(id: string) {
    setBusyId(id);
    try {
      await retry({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["inbound-emails"] });
    } catch (e) {
      alert(
        safePublicError(
          "We couldn't retry that email right now. Please try again in a few minutes.",
          e,
          "[inbound-emails] retry failed",
        ),
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <div>
          <Link to="/settings" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Settings
          </Link>
          <h1 className="text-xl font-semibold">Inbound emails</h1>
          <p className="text-xs text-muted-foreground">
            Emails forwarded to your dispatch address. Parsed by AI and auto-created as jobs when possible.
          </p>
        </div>

        {q.isLoading ? (
          <div className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-12 text-center">
            <Inbox className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No inbound emails yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Get your dispatch address from <Link to="/settings" className="text-primary hover:underline">Settings</Link>.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-background/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Received</th>
                  <th className="px-3 py-2 text-left">From</th>
                  <th className="px-3 py-2 text-left">Subject</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-background/30">
                    <td className="px-3 py-2 text-xs text-muted-foreground">{fmtTime(r.received_at)}</td>
                    <td className="px-3 py-2 text-xs">{r.from_address}</td>
                    <td className="px-3 py-2 text-xs">
                      <button
                        onClick={() => setOpenId(r.id === openId ? null : r.id)}
                        className="text-left hover:text-primary"
                      >
                        {r.subject || <span className="italic text-muted-foreground">(no subject)</span>}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn("rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", STATUS_TONE[r.status] ?? "bg-muted")}>
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-1">
                        {r.status !== "job_created" && r.status !== "unmatched" && (
                          <button
                            onClick={() => onRetry(r.id)}
                            disabled={busyId === r.id}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] hover:bg-muted disabled:opacity-50"
                          >
                            <RefreshCw className={cn("h-3 w-3", busyId === r.id && "animate-spin")} />
                            Retry
                          </button>
                        )}
                        {r.status !== "job_created" && r.status !== "unmatched" && (
                          <button
                            onClick={() => setManualForId(r.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] hover:bg-muted"
                          >
                            <Plus className="h-3 w-3" /> Create job
                          </button>
                        )}
                        {r.status === "job_created" && r.job_id && (
                          <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-1 text-[11px] font-semibold text-success hover:bg-success/25"
                          >
                            <CheckCircle2 className="h-3 w-3" /> View
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {openRow && <EmailDetail row={openRow} onClose={() => setOpenId(null)} />}
        {manualForId && (
          <ManualJobDialog
            row={rows.find((r) => r.id === manualForId)!}
            onClose={() => setManualForId(null)}
            onCreated={() => {
              setManualForId(null);
              qc.invalidateQueries({ queryKey: ["inbound-emails"] });
            }}
          />
        )}
      </div>
    </div>
  );
}

function EmailDetail({ row, onClose }: { row: InboundEmailRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {row.from_address} → {row.to_address}
            </div>
            <h2 className="mt-1 text-base font-semibold">{row.subject || "(no subject)"}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        {row.error && (
          <div className="mb-3 flex items-start gap-2 rounded-md border border-urgent/40 bg-urgent/10 p-3 text-xs text-urgent">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{" "}
            {safePublicError(
              "This email could not be processed right now.",
              row.error,
              "[inbound-emails] row error",
            )}
          </div>
        )}
        {row.parsed_json && (
          <div className="mb-3 rounded-md border border-border bg-background/40 p-3">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Parsed</div>
            <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(row.parsed_json, null, 2)}</pre>
          </div>
        )}
        <div className="rounded-md border border-border bg-background/40 p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Body</div>
          <pre className="whitespace-pre-wrap text-xs">{row.body_text || "(empty)"}</pre>
        </div>
      </div>
    </div>
  );
}

function ManualJobDialog({
  row,
  onClose,
  onCreated,
}: {
  row: InboundEmailRow;
  onClose: () => void;
  onCreated: () => void;
}) {
  const create = useServerFn(createJobFromInbound);
  const p = (row.parsed_json ?? {}) as any;
  const [caller, setCaller] = useState<string>(p.caller ?? "");
  const [phone, setPhone] = useState<string>(p.phone ?? "");
  const [location, setLocation] = useState<string>(p.location ?? "");
  const [serviceType, setServiceType] = useState<string>(p.serviceType ?? "Tow");
  const [priority, setPriority] = useState<string>(p.priority ?? "Standard");
  const [vehicleYear, setVehicleYear] = useState<string>(p.vehicleYear ? String(p.vehicleYear) : "");
  const [vehicleMake, setVehicleMake] = useState<string>(p.vehicleMake ?? "");
  const [vehicleModel, setVehicleModel] = useState<string>(p.vehicleModel ?? "");
  const [notes, setNotes] = useState<string>(p.cleanedNotes ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const yr = vehicleYear ? parseInt(vehicleYear, 10) : null;
      await create({
        data: {
          id: row.id,
          caller: caller.trim(),
          phone: phone.trim(),
          location: location.trim(),
          serviceType: serviceType as any,
          priority: priority as any,
          vehicleYear: yr && !Number.isNaN(yr) ? yr : null,
          vehicleMake: vehicleMake.trim() || null,
          vehicleModel: vehicleModel.trim() || null,
          notes,
        },
      });
      onCreated();
    } catch (e) {
      setErr(
        safePublicError(
          "We couldn't create that job right now. Please try again in a few minutes.",
          e,
          "[inbound-emails] create job failed",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        className="max-h-[85vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-lg border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold">Create job from email</h2>
        <p className="text-xs text-muted-foreground">{row.from_address} — {row.subject}</p>
        {err && <div className="rounded-md border border-urgent/40 bg-urgent/10 p-2 text-xs text-urgent">{err}</div>}

        <Field label="Caller *">
          <input required value={caller} onChange={(e) => setCaller(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Phone">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Location *">
          <input required value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Service *">
            <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className={inputCls}>
              {["Tow", "Lockout", "Jumpstart", "Tire", "Winch"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
              {["Urgent", "Standard", "Low"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Year">
            <input value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Make">
            <input value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Model">
            <input value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={cn(inputCls, "min-h-[60px]")} />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted">Cancel</button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create job"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:border-primary focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return d.toLocaleString();
}
