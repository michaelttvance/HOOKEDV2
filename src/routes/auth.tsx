import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Mail, Lock, Loader2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { notifyAdminOfSignup } from "@/lib/approval.functions";
import { cn } from "../lib/utils";
import { oauth } from "@/integrations/oauth";


type AuthSearch = { redirect?: string; token?: string; email?: string; mode?: "signin" | "signup" };

const authHead = () => ({
  meta: [
    { title: "Sign in — Hooked" },
    {
      name: "description",
      content:
        "Sign in to your Hooked dispatch account to manage your tow fleet, track drivers, and handle billing.",
    },
  ],
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    token: typeof s.token === "string" ? s.token : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
    mode: s.mode === "signup" || s.mode === "signin" ? s.mode : undefined,
  }),
  head: authHead,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const hasToken = !!search.token;
  const [mode, setMode] = useState<"signin" | "signup">(
    hasToken ? (search.mode === "signin" ? "signin" : "signup") : "signin",
  );
  const [email, setEmail] = useState(search.email ?? "");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const notifyAdmin = useServerFn(notifyAdminOfSignup);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: search.redirect ?? "/dashboard", replace: true });
    });
  }, [navigate, search.redirect]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: search.redirect ?? "/dashboard", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              invite_token: search.token,
              full_name: fullName || undefined,
              company_name: companyName || undefined,
              phone: phone || undefined,
            },
          },
        });
        if (error) throw error;
        if (data.session) {
          notifyAdmin().catch((e) => console.warn("[signup] notify failed", e));
          navigate({ to: search.redirect ?? "/dashboard", replace: true });
        } else {
          setNotice("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function oauthSignIn(provider: "google" | "azure") {
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const result = await oauth.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin + (search.redirect ?? "/dashboard"),
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: search.redirect ?? "/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-slate-900/50 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-[#FACC15] focus:outline-none focus:ring-2 focus:ring-[#FACC15]/40 transition-all";

  const heading =
    mode === "signin"
      ? "Welcome back"
      : search.token
      ? "Join your team"
      : "Create your account";
  const subheading =
    mode === "signin"
      ? "Sign in to your dispatch board"
      : search.token
      ? "Finish setup to join Hooked"
      : "Spin up your tow company on Hooked";

  return (
    <div className="flex min-h-screen w-full bg-[#0B1220] font-sans text-slate-200">
      {/* Storytelling side */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/5 p-12 lg:flex lg:w-1/2">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(#FACC15 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0B1220] via-transparent to-[#FACC15]/10" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FACC15] shadow-[0_0_20px_rgba(250,204,21,0.3)]">
              <span className="text-xl font-extrabold text-black">H</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Hooked</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-extrabold leading-tight text-white">
            Dispatch Smarter.
            <br />
            <span className="text-[#FACC15]">Tow Faster.</span>
          </h1>
        </div>

        <div className="relative z-10 text-xs uppercase tracking-widest text-slate-500">
          © {new Date().getFullYear()} Hooked
        </div>
      </div>

      {/* Form side */}
      <div className="relative flex w-full flex-col items-center justify-center p-6 sm:p-12 lg:w-1/2">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FACC15] shadow-lg">
                <span className="text-2xl font-extrabold text-black">H</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Hooked</span>
            </div>
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-white">{heading}</h2>
            <p className="mt-2 text-slate-400">{subheading}</p>
          </div>

          {hasToken && (
            <div className="mb-8 flex rounded-xl border border-white/10 bg-white/5 p-1">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-sm font-semibold transition-all",
                    mode === m
                      ? "bg-[#FACC15] text-black shadow-sm"
                      : "text-slate-400 hover:text-white",
                  )}
                >
                  {m === "signin" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => oauthSignIn("google")}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white transition-all hover:border-white/30 hover:bg-white/10 disabled:opacity-60"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12S6.8 21.5 12 21.5c6.9 0 9.4-4.9 9.4-7.4 0-.5-.05-.9-.12-1.3H12z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-wider text-slate-500">or continue with email</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-5">

            {mode === "signup" && !search.token && (
              <Field label="Company name">
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Mike's Towing"
                  className={cn(inputCls, "pl-4")}
                />
              </Field>
            )}
            {mode === "signup" && (
              <Field label="Your name">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Mike D."
                  className={cn(inputCls, "pl-4")}
                />
              </Field>
            )}
            {mode === "signup" && !search.token && (
              <Field label="Phone">
                <div className="group relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-[#FACC15]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    autoComplete="tel"
                    className={inputCls}
                  />
                </div>
              </Field>
            )}

            <Field label="Email address">
              <div className="group relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-[#FACC15]" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder="you@towing.co"
                  autoComplete="email"
                />
              </div>
            </Field>

            <Field
              label="Password"
              extra={
                mode === "signin" ? (
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-[#FACC15] hover:underline"
                  >
                    Forgot password?
                  </Link>
                ) : null
              }
            >
              <div className="group relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-[#FACC15]" />
                <input
                  required
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputCls}
                  placeholder="••••••••"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
              </div>
            </Field>

            {search.token && (
              <div className="rounded-xl border border-[#FACC15]/30 bg-[#FACC15]/10 p-3 text-xs text-[#FACC15]">
                You've been invited to a Hooked team — finish signing up to join.
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                {error}
              </div>
            )}
            {notice && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FACC15] py-3.5 text-sm font-bold text-black shadow-[0_4px_14px_0_rgba(250,204,21,0.2)] transition-all hover:bg-[#EAB308] active:scale-[0.98] disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  extra,
}: {
  label: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {extra}
      </span>
      {children}
    </label>
  );
}
