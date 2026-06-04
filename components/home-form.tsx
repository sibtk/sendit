"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseAuctionUrl } from "@/lib/platforms";
import { loadSettings } from "@/lib/settings";
import { useAuth } from "@/components/auth/auth-provider";
import { createBrowserClient } from "@/lib/auth";

export function HomeForm() {
  const router = useRouter();
  const { user, tier: userTier } = useAuth();
  const [url, setUrl] = useState("");
  const [damageNotes, setDamageNotes] = useState("");
  const [sellerType, setSellerType] = useState("");
  const [currentBid, setCurrentBid] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  // Settings loaded from /settings page
  const [settings, setSettings] = useState(loadSettings());

  // Check if logged-in user needs onboarding
  useEffect(() => {
    if (!user) return;
    const supabase = createBrowserClient();
    supabase.from("user_profiles").select("onboarded").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data && !data.onboarded) {
          router.push("/onboarding");
        }
      });
  }, [user]);

  // Auto-analyze if URL + fresh params are in query string (from re-analyze button)
  useEffect(() => {
    setSettings(loadSettings());
    const paramUrl = searchParams.get("url");
    const fresh = searchParams.get("fresh");
    if (paramUrl) {
      setUrl(paramUrl);
      if (fresh === "true") {
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
    setError(null);

    // Validate URL before starting analysis
    const validated = parseAuctionUrl(url.trim());
    if (!validated) {
      setError("Paste a valid Copart or IAA listing URL.");
      return;
    }

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

    // Navigate to streaming results page — shows progressive content as analysis runs
    const params = new URLSearchParams();
    params.set("url", url.trim());
    params.set("repairProfile", settings.repairProfile === "custom" ? "budget_shop" : settings.repairProfile);
    params.set("userLocation", `${settings.city}, ${settings.state}`);
    params.set("userZip", settings.zip);
    if (currentBid) params.set("currentBid", currentBid);
    const notes = [damageNotes, sellerType ? `Seller type: ${sellerType}` : ""].filter(Boolean).join(". ");
    if (notes) params.set("damageNotes", notes);
    if (isFresh) params.set("fresh", "true");

    router.push(`/analysis/live?${params.toString()}`);
  }

  return (
    <>
      <style>{`body { overflow: hidden; height: 100vh; } footer { position: fixed; bottom: 0; left: 0; right: 0; }`}</style>

      {!user && (
        <p className="mb-8 text-[12px] text-white/15">
          Try it free — no account or card required.
        </p>
      )}
      {user && userTier && userTier === "free" && (
        <div className="mb-8 flex items-center gap-3">
          <a
            href="/pricing"
            className="text-[12px] text-[#7dd3fc]/60 hover:text-[#7dd3fc] transition-colors"
          >
            Upgrade to Pro — 50 scans/month →
          </a>
        </div>
      )}
      {user && (userTier === "pro" || userTier === "dealer") && (
        <div className="mb-8" />
      )}

      {/* URL input */}
      <div className="relative">
        <input
          type="text"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null); }}
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          placeholder="Paste IAA or Copart listing URL..."
          autoFocus
          className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] backdrop-blur-sm px-4 py-3.5 pr-28 text-[15px] text-white placeholder-white/20 transition-all focus:border-[#7dd3fc]/30 focus:outline-none"
        />
        <button
          onClick={handleAnalyze}
          disabled={!url.trim()}
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

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-4">
          <div className="text-[13px] text-red-400">{error}</div>
        </div>
      )}
    </>
  );
}
