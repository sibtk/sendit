"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllAnalyses, deleteAnalysis, clearAllAnalyses, clearStaleAnalyses, saveAnalysis, CURRENT_PROMPT_VERSION } from "@/lib/storage";
import { useAuth } from "@/components/auth/auth-provider";
import { createBrowserClient } from "@/lib/auth";

interface AnalysisEntry {
  id: string;
  vehicle: string;
  verdict: string;
  profit: number;
  purchase: number;
  allIn: number;
  sellAt: number;
  platform: string;
  mileage: number | null;
  promptVersion: number;
  createdAt: string;
  thumbnail: string | null;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function AnalysesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [entries, setEntries] = useState<AnalysisEntry[]>([]);
  const [search, setSearch] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function mapRaw(analysis: any, promptVersion: number, createdAt: string): AnalysisEntry | null {
    try {
      const a = analysis.analysis;
      return {
        id: analysis.id,
        vehicle: `${a.vehicle.year} ${a.vehicle.make} ${a.vehicle.model}${a.vehicle.trim ? ` ${a.vehicle.trim}` : ""}`,
        verdict: a.verdict,
        profit: a.financials.scenarios?.expected?.profit ?? a.financials.profit.low,
        purchase: a.financials.purchase,
        allIn: a.financials.allIn.low,
        sellAt: a.financials.salePrice.low,
        platform: analysis.listing.platform,
        mileage: analysis.listing.mileage,
        promptVersion,
        createdAt,
        thumbnail: analysis.listing.imageUrls?.[0] || null,
      };
    } catch {
      return null;
    }
  }

  function loadLocal() {
    const all = getAllAnalyses();
    return all.map((entry) => mapRaw(entry.analysis, entry.promptVersion, entry.createdAt)).filter((e): e is AnalysisEntry => e !== null);
  }

  useEffect(() => {
    if (user) {
      // Logged in — merge localStorage + Supabase, dedupe by ID
      const local = loadLocal();
      setEntries(local); // show local immediately

      const supabase = createBrowserClient();
      supabase
        .from("saved_analyses")
        .select("id, listing_data, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          const cloudEntries: AnalysisEntry[] = [];
          for (const row of data || []) {
            try {
              const analysis = row.listing_data;
              if (!analysis?.analysis || !analysis?.listing) continue;
              const mapped = mapRaw(analysis, CURRENT_PROMPT_VERSION, row.created_at);
              if (mapped) cloudEntries.push(mapped);
            } catch {
              // skip malformed
            }
          }
          // Merge: local + cloud, dedupe by ID, sort newest first
          const allIds = new Set<string>();
          const merged: AnalysisEntry[] = [];
          for (const entry of [...local, ...cloudEntries]) {
            if (!allIds.has(entry.id)) {
              allIds.add(entry.id);
              merged.push(entry);
            }
          }
          merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setEntries(merged);
        });
    } else {
      // Not logged in — localStorage only
      setEntries(loadLocal());
    }
  }, [user]);

  const filtered = search
    ? entries.filter((e) => e.vehicle.toLowerCase().includes(search.toLowerCase()))
    : entries;

  const staleCount = entries.filter((e) => e.promptVersion !== CURRENT_PROMPT_VERSION).length;

  const verdictColors: Record<string, string> = {
    BUY: "text-[#4ade80] bg-[#4ade8012] border-[#4ade8025]",
    PASS: "text-[#f87171] bg-[#f8717112] border-[#f8717125]",
    RISKY: "text-[#fbbf24] bg-[#fbbf2412] border-[#fbbf2425]",
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-[#e4e4e7]">Analyses</h1>
        <div className="flex items-center gap-3">
          {staleCount > 0 && (
            <button
              onClick={() => { clearStaleAnalyses(); setEntries(loadLocal()); }}
              className="text-xs text-yellow-400/60 hover:text-yellow-400 transition-colors"
            >
              Clear {staleCount} outdated
            </button>
          )}
          {entries.length > 0 && (
            <button
              onClick={() => { clearAllAnalyses(); setEntries([]); }}
              className="text-xs text-[#3f3f46] hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-[#52525b] mb-6">
        {entries.length} saved {entries.length === 1 ? "analysis" : "analyses"}
      </p>

      {/* Search */}
      {entries.length > 3 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vehicles..."
          className="w-full mb-6 rounded-xl border border-[#27272a] bg-[#161618] px-4 py-3 text-sm text-[#e4e4e7] placeholder-[#3f3f46]"
        />
      )}

      {/* List */}
      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          {entries.length === 0 ? (
            <>
              <p className="text-[#3f3f46] mb-4">No analyses yet</p>
              <button
                onClick={() => router.push("/")}
                className="text-sm text-[#52525b] hover:text-[#a1a1aa] transition-colors"
              >
                Analyze your first listing →
              </button>
            </>
          ) : (
            <p className="text-[#3f3f46]">No results matching &ldquo;{search}&rdquo;</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((entry) => {
          const isStale = entry.promptVersion !== CURRENT_PROMPT_VERSION;
          return (
            <div
              key={entry.id}
              className="card p-4 hover:border-[#3f3f46] transition-all group"
            >
              <div className="flex items-center gap-4">
                {/* Thumbnail */}
                {entry.thumbnail && (
                  <div className="hidden sm:block h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[#111113]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Info */}
                <button
                  onClick={() => router.push(`/analysis/${entry.id}`)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${verdictColors[entry.verdict] || verdictColors.RISKY}`}>
                      {entry.verdict}
                    </span>
                    <span className="text-sm font-medium text-[#e4e4e7] truncate">
                      {entry.vehicle}
                    </span>
                    {isStale && (
                      <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-[9px] text-yellow-400/60">
                        outdated
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-[12px] text-[#52525b]">
                    <span className="uppercase">{entry.platform}</span>
                    {entry.mileage && <span className="mono">{fmt(entry.mileage)} mi</span>}
                    <span className="mono">All-in ${fmt(entry.allIn)}</span>
                    <span>{timeAgo(entry.createdAt)}</span>
                  </div>
                </button>

                {/* Profit + delete */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`mono text-sm font-bold ${entry.profit >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                      {entry.profit >= 0 ? "+" : ""}${fmt(Math.round(entry.profit))}
                    </div>
                    <div className="mono text-[11px] text-[#3f3f46]">
                      sell ${fmt(entry.sellAt)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAnalysis(entry.id);
                      setEntries(loadLocal());
                    }}
                    className="opacity-0 group-hover:opacity-100 text-[#27272a] hover:text-red-400 transition-all text-sm"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
