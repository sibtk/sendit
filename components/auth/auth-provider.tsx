"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const AUTH_HINT_KEY = "sendit_has_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  // Optimistic: if localStorage hint exists, assume logged in so nav doesn't flash
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return !!localStorage.getItem(AUTH_HINT_KEY);
  });
  const supabase = createBrowserClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      // Sync hint
      if (user) localStorage.setItem(AUTH_HINT_KEY, "1");
      else localStorage.removeItem(AUTH_HINT_KEY);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
      if (session?.user) localStorage.setItem(AUTH_HINT_KEY, "1");
      else localStorage.removeItem(AUTH_HINT_KEY);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function handleSignIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function handleSignOut() {
    setUser(null);
    localStorage.removeItem(AUTH_HINT_KEY);
    await supabase.auth.signOut({ scope: "local" });
    window.location.href = "/";
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUp: handleSignUp,
      signIn: handleSignIn,
      signOut: handleSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
