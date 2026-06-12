import { useMemo, useState } from "react";
import { Bot, ChevronDown, LifeBuoy, Mail, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

const quickFixes = [
  {
    q: "Map is not loading",
    a: "Refresh the page first. If the map still fails, confirm the browser has internet access and send a ticket with the page URL so support can check the Maps key, billing, and domain restrictions.",
  },
  {
    q: "Driver cannot see a job",
    a: "Confirm the driver is signed into the driver account, is on shift, and the job is assigned to that driver. Dispatch can reassign the job or resend the invite if the driver account is not linked.",
  },
  {
    q: "Customer tracking link failed",
    a: "Open the job detail, confirm the customer phone number is valid, then resend the tracking link. If the customer still cannot open it, include the job ID in a support ticket.",
  },
  {
    q: "Invoice or billing looks wrong",
    a: "Check company pricing in Settings, then review the completed job price, mileage, storage, and tax fields. Send a ticket with the invoice number if totals still look off.",
  },
] as const;

type QuickFix = (typeof quickFixes)[number];

export function SupportWidget({ userEmail }: { userEmail?: string | null }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<QuickFix>(quickFixes[0]);
  const [message, setMessage] = useState("");

  const ticketBody = useMemo(() => {
    const lines = [
      "Hooked support ticket",
      "",
      `User: ${userEmail ?? "Unknown"}`,
      `Page: ${typeof window !== "undefined" ? window.location.href : ""}`,
      `Issue type: ${selected.q}`,
      "",
      "What happened:",
      message || "(Describe what happened here)",
      "",
      "Steps tried:",
      selected.a,
    ];
    return lines.join("\n");
  }, [message, selected, userEmail]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-bold">Hooked Help</div>
                <div className="text-[11px] text-muted-foreground">Troubleshoot or send a ticket</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Close support panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 p-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                What is happening?
              </label>
              <div className="relative">
                <select
                  value={selected.q}
                  onChange={(e) =>
                    setSelected(quickFixes.find((fix) => fix.q === e.target.value) ?? quickFixes[0])
                  }
                  className="w-full appearance-none rounded-xl border border-border bg-background px-3 py-2 pr-8 text-sm focus:border-primary focus:outline-none"
                >
                  {quickFixes.map((fix) => (
                    <option key={fix.q}>{fix.q}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Try this first: </span>
              {selected.a}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Tell us what you clicked, what you expected, and what error you saw..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />

            <div className="grid gap-2 sm:grid-cols-2">
              <a
                href={`mailto:support@hookaidashboard.com?subject=${encodeURIComponent(`Hooked support: ${selected.q}`)}&body=${encodeURIComponent(ticketBody)}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground transition-transform active:scale-95"
              >
                <Send className="h-4 w-4" />
                Send ticket
              </a>
              <a
                href="mailto:support@hookaidashboard.com"
                className="flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
                Email support
              </a>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-12 items-center gap-2 rounded-full border border-primary/30 bg-primary px-4 text-sm font-bold text-primary-foreground shadow-xl transition-transform active:scale-95",
          open && "bg-surface text-foreground",
        )}
      >
        <LifeBuoy className="h-5 w-5" />
        Help
      </button>
    </div>
  );
}
