"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        await signUp(email, password);
        router.push("/onboarding");
      } else {
        await signIn(email, password);
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-52px)] items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <h1
          className="text-3xl font-bold text-white/90 mb-2"
          style={{ fontFamily: "var(--font-grotesk)" }}
        >
          {mode === "signin" ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-[14px] text-white/30 mb-8">
          {mode === "signin"
            ? "Sign in to access your analyses and settings."
            : "Sign up for 3 free analyses per week."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-white/30">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-[14px] text-white placeholder-white/20 focus:border-[#7dd3fc]/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-white/30">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-[14px] text-white placeholder-white/20 focus:border-[#7dd3fc]/30 focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-[13px] text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full rounded-xl bg-[#7dd3fc] py-3 text-sm font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
            className="text-[13px] text-white/25 hover:text-white/40 transition-colors"
          >
            {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
