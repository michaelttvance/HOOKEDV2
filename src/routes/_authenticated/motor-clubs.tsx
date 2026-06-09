import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plug, PlugZap, Edit3, Save, X } from "lucide-react";
import {
  listMotorClubs, upsertMotorClub, deleteMotorClub, PROVIDERS,
  type MotorClub,
} from "../../lib/motorclubs.functions";
import { cn } from "../../lib/utils";

export const Route = createFileRoute("/_authenticated/motor-clubs")({
  head: () => ({ meta: [{ title: "Motor Clubs — Hooked" }] }),
  component: MotorClubsPage,
});

function MotorClubsPage() {
  const list = useServerFn(listMotorClubs);
  const upsert = useServerFn(upsertMotorClub);

  const [clubs, setClubs] = useState<MotorClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MotorClub | null>(null);

  async function refresh() {
    setLoading(true);
    try { setClubs(await list()); } finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);

  // Build display list — one row per provider (existing or default)
  const rows = PROVIDERS.map((p) => {
    const existing = clubs.find((c) => c.provider === p.provider);
    return existing ?? {
      id: "",
      name: p.name,
      provider: p.provider,
      enabled: false,
      contactEmail: null,
      contactPhone: null,
      accountNumber: null,
      avgPayout: 0,
      jobsThisMonth: 0,
      acceptCount: 0,
      totalOffered: 0,
      acceptanceRate: 0,
      etaCodes: { en_route: "ER", on_scene: "OS", complete: "GOA" },
    } as MotorClub;
  });

  async function toggle(c: MotorClub) {
    await upsert({ data: { id: c.id || undefined, name: c.name, provider: c.provider, enabled: !c.enabled,
      contactEmail: c.contactEmail, contactPhone: c.contactPhone, accountNumber: c.accountNumber,
      etaCodes: c.etaCodes } });
    refresh();
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Motor Clubs</h1>
          <p className="text-xs text-muted-foreground">Receive jobs and send status codes back automatically.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((c) => (
              <div key={c.provider} className="rounded-lg border border-border bg-surface p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{c.provider}</div>
                  </div>
                  <button
                    onClick={() => toggle(c)}
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
                      c.enabled
                        ? "border-success/40 bg-success/15 text-success"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {c.enabled ? <PlugZap className="h-3 w-3" /> : <Plug className="h-3 w-3" />}
                    {c.enabled ? "Connected" : "Off"}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <Mini label="Jobs / mo" value={c.jobsThisMonth} />
                  <Mini label="Avg payout" value={`$${c.avgPayout.toFixed(0)}`} />
                  <Mini label="Accept rate" value={`${c.acceptanceRate}%`} />
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <div className="text-muted-foreground">
                    Codes: ER=<b className="text-foreground">{c.etaCodes.en_route}</b> · OS=<b className="text-foreground">{c.etaCodes.on_scene}</b> · Done=<b className="text-foreground">{c.etaCodes.complete}</b>
                  </div>
                  <button onClick={() => setEditing(c)} className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
                    <Edit3 className="h-3 w-3" /> Configure
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-dashed border-border p-4 text-[11px] text-muted-foreground">
          <b className="text-foreground">How it works:</b> Enabled clubs send jobs into your dispatch queue with the club badge. One-click accept auto-assigns the nearest driver. Status updates (en route / on scene / complete) post back to the club using the codes above.
        </div>
      </div>

      {editing && <ClubEditor club={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); refresh(); }} />}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}

function ClubEditor({ club, onClose, onSaved }: { club: MotorClub; onClose: () => void; onSaved: () => void }) {
  const upsert = useServerFn(upsertMotorClub);
  const [form, setForm] = useState({
    contactEmail: club.contactEmail ?? "",
    contactPhone: club.contactPhone ?? "",
    accountNumber: club.accountNumber ?? "",
    enabled: club.enabled,
    en_route: club.etaCodes.en_route,
    on_scene: club.etaCodes.on_scene,
    complete: club.etaCodes.complete,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await upsert({ data: {
        id: club.id || undefined,
        name: club.name,
        provider: club.provider,
        enabled: form.enabled,
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        accountNumber: form.accountNumber || null,
        etaCodes: { en_route: form.en_route, on_scene: form.on_scene, complete: form.complete },
      }});
      onSaved();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-3 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="text-base font-semibold">{club.name}</div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 p-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.enabled} onChange={(e)=>setForm({...form,enabled:e.target.checked})} /> Enabled
          </label>
          <L label="Account / provider ID"><input className="input-base" value={form.accountNumber} onChange={(e)=>setForm({...form,accountNumber:e.target.value})} /></L>
          <div className="grid grid-cols-2 gap-2">
            <L label="Contact email"><input className="input-base" value={form.contactEmail} onChange={(e)=>setForm({...form,contactEmail:e.target.value})} /></L>
            <L label="Contact phone"><input className="input-base" value={form.contactPhone} onChange={(e)=>setForm({...form,contactPhone:e.target.value})} /></L>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status codes (sent back to club)</div>
            <div className="grid grid-cols-3 gap-2">
              <L label="En route"><input className="input-base uppercase" value={form.en_route} onChange={(e)=>setForm({...form,en_route:e.target.value.toUpperCase().slice(0,6)})} /></L>
              <L label="On scene"><input className="input-base uppercase" value={form.on_scene} onChange={(e)=>setForm({...form,on_scene:e.target.value.toUpperCase().slice(0,6)})} /></L>
              <L label="Complete"><input className="input-base uppercase" value={form.complete} onChange={(e)=>setForm({...form,complete:e.target.value.toUpperCase().slice(0,6)})} /></L>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>{children}</label>;
}
