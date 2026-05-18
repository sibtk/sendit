"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        await signUp(email, password);
        setCheckEmail(true);
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

  if (checkEmail) {
    return (
      <div className="flex min-h-[calc(100vh-52px)] items-center justify-center px-5">
        <div className="w-full max-w-sm text-center">
          <div className="text-3xl mb-4">📬</div>
          <h1 className="text-2xl font-bold text-white/90 mb-2" style={{ fontFamily: "var(--font-grotesk)" }}>
            Check your email
          </h1>
          <p className="text-[14px] text-white/30 mb-2">
            We sent a confirmation link to
          </p>
          <p className="text-[14px] text-[#7dd3fc] mono mb-6">{email}</p>
          <p className="text-[12px] text-white/20">
            Click the link to activate your account. Check spam if you don't&nbsp;see&nbsp;it.
          </p>
        </div>
      </div>
    );
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

          {mode === "signup" && (
            <label className="flex items-start gap-3 cursor-pointer group">
              <button
                type="button"
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                className={`mt-0.5 w-4 h-4 rounded shrink-0 border transition-all flex items-center justify-center ${
                  agreedToTerms
                    ? "bg-[#7dd3fc] border-[#7dd3fc]"
                    : "border-white/15 bg-white/[0.03] group-hover:border-white/25"
                }`}
              >
                {agreedToTerms && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#0a0a0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <span className="text-[12px] text-white/30 leading-relaxed">
                I agree to the <a href="/terms" target="_blank" className="text-[#7dd3fc]/60 hover:text-[#7dd3fc]">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-[#7dd3fc]/60 hover:text-[#7dd3fc]">Privacy Policy</a>
              </span>
            </label>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-[13px] text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password || (mode === "signup" && !agreedToTerms)}
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
