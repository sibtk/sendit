"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnalyzeRequest, FullAnalysis } from "@/lib/types";
import { parseAuctionUrl } from "@/lib/platforms";
import { saveAnalysis } from "@/lib/storage";
import { loadSettings } from "@/lib/settings";
import { useAuth } from "@/components/auth/auth-provider";
import { createBrowserClient } from "@/lib/auth";

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [damageNotes, setDamageNotes] = useState("");
  const [sellerType, setSellerType] = useState("");
  const [currentBid, setCurrentBid] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  const searchParams = useSearchParams();

  // Settings loaded from /settings page
  const [settings, setSettings] = useState(loadSettings());

  // Auto-analyze if URL + fresh params are in query string (from re-analyze button)
  useEffect(() => {
    setSettings(loadSettings());
    const paramUrl = searchParams.get("url");
    const fresh = searchParams.get("fresh");
    if (paramUrl) {
      setUrl(paramUrl);
      if (fresh === "true") {
        // Auto-trigger analysis after a tick
        setTimeout(() => {
          const btn = document.querySelector("[data-analyze-btn]") as HTMLButtonElement;
          btn?.click();
        }, 100);
      }
    }
  }, [searchParams]);

  const parsed = url ? parseAuctionUrl(url) : null;
  const detectedPlatform = parsed?.platform || null;

  async function handleAnalyze() {
    if (!url.trim()) return;
    const isFresh = searchParams.get("fresh") === "true";

    // Client-side cache check — skip API entirely if we have this URL cached locally
    if (!isFresh) {
      const { findByUrl } = await import("@/lib/storage");
      const cachedId = findByUrl(url.trim());
      if (cachedId) {
        router.push(`/analysis/${cachedId}`);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    const steps = [
      { label: "Scraping listing...", pct: 15, delay: 800 },
      { label: "Decoding VIN...", pct: 30, delay: 1200 },
      { label: "Pulling comps...", pct: 45, delay: 1500 },
      { label: "Downloading photos...", pct: 55, delay: 2000 },
      { label: "Analyzing damage...", pct: 65, delay: 2500 },
      { label: "Crunching numbers...", pct: 75, delay: 3000 },
      { label: "Almost there...", pct: 82, delay: 4000 },
      { label: "Finalizing...", pct: 88, delay: 5000 },
    ];

    let step = 0;
    const timer = { clear: false };
    const advanceStep = () => {
      if (timer.clear || step >= steps.length) return;
      setProgressLabel(steps[step].label);
      setProgress(steps[step].pct);
      const delay = steps[step].delay;
      step++;
      if (step < steps.length) {
        setTimeout(advanceStep, delay);
      }
    };
    advanceStep();

    try {
      const body: AnalyzeRequest = {
        url: url.trim(),
        repairProfile: settings.repairProfile === "custom" ? "budget_shop" : settings.repairProfile,
        userLocation: `${settings.city}, ${settings.state}`,
        userZip: settings.zip,
        currentBid: currentBid ? parseInt(currentBid) : undefined,
        damageNotes: [
          damageNotes,
          sellerType ? `Seller type: ${sellerType}` : "",
        ].filter(Boolean).join(". ") || undefined,
        fresh: isFresh || undefined,
      };

      // Get auth token if signed in
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try {
        const supabase = createBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
      } catch {}

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      timer.clear = true;

      if (!res.ok) {
        let errorMsg = `Analysis failed (${res.status})`;
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
          if (res.status === 429) {
            setError(data.error);
            setRateLimited(true);
            return;
          }
        } catch {
          // Response wasn't JSON (timeout, server error page, etc.)
          if (res.status === 504) errorMsg = "Analysis timed out. Try again.";
        }
        throw new Error(errorMsg);
      }

      setProgress(100);
      setProgressLabel("Done");

      const data: FullAnalysis = await res.json();
      saveAnalysis(data);
      router.push(`/analysis/${data.id}`);
    } catch (e) {
      timer.clear = true;
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5">
      <div className="flex min-h-[calc(100vh-52px)] flex-col items-center justify-center pb-12 relative">

        {!loading && (
          <div className="w-full max-w-xl">
            <h1
              className="mb-2 text-5xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-grotesk)" }}
            >
              <span className="text-white/90">Should you </span>
              <span
                className="text-[#7dd3fc]"
                style={{
                  textShadow: "0 0 40px rgba(125,211,252,0.3), 0 0 80px rgba(125,211,252,0.1)",
                }}
              >
                send it
              </span>
              <span className="text-white/90">?</span>
            </h1>
            <p className="mb-8 text-[15px] text-white/30">
              Paste an IAA or Copart URL. Get the verdict.
            </p>

            {/* URL input */}
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleAnalyze()}
                placeholder="Paste IAA or Copart listing URL..."
                autoFocus
                className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] backdrop-blur-sm px-4 py-3.5 pr-28 text-[15px] text-white placeholder-white/20 transition-all focus:border-[#7dd3fc]/30 focus:outline-none"
              />
              <button
                onClick={handleAnalyze}
                disabled={!url.trim() || loading}
                data-analyze-btn
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-[#7dd3fc] px-4 py-2 text-sm font-semibold text-[#0a0a0b] transition-all hover:bg-[#a5e4ff] disabled:opacity-20 disabled:cursor-not-allowed active:scale-[0.97]"
              >
                Analyze
              </button>
            </div>

            {/* Extra context toggle */}
            <div className="mt-3">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="text-[12px] text-white/15 hover:text-white/30 transition-colors"
              >
                {showNotes ? "Hide details" : "+ Add details"}
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${showNotes ? "mt-3 max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="flex gap-2 mb-2">
                  <select
                    value={sellerType}
                    onChange={(e) => setSellerType(e.target.value)}
                    className="rounded-lg border border-white/[0.06] bg-transparent px-2.5 py-2 text-[12px] text-white/50 focus:border-white/[0.12] focus:outline-none"
                  >
                    <option value="">Seller type</option>
                    <option value="insurance">Insurance</option>
                    <option value="dealer">Dealer</option>
                    <option value="private">Private</option>
                    <option value="fleet">Fleet / Rental</option>
                  </select>
                  <input
                    type="number"
                    value={currentBid}
                    onChange={(e) => setCurrentBid(e.target.value)}
                    placeholder="Current bid $"
                    className="flex-1 rounded-lg border border-white/[0.06] bg-transparent px-2.5 py-2 text-[12px] mono text-white/50 placeholder-white/15 focus:border-white/[0.12] focus:outline-none"
                  />
                </div>
                <input
                  type="text"
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  placeholder="Damage notes — cracked wheel, hidden rust, etc."
                  className="w-full rounded-lg border border-white/[0.06] bg-transparent px-2.5 py-2 text-[12px] text-white/50 placeholder-white/15 focus:border-white/[0.12] focus:outline-none"
                />
              </div>
            </div>

            {/* Platform detected indicator */}
            {detectedPlatform && (
              <div className="mt-4 text-[11px] text-white/15 mono">
                {detectedPlatform === "iaa" ? "IAA" : "Copart"} listing detected
              </div>
            )}

            {/* Error / Rate limit */}
            {error && (
              <div className={`mt-4 rounded-xl border px-4 py-4 ${
                rateLimited
                  ? "border-[#7dd3fc]/20 bg-[#7dd3fc]/[0.04]"
                  : "border-red-500/20 bg-red-500/[0.06]"
              }`}>
                <div className={`text-[13px] ${rateLimited ? "text-[#7dd3fc]" : "text-red-400"}`}>
                  {error}
                </div>
                {rateLimited && (
                  <button
                    onClick={() => router.push("/login")}
                    className="mt-3 rounded-lg bg-[#7dd3fc] px-4 py-2 text-sm font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all"
                  >
                    Sign up free →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="w-full max-w-sm mx-auto text-center">
            {/* Progress bar */}
            <div className="w-full h-1 rounded-full bg-white/[0.05] mb-6 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#7dd3fc] transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-[13px] text-white/40">{progressLabel}</div>
          </div>
        )}
      </div>
    </div>
  );
}
