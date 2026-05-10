"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FullAnalysis } from "@/lib/types";
import { getAnalysis, deleteAnalysis, CURRENT_PROMPT_VERSION } from "@/lib/storage";
import AnalysisResults from "@/components/analysis/analysis-results";

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [stale, setStale] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const stored = getAnalysis(id);
    if (stored) {
      setAnalysis(stored.analysis);
      if (stored.promptVersion !== CURRENT_PROMPT_VERSION) {
        setStale(true);
      }
    } else {
      setNotFound(true);
    }
  }, [id]);

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
    <div className="mx-auto max-w-6xl px-5 py-6">
      {/* Nav bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1.5 text-sm text-[#52525b] hover:text-[#a1a1aa] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <div className="flex items-center gap-3">
          {stale && (
            <span className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 text-[11px] font-medium text-yellow-400">
              Outdated — re-analyze for updated results
            </span>
          )}
          <button
            onClick={() => {
              deleteAnalysis(id);
              router.push("/");
            }}
            className="text-xs text-[#3f3f46] hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <AnalysisResults analysis={analysis} />
    </div>
  );
}
