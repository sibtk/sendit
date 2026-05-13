"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FullAnalysis } from "@/lib/types";
import { getAnalysis, deleteAnalysis, CURRENT_PROMPT_VERSION } from "@/lib/storage";
import { createBrowserClient } from "@/lib/auth";
import AnalysisResults from "@/components/analysis/analysis-results";
import WatchButton from "@/components/flips/watch-button";
import { useAuth } from "@/components/auth/auth-provider";

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [stale, setStale] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    // Try localStorage first — if it's here, they own it
    const stored = getAnalysis(id);
    if (stored) {
      setAnalysis(stored.analysis);
      setIsOwner(true);
      if (stored.promptVersion !== CURRENT_PROMPT_VERSION) {
        setStale(true);
      }
      return;
    }

    // Fallback: try Supabase DB (for shared links)
    (async () => {
      try {
        const supabase = createBrowserClient();
        const { data } = await supabase
          .from("saved_analyses")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (data && data.listing_data) {
          const full = data.listing_data as FullAnalysis;
          if (full.analysis) {
            setAnalysis(full);
          } else {
            setAnalysis({
              id: data.id,
              listing: data.listing_data,
              vinDecode: null,
              fees: { platform: data.platform, bidAmount: 0, buyerPremium: 0, gateFee: 0, internetBidFee: 0, environmentalFee: 0, titleFee: 0, totalFees: 0, totalWithBid: 0 },
              shipping: null,
              analysis: data.analysis_result,
              auctionComps: null,
              retailComps: null,
              repairProfile: data.repair_profile || "budget_shop",
              userLocation: data.user_location || "Houston, TX",
              createdAt: data.created_at,
            });
          }
          // Check ownership — if user_id matches current user
          setIsOwner(!!user && data.user_id === user.id);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      }
    })();
  }, [id, user]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-16 text-center">
        <h1 className="text-xl font-bold text-[#e4e4e7] mb-3">Analysis not found</h1>
        <p className="text-sm text-[#52525b] mb-6">This analysis may have been cleared or doesn&apos;t exist.</p>
        <button
          onClick={() => router.push("/")}
          className="rounded-xl bg-[#e4e4e7] px-6 py-2.5 text-sm font-semibold text-[#0a0a0b] hover:bg-white transition-all"
        >
          Analyze a new listing
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-16 text-center">
        <div className="h-6 w-6 mx-auto rounded-full border-2 border-[#27272a] border-t-[#d4d4d8] animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-3 sm:px-5 py-4 sm:py-6">
      {/* Nav bar — compact on mobile */}
      <div className="flex items-center justify-between mb-3 sm:mb-6">
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1 text-[12px] sm:text-sm text-[#52525b] hover:text-[#a1a1aa] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={() => router.push("/")}
            className="rounded-md sm:rounded-lg bg-[#7dd3fc] px-2 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-[12px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all"
          >
            + New
          </button>
          {isOwner && analysis && <WatchButton analysisId={id} analysis={analysis} />}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              const btn = document.activeElement as HTMLButtonElement;
              const orig = btn.textContent;
              btn.textContent = "Copied!";
              setTimeout(() => { btn.textContent = orig; }, 1500);
            }}
            className="rounded-md sm:rounded-lg border border-white/[0.08] px-2 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-[12px] text-white/40 hover:text-white/60 transition-all"
          >
            Share
          </button>
          {analysis?.listing?.url && (
            <a
              href={analysis.listing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md sm:rounded-lg border border-white/[0.08] px-2 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-[12px] text-white/40 hover:text-white/60 transition-all"
            >
              View Listing ↗
            </a>
          )}
          {isOwner && (
            <button
              onClick={() => {
                const url = analysis?.listing?.url;
                if (url) {
                  deleteAnalysis(id);
                  router.push(`/?url=${encodeURIComponent(url)}&fresh=true`);
                } else {
                  router.push("/");
                }
              }}
              className="rounded-md sm:rounded-lg border border-white/[0.08] px-2 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-[12px] text-white/40 hover:text-white/60 transition-all"
            >
              Re-analyze
            </button>
          )}
          {stale && isOwner && (
            <span className="hidden sm:inline rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 text-[11px] font-medium text-yellow-400">
              Outdated
            </span>
          )}
        </div>
      </div>

      {/* Signup CTA for anonymous viewers */}
      {!user && !isOwner && analysis && (
        <div className="mb-4 rounded-xl border border-[#7dd3fc]/15 bg-[#7dd3fc]/[0.03] px-5 py-4 flex items-center justify-between">
          <p className="text-[13px] text-[#a1a1aa]">Want to analyze your own cars? <span className="text-[#7dd3fc]">Try it free.</span></p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/login")}
              className="rounded-lg bg-[#7dd3fc] px-4 py-1.5 text-[12px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all"
            >
              Sign up free
            </button>
            <button
              onClick={() => router.push("/pricing")}
              className="rounded-lg border border-white/[0.08] px-4 py-1.5 text-[12px] text-white/40 hover:text-white/60 transition-all"
            >
              Plans
            </button>
          </div>
        </div>
      )}

      <AnalysisResults analysis={analysis} isOwner={isOwner} />
    </div>
  );
}
