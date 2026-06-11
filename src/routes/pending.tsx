import { createFileRoute, Link } from "@tanstack/react-router";
import { Truck, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const pendingHead = () => ({
  meta: [
    { title: "Account under review — Hooked" },
    { name: "description", content: "Your Hooked account is under review." },
    { name: "robots", content: "noindex" },
  ],
});

export const Route = createFileRoute("/pending")({
  head: pendingHead,
  component: PendingPage,
});

function PendingPage() {
  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground glow-primary">
          <Truck className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Hooked</h1>
        <div className="mt-6 rounded-xl border border-border bg-surface p-6 text-left shadow-2xl">
          <h2 className="text-lg font-semibold">Account under review</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Thanks for your interest in Hooked! Your account is under review. You'll hear from us
            within 24 hours.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Questions?{" "}
            <a
              href="mailto:support@hookaidashboard.com"
              className="text-primary hover:underline"
            >
              support@hookaidashboard.com
            </a>
          </p>
        </div>
        <button
          onClick={signOut}
          className="mx-auto mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-3 w-3" /> Sign out
        </button>
        <p className="mt-3 text-[11px] text-muted-foreground">
          <Link to="/dashboard" className="hover:text-foreground">Refresh status</Link>
        </p>
      </div>
    </div>
  );
}
