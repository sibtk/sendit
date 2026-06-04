"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  tier: string | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  tier: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const AUTH_HINT_KEY = "sendit_has_session";
const TIER_HINT_KEY = "sendit_tier";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Always start true — matches server SSR, no hydration mismatch
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<string | null>(null);
  const supabase = createBrowserClient();

  // Auth resolution: getSession (instant, reads local JWT) + onAuthStateChange (subsequent events)
  useEffect(() => {
    let mounted = true;

    // 1. Fast initial resolve — no network request
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) localStorage.setItem(AUTH_HINT_KEY, "1");
      else localStorage.removeItem(AUTH_HINT_KEY);
    });

    // 2. Listen for subsequent auth changes (token refresh, sign-out from other tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) localStorage.setItem(AUTH_HINT_KEY, "1");
      else localStorage.removeItem(AUTH_HINT_KEY);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // Tier fetch: runs once after auth resolves, shared via context
  useEffect(() => {
    if (loading) return;
    if (!user) {
      setTier(null);
      localStorage.removeItem(TIER_HINT_KEY);
      return;
    }
    // Use cached tier immediately while fresh query loads
    const cached = localStorage.getItem(TIER_HINT_KEY);
    if (cached) setTier(cached);

    supabase.from("user_profiles").select("tier").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        const t = data?.tier || "free";
        setTier(t);
        localStorage.setItem(TIER_HINT_KEY, t);
      });
  }, [user, loading]);

  async function handleSignUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // Supabase returns identities: [] when the user already exists (no error thrown)
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error("already_exists");
    }
  }

  async function handleSignIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function handleSignOut() {
    setUser(null);
    setTier(null);
    localStorage.removeItem(AUTH_HINT_KEY);
    localStorage.removeItem(TIER_HINT_KEY);
    await supabase.auth.signOut({ scope: "local" });
    window.location.href = "/";
  }

  return (
    <AuthContext.Provider value={{
      user,
      tier,
      loading,
      signUp: handleSignUp,
      signIn: handleSignIn,
      signOut: handleSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
