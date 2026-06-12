import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { safePublicError } from "@/lib/public-errors";

const forgotPasswordHead = () => ({
  meta: [
    { title: "Reset password — Hooked" },
    { name: "description", content: "Request a password reset for your Hooked account." },
  ],
});

export const Route = createFileRoute("/forgot-password")({
  head: forgotPasswordHead,
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(safePublicError("We couldn't send a reset link right now. Please try again.", err, "[forgot-password] reset failed"));
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email and we’ll send you a reset link.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-2xl">
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">
                Check your email for a password reset link.
              </div>
              <Link
                to="/auth"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Email
                </span>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(inputCls, "pl-8")}
                    placeholder="you@towing.co"
                    autoComplete="email"
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
                Send reset link
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
