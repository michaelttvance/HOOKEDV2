import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { useDispatch } from "../lib/dispatch-store";
import { cn } from "../lib/utils";

export function AiAssistant() {
  const { chat, sendChat, jobs, history } = useDispatch();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [chat.length]);

  const stalled = jobs.filter(
    (j) => j.status === "Unassigned" && Date.now() - j.receivedAt > 5 * 60_000,
  );
  const longOnScene = jobs.find(
    (j) => j.status === "OnScene" && Date.now() - j.receivedAt > 60 * 60_000,
  );

  const today = new Date().toISOString().slice(0, 10);
  const todays = history.filter((h) => h.date === today);
  const revenue = todays.reduce((s, h) => s + h.amount, 0);
  const avgResp = todays.length
    ? Math.round(todays.reduce((s, h) => s + h.responseMin, 0) / todays.length)
    : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    sendChat(draft.trim());
    setDraft("");
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold">Dispatch AI</div>
          <div className="text-[11px] text-muted-foreground">Always watching the board</div>
        </div>
      </div>

      {/* Alerts + summary */}
      <div className="space-y-2 border-b border-border p-3">
        {stalled.map((j) => (
          <Alert key={j.id} tone="urgent" icon={AlertTriangle}>
            <b>{j.caller}</b> unassigned {Math.round((Date.now() - j.receivedAt) / 60000)} min
          </Alert>
        ))}
        {longOnScene && (
          <Alert tone="warning" icon={Clock}>
            Driver on scene 90+ min — <b>{longOnScene.caller}</b>. Check in?
          </Alert>
        )}
        <div className="rounded-md border border-border bg-background/40 p-3">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-3 w-3" /> Today
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <Stat label="Jobs" value={todays.length} />
            <Stat label="Revenue" value={`$${revenue.toLocaleString()}`} />
            <Stat label="Avg resp" value={`${avgResp}m`} />
          </div>
        </div>
      </div>

      {/* Chat */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {chat.map((m) =>
          m.role === "ai" ? (
            <div key={m.id} className="flex gap-2">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Sparkles className="h-3 w-3" />
              </div>
              <div className="text-sm leading-snug text-foreground">{m.text}</div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[80%] rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground">
                {m.text}
              </div>
            </div>
          ),
        )}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask the AI…"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="font-mono text-base font-semibold text-primary">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Alert({
  children,
  tone,
  icon: Icon,
}: {
  children: React.ReactNode;
  tone: "urgent" | "warning";
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2 text-xs",
        tone === "urgent"
          ? "border-urgent/40 bg-urgent/10 text-urgent-foreground"
          : "border-warning/40 bg-warning/10 text-warning",
      )}
    >
      <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", tone === "urgent" ? "text-urgent" : "text-warning")} />
      <div className="leading-snug text-foreground">{children}</div>
    </div>
  );
}
