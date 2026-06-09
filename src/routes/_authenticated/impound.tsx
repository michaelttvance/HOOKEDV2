import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, X, FileText, AlertTriangle, Gavel, CheckCircle2, Search, Loader2, Trash2 } from "lucide-react";
import {
  listImpound,
  createImpound,
  updateImpoundStatus,
  deleteImpound,
  generateImpoundPdf,
  type ImpoundRow,
  type ImpoundStatus,
} from "../../lib/impound.functions";
import { VinLookup } from "../../components/vin-lookup";
import { cn } from "../../lib/utils";

export const Route = createFileRoute("/_authenticated/impound")({
  head: () => ({ meta: [{ title: "Impound Lot — Hooked" }] }),
  component: ImpoundPage,
});

const STATUS_LABEL: Record<ImpoundStatus, string> = {
  in_lot: "In Lot",
  released: "Released",
  auctioned: "Auctioned",
  abandoned: "Abandoned",
};

const STATUS_CLS: Record<ImpoundStatus, string> = {
  in_lot: "bg-primary/15 text-primary border-primary/30",
  released: "bg-success/15 text-success border-success/30",
  auctioned: "bg-warning/15 text-warning border-warning/30",
  abandoned: "bg-urgent/15 text-urgent border-urgent/30",
};

function daysIn(row: ImpoundRow) {
  const end = row.dateOut ? new Date(row.dateOut).getTime() : Date.now();
  return Math.max(1, Math.ceil((end - new Date(row.dateIn).getTime()) / 86400000));
}

function fees(row: ImpoundRow) {
  const d = daysIn(row);
  const storage = d * row.dailyRate;
  return { days: d, storage, total: storage + row.initialTowFee };
}

