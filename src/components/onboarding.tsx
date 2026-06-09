import { useState } from "react";
import { Truck, Plus, Check } from "lucide-react";
import { useDispatch } from "../lib/dispatch-store";
import { ALL_CERTIFICATIONS, type Certification } from "../lib/seed-data";
import { cn } from "../lib/utils";

export function Onboarding() {
  const { addDriver } = useDispatch();
  const [name, setName] = useState("");
  const [truck, setTruck] = useState("");
  const [phone, setPhone] = useState("");
  const [certs, setCerts] = useState<Certification[]>(["Light Duty"]);

  function toggle(c: Certification) {
    setCerts((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !truck) return;
    addDriver({ name, truck, phone, certifications: certs });
  }

  const inputCls =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none";

  return (
    <div className="flex h-full items-center justify-center overflow-auto p-6">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground glow-primary">
            <Truck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to Hooked</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first driver to get started. You can add more anytime.
          </p>
        </div>

        <form onSubmit={submit} className="rounded-xl border border-border bg-surface p-5 shadow-2xl">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Driver name">
              <input
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mike D."
                className={inputCls}
              />
            </Field>
            <Field label="Truck #">
              <input
                required
                value={truck}
                onChange={(e) => setTruck(e.target.value)}
                placeholder="T-07"
                className={inputCls}
              />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Phone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(415) 555-0100"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Job certifications
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_CERTIFICATIONS.map((c) => {
                const on = certs.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggle(c)}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors",
                      on
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border",
                        on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                      )}
                    >
                      {on && <Check className="h-3 w-3" />}
                    </span>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add driver & start dispatching
          </button>
        </form>

        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          You'll be able to log jobs and assign them once your first driver is on the roster.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
