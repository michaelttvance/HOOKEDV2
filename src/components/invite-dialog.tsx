import { useEffect, useState } from "react";
import { X, UserPlus, Loader2, Copy, Check, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../lib/use-auth";
import { cn } from "../lib/utils";

interface Invite {
  id: string;
  email: string;
  role: "dispatcher" | "driver";
  token: string;
  accepted_at: string | null;
  created_at: string;
}

export function InviteDialog({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"dispatcher" | "driver">("driver");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    if (!profile.companyId) return;
    const { data } = await supabase
      .from("invites")
      .select("*")
      .order("created_at", { ascending: false });
    setInvites((data as Invite[] | null) ?? []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [profile.companyId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile.companyId) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from("invites")
      .insert({ company_id: profile.companyId, email, role });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEmail("");
    load();
  }

  async function remove(id: string) {
    await supabase.from("invites").delete().eq("id", id);
    load();
  }

  function linkFor(token: string) {
    return `${window.location.origin}/accept-invite?token=${token}`;
  }

  async function copy(token: string) {
    await navigator.clipboard.writeText(linkFor(token));
    setCopied(token);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Invite</div>
            <div className="text-sm font-semibold">Bring a teammate to {profile.companyName}</div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3 border-b border-border p-5">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Role</span>
            <div className="flex gap-2">
              {(["driver", "dispatcher"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-2 text-xs font-semibold capitalize transition-colors",
                    role === r ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </label>
          {error && <div className="rounded-md border border-urgent/40 bg-urgent/10 p-2 text-xs text-urgent">{error}</div>}
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Create invite link
          </button>
        </form>

        <div className="max-h-72 overflow-y-auto p-5">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Pending invites
          </div>
          {invites.length === 0 && (
            <p className="text-xs text-muted-foreground">No invites yet.</p>
          )}
          <ul className="space-y-2">
            {invites.map((iv) => (
              <li key={iv.id} className="rounded-md border border-border bg-background p-3">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{iv.email}</div>
                    <div className="text-[11px] text-muted-foreground capitalize">
                      {iv.role} · {iv.accepted_at ? "Accepted" : "Pending"}
                    </div>
                  </div>
                  {!iv.accepted_at && (
                    <>
                      <button
                        onClick={() => copy(iv.token)}
                        className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
                      >
                        {copied === iv.token ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied === iv.token ? "Copied" : "Copy link"}
                      </button>
                      <button
                        onClick={() => remove(iv.id)}
                        className="rounded-md border border-border p-1.5 text-muted-foreground hover:border-urgent hover:text-urgent"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
