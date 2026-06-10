import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "dispatcher" | "driver";

interface ProfileData {
  companyId: string | null;
  companyName: string | null;
  role: AppRole | null;
  fullName: string | null;
  trialEndsAt: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: ProfileData;
}

const AuthCtx = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  profile: { companyId: null, companyName: null, role: null, fullName: null, trialEndsAt: null },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>({
    companyId: null,
    companyName: null,
    role: null,
    fullName: null,
    trialEndsAt: null,
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setProfile({ companyId: null, companyName: null, role: null, fullName: null, trialEndsAt: null });
      return;
    }
    // Defer to avoid blocking the auth callback
    setTimeout(async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase
          .from("profiles")
          .select("company_id, full_name, companies(name, trial_ends_at)")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId).limit(1).maybeSingle(),
      ]);
      const companies =
        (p?.companies as
          | { name?: string; trial_ends_at?: string }
          | { name?: string; trial_ends_at?: string }[]
          | null) ?? null;
      const companyRow = Array.isArray(companies) ? companies[0] : companies;
      setProfile({
        companyId: (p?.company_id as string | null) ?? null,
        companyName: companyRow?.name ?? null,
        role: (r?.role as AppRole | null) ?? null,
        fullName: (p?.full_name as string | null) ?? null,
        trialEndsAt: companyRow?.trial_ends_at ?? null,
      });
    }, 0);
  }, [session?.user?.id]);

  const value = useMemo<AuthState>(
    () => ({ session, user: session?.user ?? null, loading, profile }),
    [session, loading, profile],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
