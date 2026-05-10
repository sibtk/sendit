"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnalyzeRequest, FullAnalysis } from "@/lib/types";
import { parseAuctionUrl } from "@/lib/platforms";
import { saveAnalysis } from "@/lib/storage";
import { loadSettings } from "@/lib/settings";

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [damageNotes, setDamageNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Settings loaded from /settings page
  const [settings, setSettings] = useState(loadSettings());
  useEffect(() => { setSettings(loadSettings()); }, []);

  const parsed = url ? parseAuctionUrl(url) : null;
  const detectedPlatform = parsed?.platform || null;

  async function handleAnalyze() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setProgress(0);

    const steps = [
      "Scraping listing...",
      "Decoding VIN...",
      "Checking recalls...",
      "Downloading photos...",
      "Running analysis...",
    ];

    let step = 0;
    const timer = setInterval(() => {
      if (step < steps.length) {
        setProgressLabel(steps[step]);
        setProgress(Math.min(90, (step + 1) / steps.length * 90));
        step++;
      }
    }, 1500);

    try {
      const body: AnalyzeRequest = {
        url: url.trim(),
        repairProfile: settings.repairProfile === "custom" ? "budget_shop" : settings.repairProfile,
        userLocation: `${settings.city}, ${settings.state}`,
        userZip: settings.zip,
        damageNotes: damageNotes || undefined,
      };

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      clearInterval(timer);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      setProgress(100);
      setProgressLabel("Done");

      const data: FullAnalysis = await res.json();
      saveAnalysis(data);
      router.push(`/analysis/${data.id}`);
    } catch (e) {
      clearInterval(timer);
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
                placeholder="Paste listing URL..."
                autoFocus
                className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] backdrop-blur-sm px-4 py-3.5 pr-28 text-[15px] text-white placeholder-white/20 transition-all focus:border-[#7dd3fc]/30 focus:outline-none"
              />
              <button
                onClick={handleAnalyze}
                disabled={!url.trim() || loading}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-[#7dd3fc] px-4 py-2 text-sm font-semibold text-[#0a0a0b] transition-all hover:bg-[#a5e4ff] disabled:opacity-20 disabled:cursor-not-allowed active:scale-[0.97]"
              >
                Analyze
              </button>
            </div>

            {/* Damage notes toggle */}
            <div className="mt-3">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="text-[12px] text-white/15 hover:text-white/30 transition-colors"
              >
                {showNotes ? "Hide notes" : "+ Add damage notes"}
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${showNotes ? "mt-2 max-h-20 opacity-100" : "max-h-0 opacity-0"}`}>
                <input
                  type="text"
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  placeholder="Cracked wheel, hidden rust, etc."
                  className="w-full rounded-lg border border-white/[0.06] bg-transparent px-3 py-2 text-[12px] text-white/50 placeholder-white/15 focus:border-white/[0.12] focus:outline-none"
                />
              </div>
            </div>

            {/* Platform detected indicator */}
            {detectedPlatform && (
              <div className="mt-4 text-[11px] text-white/15 mono">
                {detectedPlatform === "iaa" ? "IAA" : "Copart"} listing detected
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-[13px] text-red-400">
                {error}
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
