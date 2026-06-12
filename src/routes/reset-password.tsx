import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { safePublicError } from "@/lib/public-errors";

const resetPasswordHead = () => ({
  meta: [
    { title: "Set new password — Hooked" },
    { name: "description", content: "Choose a new password for your Hooked account." },
  ],
});

export const Route = createFileRoute("/reset-password")({
  head: resetPasswordHead,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(true);

  // Verify recovery token/hash is present
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setValidating(false);
      }
    });

    // Also check current session — recovery sets a session
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setError("This reset link is invalid or has expired.");
      }
      setValidating(false);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      // Sign out so user can sign in with the new password
      await supabase.auth.signOut();
    } catch (err) {
      setError(safePublicError("We couldn't update your password right now. Please try again.", err, "[reset-password] update failed"));
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none";

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
        <div className="text-center text-sm text-muted-foreground">Verifying reset link…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Set new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose a new password for your account.</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-2xl">
          {success ? (
            <div className="space-y-4 text-center">
              <div className="rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">
                Your password has been updated.
              </div>
              <Link
                to="/auth"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Sign in with your new password
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  New password
                </span>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(inputCls, "pl-8")}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Confirm password
                </span>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(inputCls, "pl-8")}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </label>

              {error && (
                <div className="rounded-md border border-urgent/40 bg-urgent/10 p-2 text-xs text-urgent">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Update password
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          <Link to="/auth" className="hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
