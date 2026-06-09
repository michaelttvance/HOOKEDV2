import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { lookupVin } from "../lib/vin.functions";

type Props = {
  vin: string;
  onVinChange: (vin: string) => void;
  onResult: (r: {
    year?: number | null;
    make?: string | null;
    model?: string | null;
    trim?: string | null;
  }) => void;
  className?: string;
};

export function VinLookup({ vin, onVinChange, onResult, className }: Props) {
  const lookup = useServerFn(lookupVin);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    if (!vin || vin.length < 11) { setErr("VIN must be 11–17 chars"); return; }
    setErr(null); setLoading(true);
    try {
      const res = await lookup({ data: { vin } });
      if (!res.ok) { setErr(res.error); return; }
      onResult({ year: res.year, make: res.make, model: res.model, trim: res.trim });
    } catch (e: any) {
      setErr(e?.message || "Lookup failed");
    } finally { setLoading(false); }
  }

  return (
    <div className={className}>
      <div className="flex gap-2">
        <input
          value={vin}
          onChange={(e) => onVinChange(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/gi, "").slice(0, 17))}
          placeholder="VIN (17 chars)"
          className="input-base flex-1 font-mono uppercase tracking-wider"
        />
        <button
          type="button"
          onClick={run}
          disabled={loading || vin.length < 11}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          Lookup
        </button>
      </div>
      {err && <div className="mt-1 text-[11px] text-urgent">{err}</div>}
    </div>
  );
}
