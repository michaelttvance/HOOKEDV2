import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Truck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type S = { token?: string };

export const Route = createFileRoute("/accept-invite")({
  validateSearch: (s: Record<string, unknown>): S => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Accept invite — Hooked" },
      { name: "description", content: "Accept your invitation to join a Hooked dispatch team and start managing tow requests with AI assistance." },
    ],
  }),
  component: AcceptInvitePage,
});

interface InvitePreview {
  email: string;
  role: string;
  companyName: string;
}

function AcceptInvitePage() {
  const navigate = useNavigate();
  const { token } = useSearch({ from: "/accept-invite" });
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("Missing invite token.");
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .rpc("get_invite_preview", { _token: token })
        .maybeSingle();
      if (error || !data) {
        setError("This invite link is invalid or has already been used.");
      } else {
        setPreview({
          email: (data as { email: string }).email,
          role: (data as { role: string }).role,
          companyName: (data as { company_name: string }).company_name ?? "",
        });
      }
      setLoading(false);
    })();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground glow-primary">
            <Truck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Hooked</h1>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 text-center shadow-2xl">
          {loading && (
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Looking up your invite…
            </div>
          )}
          {!loading && error && (
            <>
              <div className="text-base font-semibold text-urgent">Invite not valid</div>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <Link
                to="/auth"
                className="mt-5 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Go to sign in
              </Link>
            </>
          )}
          {!loading && preview && (
            <>
              <div className="text-base font-semibold">You're invited to {preview.companyName || "the team"}</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Role: <b className="text-foreground">{preview.role}</b><br />
                For <span className="font-mono">{preview.email}</span>
              </p>
              <button
                onClick={() =>
                  navigate({
                    to: "/auth",
                    search: { mode: "signup", token, email: preview.email },
                  })
                }
                className="mt-5 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Create my account & join
              </button>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Already have an account?{" "}
                <Link to="/auth" search={{ email: preview.email }} className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
