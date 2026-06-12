import { createFileRoute, Link } from "@tanstack/react-router";
import { Truck, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const trialExpiredHead = () => ({
  meta: [
    { title: "Trial expired — Hooked" },
    { name: "description", content: "Your Hooked free trial has ended." },
    { name: "robots", content: "noindex" },
  ],
});

export const Route = createFileRoute("/trial-expired")({
  head: trialExpiredHead,
  component: TrialExpiredPage,
});

function TrialExpiredPage() {
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
          <h2 className="text-lg font-semibold">Your free trial has ended</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Thanks for trying Hooked! Your 30-day free trial has ended. To keep using your
            dispatch board, driver app, billing, and support tools, reach out and we'll get you
            set up on a plan.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Contact us at{" "}
            <a
              href="mailto:mike@hookaidashboard.com"
              className="text-primary hover:underline"
            >
              mike@hookaidashboard.com
            </a>{" "}
            to continue.
          </p>
        </div>
        <button
          onClick={signOut}
          className="mx-auto mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-3 w-3" /> Sign out
        </button>
        <p className="mt-3 text-[11px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