function ImpoundPage() {
  const list = useServerFn(listImpound);
  const updateStatus = useServerFn(updateImpoundStatus);
  const remove = useServerFn(deleteImpound);
  const makePdf = useServerFn(generateImpoundPdf);

  const [rows, setRows] = useState<ImpoundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | ImpoundStatus | "auction_queue" | "abandoned_flag">("all");
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try { setRows(await list()); } finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);
  // Re-render every minute so storage fees tick
  useEffect(() => {
    const t = setInterval(() => setRows((r) => [...r]), 60_000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "auction_queue") {
        if (r.status === "released") return false;
        return daysIn(r) >= 30 || !!r.auctionDate;
      }
      if (filter === "abandoned_flag") return r.status === "in_lot" && daysIn(r) >= 30;
      if (filter !== "all" && r.status !== filter) return false;
      if (search) {
        const s = search.toLowerCase();
        return [r.vin, r.licensePlate, r.ownerName, r.vehicleMake, r.vehicleModel]
          .filter(Boolean).some((v) => v!.toLowerCase().includes(s));
      }
      return true;
    });
  }, [rows, filter, search]);

  const counts = useMemo(() => ({
    in_lot: rows.filter((r) => r.status === "in_lot").length,
    released: rows.filter((r) => r.status === "released").length,
    auctioned: rows.filter((r) => r.status === "auctioned").length,
    abandoned: rows.filter((r) => r.status === "abandoned").length,
    abandoned_flag: rows.filter((r) => r.status === "in_lot" && daysIn(r) >= 30).length,
    auction_queue: rows.filter((r) => r.status !== "released" && (daysIn(r) >= 30 || !!r.auctionDate)).length,
  }), [rows]);

  async function downloadPdf(id: string, kind: "lien" | "release") {
    setBusy(id + kind);
    try {
      const res = await makePdf({ data: { id, kind } });
      const bytes = Uint8Array.from(atob(res.base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = res.filename; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally { setBusy(null); }
  }

  async function release(row: ImpoundRow) {
    const releasedTo = window.prompt("Released to (name)?", row.ownerName ?? "");
    if (releasedTo === null) return;
    const f = fees(row);
    const paidStr = window.prompt("Total amount paid?", f.total.toFixed(2));
    if (paidStr === null) return;
    const r = await updateStatus({ data: { id: row.id, status: "released", releasedTo, totalPaid: parseFloat(paidStr) || 0 } });
    setRows((rs) => rs.map((x) => x.id === r.id ? r : x));
  }

  async function setStatus(id: string, status: ImpoundStatus) {
    const r = await updateStatus({ data: { id, status } });
    setRows((rs) => rs.map((x) => x.id === r.id ? r : x));
  }

  async function setAuctionDate(row: ImpoundRow) {
    const d = window.prompt("Auction date (YYYY-MM-DD)?", row.auctionDate ?? "");
    if (!d) return;
    const r = await updateStatus({ data: { id: row.id, status: row.status, auctionDate: d } });
    setRows((rs) => rs.map((x) => x.id === r.id ? r : x));
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Impound Lot</h1>
            <p className="text-xs text-muted-foreground">Storage fees calculate in real time. Missouri lien notice & release forms ready to print.</p>
          </div>
          <button
            onClick={() => setNewOpen(true)}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> New impound
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <StatCard label="In Lot" value={counts.in_lot} active={filter==="in_lot"} onClick={()=>setFilter("in_lot")} />
          <StatCard label="Released" value={counts.released} active={filter==="released"} onClick={()=>setFilter("released")} />
          <StatCard label="Auctioned" value={counts.auctioned} active={filter==="auctioned"} onClick={()=>setFilter("auctioned")} />
          <StatCard label="Abandoned ≥30d" value={counts.abandoned_flag} tone="urgent" active={filter==="abandoned_flag"} onClick={()=>setFilter("abandoned_flag")} />
          <StatCard label="Auction Queue" value={counts.auction_queue} tone="warning" active={filter==="auction_queue"} onClick={()=>setFilter("auction_queue")} />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search VIN, plate, owner, make/model…"
              className="input-base w-full pl-9"
            />
          </div>
          {filter !== "all" && (
            <button onClick={() => setFilter("all")} className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
              Clear filter
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading impound lot…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            No vehicles in this view.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filtered.map((row) => {
              const f = fees(row);
              const abandonedFlag = row.status === "in_lot" && f.days >= 30;
              return (
                <div key={row.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold tracking-tight truncate">
                          {[row.vehicleYear, row.vehicleMake, row.vehicleModel].filter(Boolean).join(" ") || "Unknown vehicle"}
                        </div>
                        {abandonedFlag && (
                          <span className="flex items-center gap-1 rounded-full border border-urgent/40 bg-urgent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-urgent">
                            <AlertTriangle className="h-3 w-3" /> Abandoned
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        VIN <span className="font-mono">{row.vin ?? "—"}</span> · Plate {row.licensePlate ?? "—"} {row.plateState ? `(${row.plateState})` : ""} · {row.vehicleColor ?? "—"}
                      </div>
                    </div>
                    <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", STATUS_CLS[row.status])}>
                      {STATUS_LABEL[row.status]}
                    </span>
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground sm:grid-cols-4">
                    <Stat label="Date in" value={new Date(row.dateIn).toLocaleDateString()} />
                    <Stat label="Days" value={String(f.days)} />
                    <Stat label="Rate / day" value={`$${row.dailyRate.toFixed(0)}`} />
                    <Stat label="Total due" value={`$${f.total.toFixed(2)}`} highlight />
                  </div>

                  <div className="mb-3 text-[11px]">
                    <div className="text-muted-foreground">Owner</div>
                    <div className="text-foreground">{row.ownerName ?? "—"} · {row.ownerPhone ?? "—"}</div>
                    {row.ownerAddress && <div className="text-muted-foreground">{row.ownerAddress}</div>}
                  </div>

                  {row.auctionDate && (
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] text-warning">
                      <Gavel className="h-3 w-3" /> Auction scheduled {new Date(row.auctionDate).toLocaleDateString()}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => downloadPdf(row.id, "lien")}
                      disabled={busy === row.id + "lien"}
                      className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-[11px] font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-50"
                    >
                      {busy === row.id + "lien" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                      Lien notice
                    </button>
                    <button
                      onClick={() => downloadPdf(row.id, "release")}
                      disabled={busy === row.id + "release"}
                      className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-[11px] font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-50"
                    >
                      {busy === row.id + "release" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                      Release form
                    </button>
                    {row.status === "in_lot" && (
                      <>
                        <button
                          onClick={() => release(row)}
                          className="flex items-center gap-1 rounded-md bg-success px-2 py-1.5 text-[11px] font-bold text-success-foreground hover:bg-success/90"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Release
                        </button>
                        <button
                          onClick={() => setAuctionDate(row)}
                          className="flex items-center gap-1 rounded-md border border-warning/40 bg-warning/10 px-2 py-1.5 text-[11px] font-semibold text-warning hover:bg-warning/20"
                        >
                          <Gavel className="h-3 w-3" /> Set auction
                        </button>
                        {abandonedFlag && (
                          <button
                            onClick={() => setStatus(row.id, "abandoned")}
                            className="rounded-md border border-urgent/40 bg-urgent/10 px-2 py-1.5 text-[11px] font-semibold text-urgent hover:bg-urgent/20"
                          >
                            Mark abandoned
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={async () => { if (confirm("Delete this impound record?")) { await remove({ data: { id: row.id } }); setRows((rs) => rs.filter((x) => x.id !== row.id)); } }}
                      className="ml-auto rounded-md border border-border px-2 py-1.5 text-[11px] text-muted-foreground hover:text-urgent"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {newOpen && (
        <NewImpoundModal
          onClose={() => setNewOpen(false)}
          onCreated={(r) => { setRows((rs) => [r, ...rs]); setNewOpen(false); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, tone, active, onClick }: { label: string; value: number; tone?: "warning" | "urgent"; active?: boolean; onClick?: () => void }) {
  const toneCls = tone === "urgent" ? "border-urgent/40" : tone === "warning" ? "border-warning/40" : "border-border";
  return (
    <button onClick={onClick} className={cn("rounded-lg border bg-surface p-3 text-left transition-colors hover:border-primary", toneCls, active && "border-primary ring-1 ring-primary/30")}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("text-2xl font-semibold", tone === "urgent" && "text-urgent", tone === "warning" && "text-warning")}>{value}</div>
    </button>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider">{label}</div>
      <div className={cn("font-semibold", highlight ? "text-primary" : "text-foreground")}>{value}</div>
    </div>
  );
}

function NewImpoundModal({ onClose, onCreated }: { onClose: () => void; onCreated: (r: ImpoundRow) => void }) {
  const create = useServerFn(createImpound);
  const [form, setForm] = useState({
    vin: "", vehicleYear: "", vehicleMake: "", vehicleModel: "", vehicleColor: "",
    licensePlate: "", plateState: "MO",
    ownerName: "", ownerAddress: "", ownerPhone: "",
    towLocation: "", towReason: "", towedBy: "",
    dailyRate: "45", initialTowFee: "185", notes: "",
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      const r = await create({ data: {
        vin: form.vin || null,
        vehicleYear: form.vehicleYear ? parseInt(form.vehicleYear) : null,
        vehicleMake: form.vehicleMake || null,
        vehicleModel: form.vehicleModel || null,
        vehicleColor: form.vehicleColor || null,
        licensePlate: form.licensePlate || null,
        plateState: form.plateState || null,
        ownerName: form.ownerName || null,
        ownerAddress: form.ownerAddress || null,
        ownerPhone: form.ownerPhone || null,
        towLocation: form.towLocation || null,
        towReason: form.towReason || null,
        towedBy: form.towedBy || null,
        dailyRate: parseFloat(form.dailyRate) || 45,
        initialTowFee: parseFloat(form.initialTowFee) || 185,
        notes: form.notes || null,
      } });
      onCreated(r);
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-3 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Impound</div>
            <div className="text-base font-semibold">New impound entry</div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">VIN lookup</label>
            <VinLookup
              vin={form.vin}
              onVinChange={(v) => set("vin", v)}
              onResult={(r) => setForm((f) => ({
                ...f,
                vehicleYear: r.year ? String(r.year) : f.vehicleYear,
                vehicleMake: r.make ?? f.vehicleMake,
                vehicleModel: r.model ?? f.vehicleModel,
              }))}
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Field label="Year"><input value={form.vehicleYear} onChange={(e)=>set("vehicleYear",e.target.value.replace(/\D/g,"").slice(0,4))} className="input-base" /></Field>
            <Field label="Make"><input value={form.vehicleMake} onChange={(e)=>set("vehicleMake",e.target.value)} className="input-base" /></Field>
            <Field label="Model"><input value={form.vehicleModel} onChange={(e)=>set("vehicleModel",e.target.value)} className="input-base" /></Field>
            <Field label="Color"><input value={form.vehicleColor} onChange={(e)=>set("vehicleColor",e.target.value)} className="input-base" /></Field>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Field label="Plate"><input value={form.licensePlate} onChange={(e)=>set("licensePlate",e.target.value.toUpperCase())} className="input-base uppercase" /></Field>
            <Field label="State"><input value={form.plateState} onChange={(e)=>set("plateState",e.target.value.toUpperCase().slice(0,2))} className="input-base uppercase" /></Field>
            <Field label="Towed by"><input value={form.towedBy} onChange={(e)=>set("towedBy",e.target.value)} className="input-base" placeholder="Driver / Truck" /></Field>
          </div>

          <Field label="Owner name"><input value={form.ownerName} onChange={(e)=>set("ownerName",e.target.value)} className="input-base" /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Owner phone"><input value={form.ownerPhone} onChange={(e)=>set("ownerPhone",e.target.value)} className="input-base" /></Field>
            <Field label="Owner address"><input value={form.ownerAddress} onChange={(e)=>set("ownerAddress",e.target.value)} className="input-base" /></Field>
          </div>

          <Field label="Tow location"><input value={form.towLocation} onChange={(e)=>set("towLocation",e.target.value)} className="input-base" /></Field>
          <Field label="Tow reason"><input value={form.towReason} onChange={(e)=>set("towReason",e.target.value)} className="input-base" placeholder="Police hold, abandoned, accident…" /></Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Daily rate ($)"><input type="number" min="0" value={form.dailyRate} onChange={(e)=>set("dailyRate",e.target.value)} className="input-base" /></Field>
            <Field label="Initial tow fee ($)"><input type="number" min="0" value={form.initialTowFee} onChange={(e)=>set("initialTowFee",e.target.value)} className="input-base" /></Field>
          </div>

          <Field label="Notes"><textarea rows={2} value={form.notes} onChange={(e)=>set("notes",e.target.value)} className="input-base" /></Field>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Add to lot
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}
