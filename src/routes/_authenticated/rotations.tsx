import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, X, Loader2, CheckCircle2, XCircle, Trash2, Edit3 } from "lucide-react";
import {
  listPDs, upsertPD, deletePD, recordRotation, listRotationHistory,
  type PoliceDept, type RotationLog,
} from "../../lib/rotations.functions";
import { cn } from "../../lib/utils";

export const Route = createFileRoute("/_authenticated/rotations")({
  head: () => ({ meta: [{ title: "Police Rotations — Hooked" }] }),
  component: RotationsPage,
});

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function RotationsPage() {
  const list = useServerFn(listPDs);
  const upsert = useServerFn(upsertPD);
  const remove = useServerFn(deletePD);
  const record = useServerFn(recordRotation);
  const history = useServerFn(listRotationHistory);

  const [pds, setPds] = useState<PoliceDept[]>([]);
  const [logs, setLogs] = useState<RotationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPd, setEditPd] = useState<Partial<PoliceDept> | null>(null);

  async function refresh() {
    setLoading(true);
    try { const [a,b] = await Promise.all([list(), history()]); setPds(a); setLogs(b); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);

  const enabled = pds.filter((p) => p.enabled);
  const nextUp = enabled[0] ?? null;

  async function act(pd: PoliceDept, accepted: boolean) {
    const reason = accepted ? null : (window.prompt("Decline reason (optional)?") ?? null);
    await record({ data: { pdId: pd.id, accepted, declineReason: reason } });
    await refresh();
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Police Rotations</h1>
            <p className="text-xs text-muted-foreground">Rotation auto-advances after each call.</p>
          </div>
          <button onClick={() => setEditPd({})} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add PD
          </button>
        </div>

        {/* Up next */}
        {nextUp && (
          <div className="rounded-lg border border-primary/40 bg-primary/10 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">Up next in rotation</div>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">{nextUp.name}</div>
                <div className="text-xs text-muted-foreground">
                  {nextUp.contactName ?? "—"} · {nextUp.phone ?? "—"} · {nextUp.coverageZone ?? "All zones"}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => act(nextUp, true)} className="flex items-center gap-1 rounded-md bg-success px-3 py-2 text-sm font-semibold text-success-foreground hover:bg-success/90">
                  <CheckCircle2 className="h-4 w-4" /> Accepted
                </button>
                <button onClick={() => act(nextUp, false)} className="flex items-center gap-1 rounded-md border border-urgent/40 bg-urgent/10 px-3 py-2 text-sm font-semibold text-urgent hover:bg-urgent/20">
                  <XCircle className="h-4 w-4" /> Decline → next
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Rotation queue
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            </div>
          ) : pds.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No police departments yet. Add your first one.</div>
          ) : (
            <ul>
              {pds.map((pd, i) => (
                <li key={pd.id} className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3 first:border-t-0">
                  <span className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                    !pd.enabled ? "bg-muted text-muted-foreground" : i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{pd.name} {!pd.enabled && <span className="ml-1 text-[10px] uppercase text-muted-foreground">(off)</span>}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {pd.coverageZone ?? "All zones"} · {pd.scheduleDays.join("/")} · {pd.scheduleStart}–{pd.scheduleEnd}
                    </div>
                  </div>
                  <button onClick={() => setEditPd(pd)} className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={async () => { if (confirm("Remove PD?")) { await remove({ data: { id: pd.id } }); refresh(); } }} className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-urgent"><Trash2 className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent rotation history
          </div>
          {logs.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No history yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-4 py-2 text-left">When</th><th className="text-left">PD</th><th className="text-left">Type</th><th className="text-left">Resp.</th><th className="text-left">Result</th></tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(l.occurredAt).toLocaleString()}</td>
                    <td>{l.pdName}</td>
                    <td className="text-muted-foreground">{l.jobType ?? "—"}</td>
                    <td className="text-muted-foreground">{l.responseMinutes != null ? `${l.responseMinutes}m` : "—"}</td>
                    <td>
                      {l.accepted
                        ? <span className="rounded bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">Accepted</span>
                        : <span className="rounded bg-urgent/15 px-2 py-0.5 text-[11px] font-semibold text-urgent" title={l.declineReason ?? ""}>Declined</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editPd && <PdEditor pd={editPd} onClose={() => setEditPd(null)} onSaved={async () => { setEditPd(null); refresh(); }} />}
    </div>
  );
}

function PdEditor({ pd, onClose, onSaved }: { pd: Partial<PoliceDept>; onClose: () => void; onSaved: () => void }) {
  const upsert = useServerFn(upsertPD);
  const [form, setForm] = useState({
    name: pd.name ?? "",
    contactName: pd.contactName ?? "",
    phone: pd.phone ?? "",
    email: pd.email ?? "",
    coverageZone: pd.coverageZone ?? "",
    scheduleDays: pd.scheduleDays ?? [...DAYS],
    scheduleStart: pd.scheduleStart ?? "00:00",
    scheduleEnd: pd.scheduleEnd ?? "23:59",
    enabled: pd.enabled ?? true,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try { await upsert({ data: { id: pd.id, ...form } as any }); onSaved(); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-3 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="text-base font-semibold">{pd.id ? "Edit" : "Add"} police department</div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 p-4">
          <L label="Department name"><input className="input-base" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="St. Louis County PD - Precinct 4" /></L>
          <div className="grid grid-cols-2 gap-2">
            <L label="Contact"><input className="input-base" value={form.contactName} onChange={(e)=>setForm({...form,contactName:e.target.value})} /></L>
            <L label="Phone"><input className="input-base" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} /></L>
          </div>
          <L label="Coverage zone"><input className="input-base" value={form.coverageZone} onChange={(e)=>setForm({...form,coverageZone:e.target.value})} placeholder="Zip 63017, 63021" /></L>
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Days</div>
            <div className="flex flex-wrap gap-1">
              {DAYS.map((d) => {
                const active = form.scheduleDays.includes(d);
                return (
                  <button key={d} type="button" onClick={() => setForm({...form, scheduleDays: active ? form.scheduleDays.filter(x=>x!==d) : [...form.scheduleDays, d]})}
                    className={cn("rounded-md border px-3 py-1.5 text-xs font-semibold", active ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground")}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <L label="Start"><input type="time" className="input-base" value={form.scheduleStart} onChange={(e)=>setForm({...form,scheduleStart:e.target.value})} /></L>
            <L label="End"><input type="time" className="input-base" value={form.scheduleEnd} onChange={(e)=>setForm({...form,scheduleEnd:e.target.value})} /></L>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.enabled} onChange={(e)=>setForm({...form,enabled:e.target.checked})} />
            Enabled in rotation
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>{children}</label>;
}
