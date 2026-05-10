"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AnalyzeRequest,
  FullAnalysis,
  RepairProfile,
  REPAIR_PROFILES,
} from "@/lib/types";
import { parseAuctionUrl } from "@/lib/platforms";
import { saveAnalysis, getAllAnalyses, clearStaleAnalyses } from "@/lib/storage";
import { loadSettings } from "@/lib/settings";

type LoadingStep = {
  label: string;
  done: boolean;
};

interface HistoryEntry {
  id: string;
  vehicle: string;
  verdict: string;
  profit: number;
  createdAt: string;
}

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [repairProfile, setRepairProfile] =
    useState<RepairProfile>("budget_shop");
  const [maxBid, setMaxBid] = useState("");
  const [userZip, setUserZip] = useState("77001");
  const [damageNotes, setDamageNotes] = useState("");
  const [userCity, setUserCity] = useState("Houston, TX");
  const [showOptions, setShowOptions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load settings + history on mount
  useEffect(() => {
    const s = loadSettings();
    setUserZip(s.zip);
    setUserCity(`${s.city}, ${s.state}`);
    if (s.repairProfile !== "custom") {
      setRepairProfile(s.repairProfile as RepairProfile);
    }

    const all = getAllAnalyses();
    setHistory(
      all.map((entry) => ({
        id: entry.analysis.id,
        vehicle: `${entry.analysis.analysis.vehicle.year} ${entry.analysis.analysis.vehicle.make} ${entry.analysis.analysis.vehicle.model}`,
        verdict: entry.analysis.analysis.verdict,
        profit: entry.analysis.analysis.financials.scenarios?.expected?.profit ?? entry.analysis.analysis.financials.profit.low,
        createdAt: entry.createdAt,
      }))
    );
    clearStaleAnalyses();
  }, []);

  const parsed = url ? parseAuctionUrl(url) : null;
  const detectedPlatform = parsed?.platform || null;

  async function handleAnalyze() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);

    const steps: LoadingStep[] = [
      { label: `Detected ${detectedPlatform === "copart" ? "Copart" : "IAA"} listing`, done: false },
      { label: "Scraping vehicle data", done: false },
      { label: "Decoding VIN", done: false },
      { label: "Checking recalls", done: false },
      { label: "Fetching damage photos", done: false },
      { label: "Analyzing damage + market value", done: false },
    ];
    setLoadingSteps([...steps]);

    const stepTimer = setInterval(() => {
      const nextIdx = steps.findIndex((s) => !s.done);
      if (nextIdx >= 0 && nextIdx < steps.length - 1) {
        steps[nextIdx].done = true;
        setLoadingSteps([...steps]);
      }
    }, 1200);

    try {
      const body: AnalyzeRequest = {
        url: url.trim(),
        repairProfile,
        maxBid: maxBid ? parseInt(maxBid) : undefined,
        userLocation: userCity,
        userZip: userZip || "77001",
        damageNotes: damageNotes || undefined,
      };

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      clearInterval(stepTimer);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      steps.forEach((s) => (s.done = true));
      setLoadingSteps([...steps]);

      const data: FullAnalysis = await res.json();
      saveAnalysis(data);
      router.push(`/analysis/${data.id}`);
    } catch (e) {
      clearInterval(stepTimer);
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="mx-auto max-w-6xl px-5">
      {/* Hero section */}
      <div className="flex min-h-[calc(100vh-52px)] flex-col items-center justify-center pb-12 relative">

        {!loading && (
          <div className="w-full max-w-xl">
            {/* Headline — left-aligned, no logo icon, just text */}
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

            {/* URL Field — clean, no card wrapper */}
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleAnalyze()}
                placeholder="Paste listing URL..."
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

            {/* Settings — compact row */}
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="flex items-center gap-1.5 text-[12px] text-white/20 hover:text-white/40 transition-all"
              >
                <svg
                  width="10" height="10" viewBox="0 0 12 12" fill="none"
                  className={`transition-transform duration-300 ${showOptions ? "rotate-180" : ""}`}
                >
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Settings
              </button>
              {repairProfile !== "budget_shop" && (
                <span className="text-[11px] text-white/15 mono">{REPAIR_PROFILES[repairProfile].label}</span>
              )}
              {maxBid && (
                <span className="text-[11px] text-white/15 mono">Max ${parseInt(maxBid).toLocaleString()}</span>
              )}
            </div>

            {/* Settings panel */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                showOptions ? "mt-4 max-h-[300px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="mb-1 block text-[10px] text-white/25">Profile</label>
                  <select
                    value={repairProfile}
                    onChange={(e) => setRepairProfile(e.target.value as RepairProfile)}
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-[12px] text-white/60 focus:border-white/[0.15] focus:outline-none"
                  >
                    {Object.entries(REPAIR_PROFILES).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-white/25">Max Bid</label>
                  <input
                    type="number"
                    value={maxBid}
                    onChange={(e) => setMaxBid(e.target.value)}
                    placeholder="$"
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-[12px] mono text-white/60 placeholder-white/15 focus:border-white/[0.15] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-white/25">Zip</label>
                  <input
                    type="text"
                    value={userZip}
                    onChange={(e) => setUserZip(e.target.value)}
                    placeholder="77001"
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-[12px] mono text-white/60 placeholder-white/15 focus:border-white/[0.15] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-white/25">Damage notes</label>
                <input
                  type="text"
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  placeholder="Anything the photos might miss..."
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-[12px] text-white/60 placeholder-white/15 focus:border-white/[0.15] focus:outline-none"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="w-full max-w-sm mx-auto animate-fade-in-up">
            <div className="flex justify-center mb-8">
              <div className="relative h-16 w-16">
                <svg className="h-16 w-16 animate-spin" style={{ animationDuration: "3s" }} viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="28" stroke="#1e1e21" strokeWidth="3" />
                  <path d="M32 4 A28 28 0 0 1 60 32" stroke="#d4d4d8" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="mono text-xs text-[#52525b]">
                    {loadingSteps.filter(s => s.done).length}/{loadingSteps.length}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-0">
              {loadingSteps.map((step, i) => {
                const currentIdx = loadingSteps.findIndex((s) => !s.done);
                const isCurrent = i === currentIdx;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 py-2 transition-all duration-500 ${
                      step.done ? "opacity-40" : isCurrent ? "opacity-100" : "opacity-15"
                    }`}
                  >
                    <div className="w-5 flex justify-center">
                      {step.done ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 7L6 10L11 4" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : isCurrent ? (
                        <div className="h-2 w-2 rounded-full bg-[#d4d4d8] animate-pulse" />
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-[#27272a]" />
                      )}
                    </div>
                    <span className={`text-[13px] ${isCurrent ? "text-[#d4d4d8] font-medium" : "text-[#71717a]"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* History lives at /analyses — keep home page clean */}
    </div>
  );
}
