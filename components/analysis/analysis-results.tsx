"use client";

import { FullAnalysis, Verdict } from "@/lib/types";
import { getPartLinks } from "@/lib/parts-links";
import { createBrowserClient } from "@/lib/auth";
import { useState, useEffect, useCallback } from "react";

// Persist user edits per analysis
interface AddedPart {
  name: string;
  type: "OEM" | "aftermarket" | "used";
  low: number;
  high: number;
}

interface UserEdits {
  repairOverride: number | null;
  sellOverride: number | null;
  partOverrides: Record<number, { low?: number; high?: number }>;
  laborHoursOverride: number | null;
  paintOverride: { low?: number; high?: number };
  deletedParts: number[];
  addedParts: AddedPart[];
  noShipping: boolean;
  userNotes: string;
  sliderPrice: number;
}

function loadEdits(id: string): Partial<UserEdits> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`sendit_edits_${id}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveEdits(id: string, edits: UserEdits) {
  localStorage.setItem(`sendit_edits_${id}`, JSON.stringify(edits));
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// Convert BidFax date "10.05.2026" → "May 10"
function fmtDate(d: string): string {
  const parts = d.split(".");
  if (parts.length !== 3) return d;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[parseInt(parts[1]) - 1] || parts[1];
  return `${month} ${parseInt(parts[0])}`;
}

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const styles = {
    BUY: "text-buy glow-buy bg-buy",
    PASS: "text-pass glow-pass bg-pass",
    RISKY: "text-risky glow-risky bg-risky",
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl sm:rounded-2xl border px-3 py-1.5 text-sm sm:px-8 sm:py-4 sm:text-3xl font-bold tracking-wider sm:tracking-widest animate-pulse-glow ${styles[verdict]}`}
    >
      {verdict}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors = {
    minor: "bg-green-500/12 text-green-400 border-green-500/25",
    moderate: "bg-yellow-500/12 text-yellow-400 border-yellow-500/25",
    severe: "bg-red-500/12 text-red-400 border-red-500/25",
  };
  return (
    <span
      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${colors[severity as keyof typeof colors] || colors.moderate}`}
    >
      {severity}
    </span>
  );
}

function PartTypeBadge({ type }: { type: string }) {
  const normalized = type.toLowerCase().replace(/\s+/g, "");
  const badgeMap: Record<string, string> = {
    oem: "badge-oem",
    aftermarket: "badge-aftermarket",
    used: "badge-used",
    lkq: "badge-lkq",
    recycled: "badge-recycled",
  };
  const cls = badgeMap[normalized] || "badge-aftermarket";
  return (
    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {type}
    </span>
  );
}

function FlagPill({
  text,
  type,
}: {
  text: string;
  type: "green" | "red";
}) {
  return (
    <span
      className={`inline-block rounded-lg border px-3.5 py-2 text-xs font-medium leading-tight ${
        type === "green"
          ? "border-green-500/25 bg-green-500/8 text-green-400 shadow-[0_0_12px_#4ade8015]"
          : "border-red-500/25 bg-red-500/8 text-red-400 shadow-[0_0_12px_#f8717115]"
      }`}
    >
      {text}
    </span>
  );
}

export default function AnalysisResults({
  analysis,
  isOwner = true,
}: {
  analysis: FullAnalysis;
  isOwner?: boolean;
}) {
  const { analysis: a, listing, vinDecode, fees, shipping } = analysis;
  const [expandedParts, setExpandedParts] = useState<Set<number>>(new Set());

  // Load saved edits on mount
  const saved = typeof window !== "undefined" ? loadEdits(analysis.id) : {};

  const [sliderPrice, setSliderPrice] = useState(saved.sliderPrice ?? (a.financials.purchase || 0));
  const [repairOverride, setRepairOverride] = useState<number | null>(saved.repairOverride ?? null);
  const [sellOverride, setSellOverride] = useState<number | null>(saved.sellOverride ?? null);
  const [partOverrides, setPartOverrides] = useState<Record<number, { low?: number; high?: number }>>(saved.partOverrides ?? {});
  const [laborHoursOverride, setLaborHoursOverride] = useState<number | null>(saved.laborHoursOverride ?? null);
  const [paintOverride, setPaintOverride] = useState<{ low?: number; high?: number }>(saved.paintOverride ?? {});
  const [deletedParts, setDeletedParts] = useState<number[]>(saved.deletedParts ?? []);
  const [addedParts, setAddedParts] = useState<AddedPart[]>(saved.addedParts ?? []);
  const [showAddPart, setShowAddPart] = useState(false);
  const [noShipping, setNoShipping] = useState(saved.noShipping ?? false);
  const [userNotes, setUserNotes] = useState(saved.userNotes ?? "");
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showAllComps, setShowAllComps] = useState(false);
  const [showAllRetail, setShowAllRetail] = useState(false);
  const [askInput, setAskInput] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askHistory, setAskHistory] = useState<{ q: string; a: string }[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportSent, setReportSent] = useState(false);

  async function handleAsk() {
    if (!askInput.trim() || askLoading) return;
    const question = askInput.trim();
    setAskInput("");
    setAskLoading(true);
    try {
      const vehicleSummary = `${a.vehicle.year} ${a.vehicle.make} ${a.vehicle.model} ${a.vehicle.trim || ""} — ${a.vehicle.engine || ""}, ${listing.mileage ? listing.mileage.toLocaleString() + " miles" : ""}, ${listing.titleStatus || ""}`;
      const analysisContext = `Damage: ${a.damageAssessment.details}. Repair estimate: $${a.repairEstimate.total.low}-$${a.repairEstimate.total.high}. Start code: ${listing.startCode || "unknown"}.`;

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, vehicleSummary, analysisContext }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setAskHistory(prev => [...prev, { q: question, a: data.answer }]);
    } catch {
      setAskHistory(prev => [...prev, { q: question, a: "Sorry, couldn't get an answer." }]);
    } finally {
      setAskLoading(false);
    }
  }
  const [showExtraPhoto, setShowExtraPhoto] = useState(false);
  const [extraPhotoUrl, setExtraPhotoUrl] = useState("");
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [extraFindings, setExtraFindings] = useState<string[]>([]);

  async function handleExtraPhoto() {
    if (!extraPhotoUrl.trim()) return;
    setAnalyzingPhoto(true);
    try {
      const vehicleSummary = `${a.vehicle.year} ${a.vehicle.make} ${a.vehicle.model} ${a.vehicle.trim || ""}`.trim();
      const res = await fetch("/api/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: extraPhotoUrl, vehicleSummary }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setExtraFindings(prev => [...prev, data.finding]);
      setExtraPhotoUrl("");
      setShowExtraPhoto(false);
    } catch {
      // silently fail
    } finally {
      setAnalyzingPhoto(false);
    }
  }

  // Auto-save edits on any change
  const doSave = useCallback(() => {
    saveEdits(analysis.id, {
      repairOverride, sellOverride, partOverrides,
      laborHoursOverride, paintOverride, deletedParts, addedParts, noShipping, userNotes, sliderPrice,
    });
  }, [analysis.id, repairOverride, sellOverride, partOverrides, laborHoursOverride, paintOverride, deletedParts, addedParts, noShipping, userNotes, sliderPrice]);

  useEffect(() => { doSave(); }, [doSave]);

  // Compute effective repair total from part/labor/paint overrides
  const hasPartOverrides = Object.keys(partOverrides).length > 0
    || laborHoursOverride !== null
    || paintOverride.low !== undefined || paintOverride.high !== undefined
    || deletedParts.length > 0 || addedParts.length > 0;

  const computedPartsLow = a.repairEstimate.parts.reduce((sum, part, i) =>
    deletedParts.includes(i) ? sum : sum + (partOverrides[i]?.low ?? part.costLow), 0)
    + addedParts.reduce((sum, p) => sum + p.low, 0);
  const computedPartsHigh = a.repairEstimate.parts.reduce((sum, part, i) =>
    deletedParts.includes(i) ? sum : sum + (partOverrides[i]?.high ?? part.costHigh), 0)
    + addedParts.reduce((sum, p) => sum + p.high, 0);
  const effectiveLaborHours = laborHoursOverride ?? a.repairEstimate.laborHours;
  const laborRate = a.repairEstimate.laborRateHr || 50;
  const effectiveLaborLow = effectiveLaborHours * laborRate;
  const effectiveLaborHigh = effectiveLaborHours * laborRate;
  const effectivePaintLow = paintOverride.low ?? (a.repairEstimate.paint?.low || 0);
  const effectivePaintHigh = paintOverride.high ?? (a.repairEstimate.paint?.high || 0);
  const computedRepairLow = computedPartsLow + effectiveLaborLow + effectivePaintLow;
  const computedRepairHigh = computedPartsHigh + effectiveLaborHigh + effectivePaintHigh;

  // Priority: direct repair override > computed from part overrides > AI estimate
  const effectiveRepairLow = repairOverride ?? (hasPartOverrides ? computedRepairLow : a.repairEstimate.total.low);
  const effectiveRepairHigh = repairOverride ?? (hasPartOverrides ? computedRepairHigh : a.repairEstimate.total.high);
  const effectiveSellLow = sellOverride ?? a.financials.salePrice.low;
  const effectiveSellHigh = sellOverride ? Math.round(sellOverride * 1.1) : a.financials.salePrice.high;

  // Recompute all downstream values using SLIDER price (not original Claude estimate)
  const feeRate = a.financials.purchase > 0
    ? a.financials.auctionFees.amount / a.financials.purchase
    : 0.08;
  const liveFees = Math.round(sliderPrice * feeRate);
  const shipCost = noShipping ? 0 : (a.financials.shipping?.estimate || 0);
  const detailCost = a.financials.detailing || 0;
  const inspectionCost = a.financials.rebuiltInspection || 0;

  const liveAllInLow = sliderPrice + liveFees + shipCost + effectiveRepairLow + detailCost + inspectionCost;
  const liveAllInHigh = sliderPrice + liveFees + shipCost + effectiveRepairHigh + detailCost;
  const liveProfitLow = effectiveSellLow - liveAllInHigh;
  const liveProfitHigh = effectiveSellHigh - liveAllInLow;
  const liveMidAllIn = (liveAllInLow + liveAllInHigh) / 2;
  const liveMidProfit = (liveProfitLow + liveProfitHigh) / 2;
  const liveRoi = liveMidAllIn > 0 ? Math.round((liveMidProfit / liveMidAllIn) * 1000) / 10 : 0;

  const isOverridden = repairOverride !== null || sellOverride !== null || hasPartOverrides;

  const vehicleTitle = `${a.vehicle.year} ${a.vehicle.make} ${a.vehicle.model}${a.vehicle.trim ? ` ${a.vehicle.trim}` : ""}`;

  const verdictColor = a.verdict === "BUY" ? "buy" : a.verdict === "PASS" ? "pass" : "risky";

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* ============================================
          SIDEBAR — Dashboard Scoreboard
          ============================================ */}
      <div className="lg:sticky lg:top-16 lg:h-fit lg:w-64 lg:shrink-0">
        {/* Mobile: sticky top bar */}
        <div className={`sticky top-12 z-40 -mx-3 sm:-mx-5 mb-3 sm:mb-6 border-b border-[#27272a] bg-[#0a0a0b]/95 px-3 sm:px-5 py-2 sm:py-4 backdrop-blur-xl overflow-hidden lg:static lg:mx-0 lg:mb-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none`}>
          {/* Desktop sidebar card with verdict glow */}
          <div className={`lg:card-elevated lg:p-6 lg:glow-${verdictColor}-ambient`}>
            <div className="flex items-center gap-2 sm:gap-5 lg:flex-col lg:items-stretch lg:gap-0">
              {/* Verdict badge */}
              <div className="shrink-0 lg:mb-6 lg:text-center">
                <VerdictBadge verdict={a.verdict} />
              </div>

              {/* Stats — 4 inline on mobile, stacked on desktop */}
              <div className="grid grid-cols-4 gap-1 flex-1 min-w-0 lg:grid-cols-1 lg:gap-0">
                {/* All-in */}
                <div className="min-w-0 lg:py-4 lg:border-t lg:border-[#27272a]">
                  <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-0.5 sm:mb-1">
                    All-in
                  </div>
                  <div className={`mono text-[13px] sm:text-xl font-bold truncate ${isOverridden ? "text-[#7dd3fc]" : "text-[#e4e4e7]"}`}>
                    ${fmt(Math.round(liveMidAllIn))}
                  </div>
                </div>

                {/* Sell at */}
                <div className="min-w-0 lg:py-4 lg:border-t lg:border-[#27272a]">
                  <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-0.5 sm:mb-1">
                    Sell at
                  </div>
                  <div className={`mono text-[13px] sm:text-xl font-bold truncate ${sellOverride ? "text-[#7dd3fc]" : "text-[#e4e4e7]"}`}>
                    ${fmt(Math.round((effectiveSellLow + effectiveSellHigh) / 2))}
                  </div>
                </div>

                {/* Profit */}
                <div className="min-w-0 lg:py-4 lg:border-t lg:border-[#27272a]">
                  <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-0.5 sm:mb-1">
                    Profit
                  </div>
                  <div
                    className={`mono text-[13px] sm:text-xl font-bold truncate ${liveMidProfit > 0 ? "text-buy" : "text-pass"}`}
                  >
                    {liveMidProfit > 0 ? "+" : ""}${fmt(Math.round(liveMidProfit))}
                  </div>
                </div>

                {/* ROI */}
                <div className="min-w-0 lg:py-4 lg:border-t lg:border-[#27272a]">
                  <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-0.5 sm:mb-1">
                    ROI
                  </div>
                  <div className={`mono text-[13px] sm:text-xl font-bold truncate ${isOverridden ? "text-[#7dd3fc]" : "text-[#d4d4d8]"}`}>
                    {liveRoi}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BIN + Current Bid */}
          {(listing.buyItNow || listing.currentBid) && (
            <div className="hidden lg:flex gap-2 mt-4">
              {listing.buyItNow && (
                <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-1">Buy It Now</div>
                  <div className="text-[15px] mono font-bold text-[#e4e4e7]">${fmt(listing.buyItNow)}</div>
                </div>
              )}
              {listing.currentBid && (
                <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-1">Current Bid</div>
                  <div className="text-[15px] mono font-bold text-[#e4e4e7]">${fmt(listing.currentBid)}</div>
                  <div className="text-[9px] text-[#3f3f46] mt-1">at time of scan</div>
                </div>
              )}
            </div>
          )}

          {/* Auction date */}
          {listing.auctionDate && (
            <div className="hidden lg:block mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-1">Auction</div>
              <div className="text-[13px] text-[#a1a1aa]">
                {(() => {
                  const d = new Date(listing.auctionDate!);
                  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                  const diffMs = d.getTime() - Date.now();
                  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                  const dateStr = `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
                  const hours = d.getHours();
                  const mins = d.getMinutes();
                  const ampm = hours >= 12 ? "PM" : "AM";
                  const timeStr = `${hours % 12 || 12}:${mins.toString().padStart(2, "0")} ${ampm}`;
                  let countdown = "";
                  if (diffMs < 0) countdown = "Passed";
                  else if (diffHrs < 24) countdown = `${diffHrs}h`;
                  else if (diffDays === 1) countdown = "Tomorrow";
                  else countdown = `${diffDays} days`;
                  return (
                    <div>
                      <span>{dateStr} at {timeStr}</span>
                      <span className={`mono font-medium ml-2 ${diffHrs < 24 && diffMs > 0 ? "text-orange-400" : "text-[#52525b]"}`}>({countdown})</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Notes — owner only */}
          {isOwner && <div className="hidden lg:block mt-4">
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Your notes..."
              rows={4}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-[13px] text-white/60 placeholder-white/15 resize-none focus:border-[#7dd3fc]/20 focus:outline-none"
            />
          </div>}
        </div>
      </div>

      {/* ============================================
          MAIN CONTENT — Scrollable Cards
          ============================================ */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 auto-rows-min">

        {/* ---- VEHICLE CARD (full width) ---- */}
        <div className={`xl:col-span-2 card-gradient card-gradient-${verdictColor} p-7`}>
          <h2 className="mb-1 text-2xl font-bold tracking-tight text-[#fafafa]">
            {vehicleTitle}
          </h2>
          {listing.vin && (
            <div className="mb-3 text-[11px] mono text-[#3f3f46] select-all">{listing.vin}</div>
          )}

          {/* Specs — horizontal chips */}
          <div className="mb-5 flex flex-wrap gap-2">
            {a.vehicle.engine && (
              <span className="rounded-lg bg-[#ffffff06] border border-[#ffffff08] px-3 py-1.5 text-[13px] text-[#a1a1aa]">
                {a.vehicle.engine}
              </span>
            )}
            {a.vehicle.hp && (
              <span className="rounded-lg bg-[#ffffff06] border border-[#ffffff08] px-3 py-1.5 text-[13px] text-[#a1a1aa]">
                <span className="mono">{a.vehicle.hp}</span>hp
              </span>
            )}
            {(a.vehicle.drivetrain || listing.transmission) && (
              <span className="rounded-lg bg-[#ffffff06] border border-[#ffffff08] px-3 py-1.5 text-[13px] text-[#a1a1aa]">
                {a.vehicle.drivetrain || ""}{a.vehicle.drivetrain && listing.transmission ? " · " : ""}{listing.transmission ? (listing.transmission.toLowerCase().includes("auto") ? "Auto" : listing.transmission.toLowerCase().includes("manual") ? "Manual" : listing.transmission.split(/\s/)[0]) : ""}
              </span>
            )}
            {listing.mileage && (
              <span className={`rounded-lg border px-3 py-1.5 text-[13px] ${
                listing.mileage >= 150000
                  ? "bg-red-500/8 border-red-500/20 text-red-400"
                  : listing.mileage >= 125000
                    ? "bg-orange-500/8 border-orange-500/20 text-orange-400"
                    : listing.mileage >= 100000
                      ? "bg-yellow-500/8 border-yellow-500/20 text-yellow-400"
                      : listing.mileage < 50000
                        ? "bg-green-500/8 border-green-500/20 text-green-400"
                        : "bg-[#ffffff06] border-[#ffffff08] text-[#a1a1aa]"
              }`}>
                <span className="mono">{fmt(listing.mileage)}</span> mi
                {listing.mileage < 50000 && <span className="ml-1.5 text-[10px]">Low miles</span>}
                {listing.mileage >= 100000 && listing.mileage < 125000 && <span className="ml-1.5 text-[10px]">100K+</span>}
                {listing.mileage >= 125000 && listing.mileage < 150000 && <span className="ml-1.5 text-[10px]">125K+</span>}
                {listing.mileage >= 150000 && <span className="ml-1.5 text-[10px]">High mileage</span>}
              </span>
            )}
            {listing.titleStatus && (
              <span className="rounded-lg bg-[#ffffff06] border border-[#ffffff08] px-3 py-1.5 text-[13px] text-[#a1a1aa]">
                {listing.titleStatus}
              </span>
            )}
            {listing.startCode && (
              <span className="rounded-lg bg-[#ffffff06] border border-[#ffffff08] px-3 py-1.5 text-[13px] text-[#a1a1aa]">
                Starts: {listing.startCode}
              </span>
            )}
            {listing.sellerType && listing.sellerType !== "unknown" && listing.sellerType !== "dealer" && (
              <span className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium ${
                listing.sellerType === "insurance" ? "bg-blue-500/8 border-blue-500/20 text-blue-400" :
                listing.sellerType === "fleet" ? "bg-purple-500/8 border-purple-500/20 text-purple-400" :
                listing.sellerType === "private" ? "bg-green-500/8 border-green-500/20 text-green-400" :
                "bg-[#ffffff06] border-[#ffffff08] text-[#a1a1aa]"
              }`}>
                {listing.sellerType.charAt(0).toUpperCase() + listing.sellerType.slice(1)} seller
              </span>
            )}
            {listing.bidRequirements && !listing.bidRequirements.includes("Public") && (
              <span className="rounded-lg bg-red-500/8 border border-red-500/20 px-3 py-1.5 text-[13px] font-medium text-red-400">
                {listing.bidRequirements.join(" / ")} only
              </span>
            )}
          </div>

          {/* Title warning banner */}
          {(() => {
            const title = (listing.titleStatus || "").toLowerCase();
            if (title.includes("non-repairable") || title.includes("non repairable")) {
              return (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/[0.06] px-4 py-3 shadow-[0_0_15px_rgba(248,113,113,0.1)]">
                  <div className="text-[12px] font-semibold text-red-400 mb-1">Non-Repairable Title</div>
                  <div className="text-[11px] text-red-400/70 leading-relaxed">Cannot be titled for road use in the issuing state. Some states accept non-repairable for rebuild (FL, GA, AL, OK) but many do NOT (TX, CA, NY). Verify with your state's DMV before bidding. Expect -30% to -40% from clean value.</div>
                </div>
              );
            }
            if (title.includes("certificate of destruction")) {
              return (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/[0.06] px-4 py-3 shadow-[0_0_15px_rgba(248,113,113,0.15)]">
                  <div className="text-[12px] font-semibold text-red-400 mb-1">Certificate of Destruction</div>
                  <div className="text-[11px] text-red-400/70 leading-relaxed">Cannot be registered for road use in most states. This is a parts/scrap-only vehicle. Very limited resale options — verify with your state before bidding.</div>
                </div>
              );
            }
            if (title.includes("parts only")) {
              return (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/[0.06] px-4 py-3 shadow-[0_0_15px_rgba(248,113,113,0.15)]">
                  <div className="text-[12px] font-semibold text-red-400 mb-1">Parts Only</div>
                  <div className="text-[11px] text-red-400/70 leading-relaxed">This vehicle is designated for parts/scrap only and cannot be titled for road use.</div>
                </div>
              );
            }
            return null;
          })()}

          {/* Biohazard warning */}
          {(listing.primaryDamage || "").toLowerCase().includes("biohazard") && (
            <div className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/[0.04] px-4 py-3">
              <div className="text-[12px] font-semibold text-yellow-400 mb-1">Biohazard Damage</div>
              <div className="text-[11px] text-yellow-400/60 leading-relaxed">Typically indicates mold, fluid contamination, or similar interior issues. Actual cause is unknown from listing data alone — always inspect in person before bidding.</div>
            </div>
          )}

          {/* Title law info — compact two-liner */}
          {listing.branchState && (() => {
            try {
              const { getStateLaw } = require("@/lib/state-title-laws");
              const { loadSettings } = require("@/lib/settings");
              const settings = loadSettings();
              const fromLaw = getStateLaw(listing.branchState);
              const userState = settings.state || null;
              const toLaw = userState ? getStateLaw(userState) : null;

              if (!fromLaw) return null;

              const fromSlug = fromLaw.state.toLowerCase().replace(/\s+/g, "-");
              const toSlug = toLaw ? toLaw.state.toLowerCase().replace(/\s+/g, "-") : null;
              const isCrossState = toLaw && fromLaw.stateCode !== toLaw.stateCode;

              // Check if combo page exists (top origins × destinations)
              const origins = ["california", "new-york", "florida", "texas", "pennsylvania", "michigan", "ohio", "illinois", "georgia", "new-jersey"];
              const destinations = ["texas", "florida", "oklahoma", "arkansas", "north-carolina", "georgia", "alabama", "indiana", "arizona", "illinois"];
              const hasComboPage = isCrossState && origins.includes(fromSlug) && destinations.includes(toSlug!);

              const ratingClass = (rating: string) =>
                rating === "friendly" ? "bg-green-500/10 text-green-400" :
                rating === "strict" ? "bg-red-500/10 text-red-400" :
                "bg-yellow-500/10 text-yellow-400";

              return (
                <div className="mb-4 rounded-lg border border-white/[0.04] bg-white/[0.01] px-3 py-2 space-y-1.5">
                  {/* Origin state */}
                  <div className="flex items-center gap-2 text-[11px] text-[#52525b]">
                    <span className={`rounded px-1.5 py-0.5 font-medium ${ratingClass(fromLaw.flipperRating)}`}>{fromLaw.stateCode}</span>
                    <span>Car located · {fromLaw.flipperRating}</span>
                    <span>·</span>
                    <span>Inspection: {fromLaw.inspectionCost ? `$${fromLaw.inspectionCost}` : "none"}</span>
                    <a href={`/tools/title-laws/${fromSlug}`} className="text-[#7dd3fc]/50 hover:text-[#7dd3fc] ml-auto shrink-0">Details →</a>
                  </div>
                  {/* User's state */}
                  {isCrossState && toLaw && (
                    <div className="flex items-center gap-2 text-[11px] text-[#52525b]">
                      <span className={`rounded px-1.5 py-0.5 font-medium ${ratingClass(toLaw.flipperRating)}`}>{toLaw.stateCode}</span>
                      <span>You'd title here · {toLaw.flipperRating}</span>
                      <span>·</span>
                      <span>Inspection: {toLaw.inspectionCost ? `$${toLaw.inspectionCost}` : "none"}</span>
                      {toLaw.ageExemptions && <span className="text-green-400 hidden sm:inline">{toLaw.ageExemptions}</span>}
                      <a href={hasComboPage ? `/tools/title-transfer/${fromSlug}-to-${toSlug}` : `/tools/title-laws/${toSlug}`} className="text-[#7dd3fc]/50 hover:text-[#7dd3fc] ml-auto shrink-0">
                        {hasComboPage ? "Transfer guide →" : "Details →"}
                      </a>
                    </div>
                  )}
                </div>
              );
            } catch {}
            return null;
          })()}

          {/* Verdict summary — blockquote callout */}
          <div className={`border-l-2 border-${verdictColor === "buy" ? "green" : verdictColor === "pass" ? "red" : "yellow"}-500/40 pl-4 py-1`}>
            <p className="text-[14px] leading-relaxed text-[#a1a1aa]">
              {a.verdictSummary}
            </p>
          </div>
        </div>

        {/* ---- PHOTO GRID (full width) ---- */}
        {listing.imageUrls?.length > 0 && (
          <div className="xl:col-span-2">
            <div className={`grid gap-2.5 ${(listing.imageUrls?.length || 0) === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {(listing.imageUrls || []).slice(0, showAllPhotos ? undefined : 4).map((imgUrl, i) => (
                <div
                  key={i}
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#111113] border border-[#232326]"
                  id={`photo-${i}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt=""
                    className="h-full w-full object-cover photo-hover"
                    loading="lazy"
                    onError={(e) => {
                      const parent = (e.target as HTMLElement).parentElement;
                      if (parent) parent.style.display = "none";
                    }}
                    onLoad={(e) => {
                      // Hide tiny placeholder images (IAA returns ~1KB for missing photos)
                      const img = e.target as HTMLImageElement;
                      if (img.naturalWidth < 50 || img.naturalHeight < 50) {
                        const parent = img.parentElement;
                        if (parent) parent.style.display = "none";
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-2xl" />
                </div>
              ))}
            </div>
            {(listing.imageUrls?.length || 0) > 4 && (
              <button
                onClick={() => setShowAllPhotos(!showAllPhotos)}
                className="mt-3 w-full text-center text-[12px] text-white/25 hover:text-white/40 transition-colors"
              >
                {showAllPhotos ? "Show less" : `+ Show all ${(listing.imageUrls?.length || 0)} photos`}
              </button>
            )}
          </div>
        )}

        {/* ---- DAMAGE ASSESSMENT ---- */}
        <div className="card p-4 sm:p-7">
          <div className="mb-4 flex items-center gap-3">
            <h3 className="section-header">
              Damage Assessment
            </h3>
            <SeverityBadge severity={a.damageAssessment.severity} />
            {a.damageAssessment.structuralRisk !== "low" && (
              <span className="rounded-lg border border-red-500/25 bg-red-500/8 px-2.5 py-1 text-xs font-semibold text-red-400">
                Structural: {a.damageAssessment.structuralRisk}
              </span>
            )}
          </div>

          <p className="text-[14px] leading-relaxed text-[#a1a1aa] mb-4">
            {a.damageAssessment.details}
          </p>
          {a.damageAssessment.areas.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {a.damageAssessment.areas.map((area, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-[#ffffff06] border border-[#ffffff08] px-2.5 py-1 text-xs text-[#71717a]"
                >
                  {area}
                </span>
              ))}
            </div>
          )}

          {/* Extra photo findings */}
          {extraFindings.length > 0 && (
            <div className="mb-4 space-y-2">
              {extraFindings.map((finding, i) => (
                <div key={i} className="rounded-lg border border-[#7dd3fc]/10 bg-[#7dd3fc]/[0.03] px-4 py-3">
                  <div className="text-[10px] text-[#7dd3fc]/50 uppercase tracking-widest mb-1">Additional photo {i + 1}</div>
                  <p className="text-[13px] text-[#a1a1aa] leading-relaxed">{finding}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add context photo */}
          {!showExtraPhoto ? (
            <button
              onClick={() => setShowExtraPhoto(true)}
              className="text-[12px] text-white/20 hover:text-white/40 transition-colors"
            >
              + Analyze another photo
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={extraPhotoUrl}
                  onChange={(e) => setExtraPhotoUrl(e.target.value)}
                  placeholder="Paste image URL..."
                  className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-white/60 placeholder-white/15 focus:border-[#7dd3fc]/30 focus:outline-none"
                />
                <button
                  onClick={handleExtraPhoto}
                  disabled={!extraPhotoUrl.trim() || analyzingPhoto}
                  className="rounded-lg bg-[#7dd3fc] px-4 py-2 text-[12px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] disabled:opacity-30 transition-all"
                >
                  {analyzingPhoto ? "..." : "Scan"}
                </button>
                <button
                  onClick={() => { setShowExtraPhoto(false); setExtraPhotoUrl(""); }}
                  className="text-[12px] text-white/20 hover:text-white/40 px-2"
                >
                  ×
                </button>
              </div>
              {/* Also let them pick from listing photos */}
              {showAllPhotos && (listing.imageUrls?.length || 0) > 5 && (
                <div className="flex flex-wrap gap-1">
                  {(listing.imageUrls || []).slice(5).map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setExtraPhotoUrl(url)}
                      className={`text-[10px] rounded px-2 py-1 transition-all ${
                        extraPhotoUrl === url
                          ? "bg-[#7dd3fc]/20 text-[#7dd3fc]"
                          : "bg-white/[0.03] text-white/20 hover:text-white/40"
                      }`}
                    >
                      Photo {i + 6}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---- MARKET VALUE (side by side with damage) ---- */}
        <div className="card p-4 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <h3 className="section-header">Market Value</h3>
            <span className="rounded-lg bg-[#ffffff06] border border-[#ffffff08] px-2 py-0.5 text-[10px] text-[#52525b] font-medium">AI estimate</span>
          </div>
          <div className="grid grid-cols-2 gap-5 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-1.5">Clean Retail</div>
              <div className="num-md text-[#e4e4e7]">${fmt(a.marketValue.cleanRetail.low)} - ${fmt(a.marketValue.cleanRetail.high)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-1.5">Private Party</div>
              <div className="num-md text-[#e4e4e7]">${fmt(a.marketValue.privateParty.low)} - ${fmt(a.marketValue.privateParty.high)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-1.5">Demand</div>
              <div className="text-[#e4e4e7] capitalize font-medium">{a.marketValue.demand}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-1.5">Days to Sell</div>
              <div className="mono text-[#e4e4e7] font-medium">{a.marketValue.daysToSell}</div>
            </div>
          </div>
          {a.marketValue.titleImpactPct > 0 && (
            <div className="mt-4 rounded-xl border border-yellow-500/15 bg-yellow-500/[0.05] px-4 py-3 text-xs text-yellow-400">
              Title impact: -{a.marketValue.titleImpactPct}% from clean value
            </div>
          )}
          {a.marketValue.mileageNotes && (
            <p className="mt-3 text-xs text-[#52525b]">{a.marketValue.mileageNotes}</p>
          )}
        </div>

        {/* ---- REPAIR TABLE (full width) ---- */}
        <div className="xl:col-span-2 card p-4 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <h3 className="section-header">
              Repair Estimate
            </h3>
            <span className="rounded-lg bg-[#ffffff06] border border-[#ffffff08] px-2.5 py-1 text-xs text-[#52525b] font-medium">
              {analysis.repairProfile.replace("_", " ")}
            </span>
          </div>

          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#27272a] text-left text-[11px] uppercase tracking-wider text-[#52525b]">
                  <th className="pb-3 pr-4 font-medium">Part</th>
                  <th className="pb-3 pr-4 text-center font-medium hidden sm:table-cell">Type</th>
                  <th className="pb-3 pr-1 sm:pr-2 text-right font-medium w-16 sm:w-24">Low</th>
                  <th className="pb-3 text-right font-medium w-16 sm:w-24">High</th>
                </tr>
              </thead>
              <tbody>
                {a.repairEstimate.parts.map((part, i) => (
                  deletedParts.includes(i) ? null : <tr
                    key={i}
                    className="row-stripe border-b border-[#1a1a1e] hover:bg-[#ffffff06] transition-colors group"
                  >
                    <td className="py-2 sm:py-3 pr-2 sm:pr-4 max-w-[140px] sm:max-w-none">
                      <div className="flex items-start gap-1.5">
                        {isOwner && <button
                          onClick={() => setDeletedParts(prev => [...prev, i])}
                          className="mt-0.5 text-[#3f3f46] hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition-all text-[11px] shrink-0"
                          title="Remove part"
                        >✕</button>}
                        <div>
                          <span className="text-[#e4e4e7] text-[12px] sm:text-[13px] line-clamp-1">{part.name}</span>
                      {(() => {
                        const links = getPartLinks(a.vehicle.year, a.vehicle.make, a.vehicle.model, part.name);
                        return (
                          <div className="flex gap-2 mt-1">
                            <a href={links.ebay} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#52525b] hover:text-[#7dd3fc] transition-colors">eBay</a>
                            <span className="text-[10px] text-[#27272a]">·</span>
                            <a href={links.partsGeek} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#52525b] hover:text-[#7dd3fc] transition-colors">PartsGeek</a>
                            {links.oem && (
                              <>
                                <span className="text-[10px] text-[#27272a]">·</span>
                                <a href={links.oem.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#52525b] hover:text-[#7dd3fc] transition-colors">{links.oem.name}</a>
                              </>
                            )}
                          </div>
                        );
                      })()}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-center hidden sm:table-cell">
                      <PartTypeBadge type={part.type} />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        defaultValue={part.costLow}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : undefined;
                          setPartOverrides(prev => ({ ...prev, [i]: { ...prev[i], low: val } }));
                        }}
                        className={`w-16 sm:w-24 rounded border border-dashed bg-transparent px-1 sm:px-2 py-1 text-right mono text-[12px] sm:text-[14px] transition-all focus:outline-none ${
                          partOverrides[i]?.low !== undefined
                            ? "border-[#7dd3fc]/30 text-[#7dd3fc]"
                            : "border-white/[0.08] text-[#a1a1aa] hover:border-white/[0.15]"
                        }`}
                      />
                    </td>
                    <td className="py-2 ">
                      <input
                        type="number"
                        defaultValue={part.costHigh}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : undefined;
                          setPartOverrides(prev => ({ ...prev, [i]: { ...prev[i], high: val } }));
                        }}
                        className={`w-16 sm:w-24 rounded border border-dashed bg-transparent px-1 sm:px-2 py-1 text-right mono text-[12px] sm:text-[14px] transition-all focus:outline-none ${
                          partOverrides[i]?.high !== undefined
                            ? "border-[#7dd3fc]/30 text-[#7dd3fc]"
                            : "border-white/[0.08] text-[#a1a1aa] hover:border-white/[0.15]"
                        }`}
                      />
                    </td>
                  </tr>
                ))}
                {/* User-added parts */}
                {addedParts.map((part, i) => (
                  <tr key={`added-${i}`} className="row-stripe border-b border-[#1a1a1e] hover:bg-[#ffffff06] transition-colors group">
                    <td className="py-2 sm:py-3 pr-2 sm:pr-4" colSpan={2}>
                      <div className="flex items-start gap-1.5">
                        <button
                          onClick={() => setAddedParts(prev => prev.filter((_, j) => j !== i))}
                          className="mt-0.5 text-[#3f3f46] hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition-all text-[11px] shrink-0"
                          title="Remove part"
                        >✕</button>
                        <div>
                          <span className="text-[#7dd3fc] text-[12px] sm:text-[13px]">{part.name}</span>
                          {(() => {
                            const links = getPartLinks(a.vehicle.year, a.vehicle.make, a.vehicle.model, part.name);
                            return (
                              <div className="flex gap-2 mt-1">
                                <a href={links.ebay} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#52525b] hover:text-[#7dd3fc] transition-colors">eBay</a>
                                <span className="text-[10px] text-[#27272a]">·</span>
                                <a href={links.partsGeek} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#52525b] hover:text-[#7dd3fc] transition-colors">PartsGeek</a>
                                {links.oem && (
                                  <>
                                    <span className="text-[10px] text-[#27272a]">·</span>
                                    <a href={links.oem.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#52525b] hover:text-[#7dd3fc] transition-colors">{links.oem.name}</a>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        defaultValue={part.low}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : part.low;
                          setAddedParts(prev => prev.map((p, j) => j === i ? { ...p, low: val } : p));
                        }}
                        className="w-16 sm:w-24 rounded border border-dashed border-[#7dd3fc]/30 bg-transparent px-1 sm:px-2 py-1 text-right mono text-[12px] sm:text-[14px] text-[#7dd3fc] transition-all focus:outline-none"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        defaultValue={part.high}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : part.high;
                          setAddedParts(prev => prev.map((p, j) => j === i ? { ...p, high: val } : p));
                        }}
                        className="w-16 sm:w-24 rounded border border-dashed border-[#7dd3fc]/30 bg-transparent px-1 sm:px-2 py-1 text-right mono text-[12px] sm:text-[14px] text-[#7dd3fc] transition-all focus:outline-none"
                      />
                    </td>
                  </tr>
                ))}
                {/* Add part row — owner only */}
                {isOwner && showAddPart ? (
                  <tr className="border-b border-[#1a1a1e]">
                    <td colSpan={4} className="py-2">
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mb-2">
                        {[
                          { name: "Bumper cover", type: "aftermarket" as const, low: 150, high: 350 },
                          { name: "Fender", type: "aftermarket" as const, low: 100, high: 250 },
                          { name: "Hood", type: "aftermarket" as const, low: 200, high: 400 },
                          { name: "Door", type: "used" as const, low: 200, high: 500 },
                          { name: "Headlight", type: "aftermarket" as const, low: 100, high: 300 },
                          { name: "Tail light", type: "aftermarket" as const, low: 80, high: 200 },
                          { name: "Grille", type: "aftermarket" as const, low: 50, high: 150 },
                          { name: "Quarter panel", type: "aftermarket" as const, low: 200, high: 500 },
                          { name: "Mirror", type: "aftermarket" as const, low: 50, high: 150 },
                          { name: "Windshield", type: "OEM" as const, low: 300, high: 500 },
                          { name: "Radiator", type: "aftermarket" as const, low: 100, high: 250 },
                          { name: "A/C condenser", type: "aftermarket" as const, low: 80, high: 200 },
                          { name: "Radiator support", type: "aftermarket" as const, low: 150, high: 350 },
                          { name: "Wheel/Rim", type: "used" as const, low: 100, high: 300 },
                          { name: "Control arm", type: "aftermarket" as const, low: 80, high: 200 },
                          { name: "Strut assembly", type: "aftermarket" as const, low: 100, high: 250 },
                          { name: "Airbag set", type: "used" as const, low: 1500, high: 3500 },
                          { name: "Trunk lid", type: "used" as const, low: 200, high: 400 },
                          { name: "Bumper reinforcement", type: "aftermarket" as const, low: 50, high: 150 },
                          { name: "Fender liner", type: "aftermarket" as const, low: 30, high: 80 },
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => {
                              setAddedParts(prev => [...prev, preset]);
                              setShowAddPart(false);
                            }}
                            className="rounded border border-[#27272a] bg-[#ffffff04] px-2 py-1.5 text-[11px] text-[#a1a1aa] hover:border-[#7dd3fc]/30 hover:text-[#7dd3fc] transition-all text-left truncate"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Custom part name..."
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const name = (e.target as HTMLInputElement).value.trim();
                              if (name) {
                                setAddedParts(prev => [...prev, { name, type: "aftermarket", low: 100, high: 300 }]);
                                setShowAddPart(false);
                              }
                            }
                            if (e.key === "Escape") setShowAddPart(false);
                          }}
                          className="flex-1 rounded border border-dashed border-[#7dd3fc]/30 bg-transparent px-2 py-1 text-[12px] text-[#7dd3fc] placeholder-[#52525b] focus:outline-none"
                        />
                        <button onClick={() => setShowAddPart(false)} className="text-[11px] text-[#3f3f46] hover:text-[#52525b]">cancel</button>
                      </div>
                    </td>
                  </tr>
                ) : isOwner ? (
                  <tr className="border-b border-[#1a1a1e]">
                    <td colSpan={4} className="py-2">
                      <button
                        onClick={() => setShowAddPart(true)}
                        className="text-[11px] text-[#3f3f46] hover:text-[#7dd3fc] transition-colors"
                      >
                        + Add part
                      </button>
                      {deletedParts.length > 0 && (
                        <button
                          onClick={() => setDeletedParts([])}
                          className="ml-3 text-[11px] text-[#3f3f46] hover:text-[#a1a1aa] transition-colors"
                        >
                          ↩ Restore removed ({deletedParts.length})
                        </button>
                      )}
                    </td>
                  </tr>
                ) : null}
                {a.repairEstimate.laborHours > 0 && (
                  <tr className="row-stripe border-b border-[#1a1a1e]">
                    <td className="py-2 pr-2 sm:pr-4 text-[#a1a1aa] text-[11px] sm:text-[13px]">
                      <span className="mr-1.5 sm:mr-2.5 text-xs text-[#3f3f46]">&#9702;</span>
                      Labor
                      <span className="ml-1 text-[#52525b] text-[10px] sm:text-[12px]">(</span>
                      <input
                        type="number"
                        defaultValue={a.repairEstimate.laborHours}
                        onChange={(e) => setLaborHoursOverride(e.target.value ? parseFloat(e.target.value) : null)}
                        className={`w-8 sm:w-10 rounded border border-dashed bg-transparent px-0.5 sm:px-1 py-0.5 text-center mono text-[11px] sm:text-[12px] transition-all focus:outline-none ${
                          laborHoursOverride !== null ? "border-[#7dd3fc]/30 text-[#7dd3fc]" : "border-white/[0.08] text-[#a1a1aa] hover:border-white/[0.15]"
                        }`}
                      />
                      <span className="text-[#52525b] text-[10px] sm:text-[12px]">h @ ${a.repairEstimate.laborRateHr}/hr)</span>
                    </td>
                    <td className="py-2 hidden sm:table-cell"></td>
                    <td className="py-2 pr-1 sm:pr-2">
                      <div className={`w-16 sm:w-24 px-1 sm:px-2 py-1 text-right mono text-[12px] sm:text-[14px] ${laborHoursOverride !== null ? "text-[#7dd3fc]" : "text-[#a1a1aa]"}`}>
                        ${fmt(effectiveLaborLow)}
                      </div>
                    </td>
                    <td className="py-2">
                      <div className={`w-16 sm:w-24 px-1 sm:px-2 py-1 text-right mono text-[12px] sm:text-[14px] ${laborHoursOverride !== null ? "text-[#7dd3fc]" : "text-[#a1a1aa]"}`}>
                        ${fmt(effectiveLaborHigh)}
                      </div>
                    </td>
                  </tr>
                )}
                <tr className="row-stripe border-b border-[#1a1a1e]">
                  <td className="py-2 pr-2 sm:pr-4 text-[#a1a1aa] text-[11px] sm:text-[13px]">
                    <span className="mr-1.5 sm:mr-2.5 text-xs text-[#3f3f46]">&#9702;</span>
                    Paint
                  </td>
                  <td className="hidden sm:table-cell"></td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      defaultValue={a.repairEstimate.paint.low}
                      onChange={(e) => setPaintOverride(prev => ({ ...prev, low: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className={`w-16 sm:w-24 rounded border border-dashed bg-transparent px-1 sm:px-2 py-1 text-right mono text-[12px] sm:text-[14px] transition-all focus:outline-none ${
                        paintOverride.low !== undefined ? "border-[#7dd3fc]/30 text-[#7dd3fc]" : "border-white/[0.08] text-[#a1a1aa] hover:border-white/[0.15]"
                      }`}
                    />
                  </td>
                  <td className="py-2 ">
                    <input
                      type="number"
                      defaultValue={a.repairEstimate.paint.high}
                      onChange={(e) => setPaintOverride(prev => ({ ...prev, high: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className={`w-16 sm:w-24 rounded border border-dashed bg-transparent px-1 sm:px-2 py-1 text-right mono text-[12px] sm:text-[14px] transition-all focus:outline-none ${
                        paintOverride.high !== undefined ? "border-[#7dd3fc]/30 text-[#7dd3fc]" : "border-white/[0.08] text-[#a1a1aa] hover:border-white/[0.15]"
                      }`}
                    />
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-4 pr-2 sm:pr-4 font-bold text-[#fafafa] text-[13px] sm:text-[15px]">
                    TOTAL
                  </td>
                  <td className="hidden sm:table-cell"></td>
                  <td className={`mono pt-4 pr-1 sm:pr-4 text-right font-bold text-[14px] sm:text-[17px] ${hasPartOverrides ? "text-[#7dd3fc]" : "text-[#fafafa]"}`}>
                    ${fmt(effectiveRepairLow)}
                  </td>
                  <td className={`mono pt-4 text-right font-bold text-[14px] sm:text-[17px] ${hasPartOverrides ? "text-[#7dd3fc]" : "text-[#fafafa]"}`}>
                    ${fmt(effectiveRepairHigh)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ---- COST STACK (full width) ---- */}
        <div className="xl:col-span-2 card-elevated p-4 sm:p-7">
          <h3 className="section-header mb-5">
            Cost Breakdown
          </h3>
          <div className="space-y-0">
            {/* Line items */}
            <div className="flex justify-between py-2.5 border-b border-dashed border-[#1e1e21]">
              <span className="text-[14px] text-[#71717a]">
                Purchase ({a.financials.auctionFees.platform === "copart" ? "Copart" : "IAA"})
              </span>
              <span className={`num-md ${sliderPrice !== a.financials.purchase ? "text-[#7dd3fc]" : "text-[#d4d4d8]"}`}>
                ${fmt(sliderPrice)}
              </span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-dashed border-[#1e1e21]">
              <span className="text-[14px] text-[#71717a]">
                Auction fees ({Math.round(feeRate * 1000) / 10}%)
              </span>
              <span className={`num-md ${sliderPrice !== a.financials.purchase ? "text-[#7dd3fc]" : "text-[#d4d4d8]"}`}>
                ${fmt(liveFees)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-dashed border-[#1e1e21]">
              <div className="flex items-center gap-2.5">
                <span className={`text-[14px] ${noShipping ? "text-[#3f3f46] line-through" : "text-[#71717a]"}`}>
                  Shipping
                </span>
                <button
                  onClick={() => setNoShipping(!noShipping)}
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-medium transition-all ${
                    noShipping
                      ? "border-[#7dd3fc]/20 bg-[#7dd3fc]/10 text-[#7dd3fc]"
                      : "border-white/[0.06] text-white/25 hover:text-white/40"
                  }`}
                >
                  {noShipping ? "Local pickup" : "Skip"}
                </button>
              </div>
              <span className={`num-md ${noShipping ? "text-[#3f3f46] line-through" : "text-[#d4d4d8]"}`}>
                {noShipping ? "$0" : (a.financials.shipping?.estimate != null ? `$${fmt(a.financials.shipping.estimate)}` : "N/A")}
              </span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-dashed border-[#1e1e21]">
              <span className="text-[14px] text-[#71717a]">Repairs</span>
              <span className={`num-md ${hasPartOverrides ? "text-[#7dd3fc]" : "text-[#d4d4d8]"}`}>
                ${fmt(effectiveRepairLow)} - ${fmt(effectiveRepairHigh)}
              </span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-dashed border-[#1e1e21]">
              <span className="text-[14px] text-[#71717a]">Detailing</span>
              <span className="num-md text-[#d4d4d8]">
                ${fmt(a.financials.detailing)}
              </span>
            </div>
            {inspectionCost > 0 && (
              <div className="flex justify-between py-2.5 border-b border-dashed border-[#1e1e21]">
                <span className="text-[14px] text-[#71717a]">Rebuilt inspection</span>
                <span className="num-md text-[#d4d4d8]">
                  ${fmt(inspectionCost)}
                </span>
              </div>
            )}

            {/* Subtotal line */}
            <div className="my-1 border-t border-[#27272a]" />

            <div className="flex justify-between py-3">
              <span className="text-[14px] font-semibold text-[#e4e4e7]">ALL-IN</span>
              <span className={`num-lg ${isOverridden ? "text-[#7dd3fc]" : "text-[#e4e4e7]"}`}>
                ${fmt(liveAllInLow)} - ${fmt(liveAllInHigh)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-[14px] font-semibold text-[#e4e4e7]">SELL AT</span>
              <input
                type="number"
                value={sellOverride ?? ""}
                onChange={(e) => setSellOverride(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder={`${fmt(effectiveSellLow)} - ${fmt(effectiveSellHigh)}`}
                className={`w-32 sm:w-44 rounded-lg border border-dashed bg-transparent px-2 sm:px-3 py-1.5 text-right mono text-[13px] sm:text-[15px] font-semibold transition-all focus:outline-none ${
                  sellOverride !== null
                    ? "border-[#7dd3fc]/30 text-[#7dd3fc]"
                    : "border-white/[0.1] text-[#e4e4e7] placeholder-[#e4e4e7]/50 hover:border-white/[0.2]"
                }`}
              />
            </div>

            {/* Profit line — the star */}
            <div className="my-1 border-t-2 border-[#27272a]" />

            <div className="flex justify-between items-center py-4 gap-2">
              <span className={`text-sm sm:text-lg font-bold tracking-wide shrink-0 ${liveProfitLow > 0 ? "text-buy" : "text-pass"}`}>
                PROFIT
              </span>
              <span
                className={`mono text-sm sm:text-xl font-bold text-right ${liveProfitLow > 0 ? "text-buy" : "text-pass"}`}
              >
                {liveProfitLow > 0 ? "+" : ""}${fmt(liveProfitLow)} to {liveProfitHigh > 0 ? "+" : ""}${fmt(liveProfitHigh)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[14px] text-[#52525b]">ROI</span>
              <span className={`num-lg ${isOverridden ? "text-[#7dd3fc]" : "text-[#d4d4d8]"}`}>
                {liveRoi}%
              </span>
            </div>
          </div>
        </div>

        {/* ---- BID SIMULATOR (full width) ---- */}
        <div className="xl:col-span-2 card-elevated p-4 sm:p-7">
          <h3 className="section-header mb-2">
            Bid Simulator
          </h3>
          <p className="text-[12px] text-[#52525b] mb-6">Drag to see your profit at any purchase price</p>

          {(() => {
            const fixedCosts = shipCost + detailCost + inspectionCost;
            const repairMid = (effectiveRepairLow + effectiveRepairHigh) / 2;
            const sellMid = (effectiveSellLow + effectiveSellHigh) / 2;
            const sellHigh = effectiveSellHigh;
            const sellLow = effectiveSellLow;

            const feeRate = a.financials.purchase > 0
              ? a.financials.auctionFees.amount / a.financials.purchase
              : 0.08;

            const calc = (purchase: number, sell: number, repairs: number) =>
              sell - purchase - Math.round(purchase * feeRate) - fixedCosts - repairs;

            const breakeven = Math.round((sellMid - fixedCosts - repairMid) / (1 + feeRate));
            const maxSlider = Math.max(Math.round(sellHigh * 1.2), breakeven * 1.5, 10000);

            const expected = calc(sliderPrice, sellMid, repairMid);
            const best = calc(sliderPrice, sellHigh, effectiveRepairLow);
            const worst = calc(sliderPrice, sellLow, effectiveRepairHigh * 1.3);
            const allIn = sliderPrice + Math.round(sliderPrice * feeRate) + fixedCosts + repairMid;
            const roi = allIn > 0 ? Math.round((expected / allIn) * 100) : 0;

            // Determine verdict at this price
            const simVerdict = expected > 0 && worst > -2000 ? (roi > 20 ? "SEND IT" : "MAYBE") : "PASS";
            const verdictColor = simVerdict === "SEND IT" ? "text-[#4ade80]" : simVerdict === "MAYBE" ? "text-[#fbbf24]" : "text-[#f87171]";

            // Slider position as percentage
            const sliderPct = maxSlider > 0 ? (sliderPrice / maxSlider) * 100 : 0;
            const breakevenPct = maxSlider > 0 ? (breakeven / maxSlider) * 100 : 50;

            return (
              <div>
                {/* Big profit display */}
                <div className="text-center mb-6">
                  <div className={`mono text-5xl font-bold ${expected >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                    {expected >= 0 ? "+" : ""}${fmt(Math.round(expected))}
                  </div>
                  <div className="mt-1 text-[13px] text-[#52525b]">
                    expected profit at{" "}
                    <span className="mono text-[#d4d4d8]">${fmt(sliderPrice)}</span>
                    {" "}purchase
                  </div>
                  <div className={`mt-2 text-sm font-bold ${verdictColor}`} style={{ fontFamily: "var(--font-grotesk)" }}>
                    {simVerdict}
                  </div>
                </div>

                {/* Slider */}
                <div className="mb-6">
                  <div className="relative">
                    {/* Track background */}
                    <div className="h-3 rounded-full overflow-hidden bg-[#111113] border border-[#1e1e21]">
                      {/* Green/red fill */}
                      <div
                        className="h-full rounded-full transition-all duration-75"
                        style={{
                          width: `${sliderPct}%`,
                          background: sliderPct < breakevenPct
                            ? `linear-gradient(to right, #22c55e40, #22c55e25)`
                            : `linear-gradient(to right, #22c55e40, #fbbf2440 ${breakevenPct / sliderPct * 100}%, #ef444440)`,
                        }}
                      />
                    </div>
                    {/* Breakeven marker */}
                    <div
                      className="absolute top-0 h-3 w-px bg-[#52525b]"
                      style={{ left: `${breakevenPct}%` }}
                    />
                    {/* Thumb dot */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-white bg-[#0a0a0b] shadow-[0_0_8px_rgba(125,211,252,0.3)] pointer-events-none transition-all duration-75"
                      style={{ left: `calc(${sliderPct}% - 10px)` }}
                    />
                    {/* Actual range input overlay */}
                    <input
                      type="range"
                      min={0}
                      max={maxSlider}
                      step={sliderPrice < 1000 ? 25 : sliderPrice < 5000 ? 50 : sliderPrice < 25000 ? 100 : 250}
                      value={sliderPrice}
                      onChange={(e) => setSliderPrice(parseInt(e.target.value))}
                      className="absolute inset-0 w-full h-5 -top-1 opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[11px] mono">
                    <span className="text-[#3f3f46]">$0</span>
                    <span className="text-[#52525b]">breakeven ${fmt(breakeven)}</span>
                    <span className="text-[#3f3f46]">${fmt(maxSlider)}</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-[#3f3f46] mb-0.5">All-in</div>
                    <div className="mono text-[14px] font-semibold text-[#d4d4d8]">${fmt(Math.round(allIn))}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#3f3f46] mb-0.5">Worst</div>
                    <div className={`mono text-[14px] font-semibold ${worst >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                      {worst >= 0 ? "+" : ""}${fmt(Math.round(worst))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#3f3f46] mb-0.5">Best</div>
                    <div className={`mono text-[14px] font-semibold ${best >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                      {best >= 0 ? "+" : ""}${fmt(Math.round(best))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#3f3f46] mb-0.5">ROI</div>
                    <div className={`mono text-[14px] font-semibold ${roi >= 0 ? "text-[#7dd3fc]" : "text-[#f87171]"}`}>
                      {roi}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ---- RECENTLY SOLD AT AUCTION ---- */}
        {analysis.auctionComps && analysis.auctionComps.length > 0 && (
          <div className="xl:col-span-2 card p-4 sm:p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="section-header">
                Recently Sold at Auction
              </h3>
              <span className="text-[11px] text-white/20 mono">
                {analysis.auctionComps.length} sold
              </span>
            </div>

            {/* Summary bar */}
            <div className="flex gap-4 mb-5 pb-4 border-b border-white/[0.06]">
              <div>
                <div className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Low</div>
                <div className="mono text-[15px] font-semibold text-red-400/80">
                  ${fmt(Math.min(...analysis.auctionComps.map(c => c.price)))}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Median</div>
                <div className="mono text-[15px] font-semibold text-white/80">
                  ${fmt(analysis.auctionComps.map(c => c.price).sort((a, b) => a - b)[Math.floor(analysis.auctionComps.length / 2)])}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">High</div>
                <div className="mono text-[15px] font-semibold text-green-400/80">
                  ${fmt(Math.max(...analysis.auctionComps.map(c => c.price)))}
                </div>
              </div>
            </div>

            {/* Individual comps */}
            <div className="space-y-0">
              {analysis.auctionComps
                .slice(0, showAllComps ? undefined : 5)
                .map((comp, i) => (
                <a
                  key={i}
                  href={comp.url || "#"}
                  target={comp.url ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className={`flex gap-3 py-3 border-b border-white/[0.04] last:border-0 ${comp.url ? "hover:bg-white/[0.02] transition-colors cursor-pointer" : ""}`}
                >
                  {comp.image && (
                    <div className="shrink-0 h-14 w-20 overflow-hidden rounded-lg bg-[#111113]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={comp.image} alt="" className="h-full w-full object-cover" loading="lazy"
                        onError={(e) => { (e.target as HTMLElement).parentElement!.style.display = "none"; }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                          comp.platform === "iaa"
                            ? "bg-orange-500/10 text-orange-400/60"
                            : "bg-blue-500/10 text-blue-400/60"
                        }`}>
                          {comp.platform}
                        </span>
                        <span className="text-[13px] text-white/70 font-medium truncate">
                          {comp.year > 0 ? `${comp.year} ` : ""}
                          {analysis.listing.make} {analysis.listing.model}
                          {(comp as unknown as Record<string, string>).trim ? ` ${(comp as unknown as Record<string, string>).trim}` : ""}
                        </span>
                      </div>
                      <span className="mono text-[15px] font-bold text-[#7dd3fc] shrink-0 ml-3">
                        ${fmt(comp.price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-white/25 flex-wrap">
                      {comp.damage && <span>{comp.damage}</span>}
                      {comp.mileage && comp.mileage > 0 ? <span>· {fmt(comp.mileage)} mi</span> : null}
                      {comp.titleStatus && (
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                          comp.titleStatus.toLowerCase().includes("run") ? "bg-green-500/10 text-green-400/50" :
                          comp.titleStatus.toLowerCase().includes("stationary") ? "bg-red-500/10 text-red-400/50" :
                          comp.titleStatus.toLowerCase().includes("salvage") || comp.titleStatus.toLowerCase().includes("rebuildable") ? "bg-yellow-500/10 text-yellow-400/50" :
                          "bg-white/[0.04] text-white/25"
                        }`}>{comp.titleStatus}</span>
                      )}
                      {comp.location && <span>· {comp.location}</span>}
                      {comp.saleDate && <span>· {fmtDate(comp.saleDate)}</span>}
                    </div>
                  </div>
                </a>
              ))}
            </div>
            {analysis.auctionComps.length > 5 && (
              <button
                onClick={() => setShowAllComps(!showAllComps)}
                className="mt-3 w-full text-center text-[12px] text-white/20 hover:text-white/40 transition-colors"
              >
                {showAllComps ? "Show less" : `+ Show all ${analysis.auctionComps.length} sold`}
              </button>
            )}
          </div>
        )}

        {/* ---- RETAIL MARKET COMPS ---- */}
        {analysis.retailComps && analysis.retailComps.length > 0 && (
          <div className="xl:col-span-2 card p-4 sm:p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="section-header">Retail Market</h3>
              <span className="text-[11px] text-white/20 mono">
                {analysis.retailComps.length} active listings
              </span>
            </div>

            {/* Summary */}
            <div className="flex gap-4 mb-5 pb-4 border-b border-white/[0.06]">
              <div>
                <div className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Low</div>
                <div className="mono text-[15px] font-semibold text-white/70">
                  ${fmt(Math.min(...analysis.retailComps.map(c => c.price)))}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Median</div>
                <div className="mono text-[15px] font-semibold text-white/90">
                  ${fmt(analysis.retailComps.map(c => c.price).sort((a, b) => a - b)[Math.floor(analysis.retailComps.length / 2)])}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">High</div>
                <div className="mono text-[15px] font-semibold text-white/70">
                  ${fmt(Math.max(...analysis.retailComps.map(c => c.price)))}
                </div>
              </div>
            </div>

            {/* Listings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {analysis.retailComps
                .slice(0, showAllRetail ? undefined : 6)
                .map((comp, i) => (
                <a key={i} href={comp.url || "#"} target={comp.url ? "_blank" : undefined} rel="noopener noreferrer"
                  className={`flex gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 ${comp.url ? "hover:bg-white/[0.04] hover:border-white/[0.08] transition-all cursor-pointer" : ""}`}>
                  {comp.image && (
                    <div className="shrink-0 h-16 w-24 overflow-hidden rounded-lg bg-[#111113]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={comp.image} alt="" className="h-full w-full object-cover" loading="lazy"
                        onError={(e) => { (e.target as HTMLElement).parentElement!.style.display = "none"; }}
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[13px] text-white/70 font-medium truncate">
                        {comp.year} {comp.trim || comp.model}
                      </span>
                      <span className="mono text-[14px] font-bold text-[#4ade80] shrink-0 ml-2">
                        ${fmt(comp.price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-white/25 flex-wrap">
                      {comp.mileage && <span>{fmt(comp.mileage)} mi</span>}
                      {comp.sellerType && <span>· {comp.sellerType}</span>}
                      {comp.title && (
                        <span className={`rounded px-1 py-0.5 text-[9px] font-semibold ${
                          comp.title.toLowerCase() === "clean" ? "bg-green-500/10 text-green-400/50" : "bg-yellow-500/10 text-yellow-400/50"
                        }`}>{comp.title}</span>
                      )}
                      {comp.source && <span>· {comp.source}</span>}
                    </div>
                    {comp.location && (
                      <div className="text-[10px] text-white/15 mt-0.5 truncate">{comp.location}</div>
                    )}
                  </div>
                </a>
              ))}
            </div>
            {analysis.retailComps.length > 6 && (
              <button
                onClick={() => setShowAllRetail(!showAllRetail)}
                className="mt-3 w-full text-center text-[12px] text-white/20 hover:text-white/40 transition-colors"
              >
                {showAllRetail ? "Show less" : `+ Show all ${analysis.retailComps.length} listings`}
              </button>
            )}
          </div>
        )}

        {/* ---- BID CEILINGS (full width) ---- */}
        <div className="xl:col-span-2 card p-4 sm:p-7">
          <h3 className="section-header mb-5">
            Bid Ceilings
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-green-500/15 bg-green-500/[0.04] p-4 text-center">
              <div className="text-[10px] uppercase tracking-[0.15em] text-green-400/60 mb-2">Steal</div>
              <div className="num-xl text-green-400 mb-1">
                &lt;${fmt(a.bidCeilings.steal)}
              </div>
              <div className="text-[11px] text-[#52525b]">30%+ ROI</div>
            </div>
            <div className="rounded-xl border border-blue-500/15 bg-blue-500/[0.04] p-4 text-center">
              <div className="text-[10px] uppercase tracking-[0.15em] text-blue-400/60 mb-2">Good</div>
              <div className="num-xl text-blue-400 mb-1">
                &lt;${fmt(a.bidCeilings.good)}
              </div>
              <div className="text-[11px] text-[#52525b]">20-30% ROI</div>
            </div>
            <div className="rounded-xl border border-yellow-500/15 bg-yellow-500/[0.04] p-4 text-center">
              <div className="text-[10px] uppercase tracking-[0.15em] text-yellow-400/60 mb-2">Fair</div>
              <div className="num-xl text-yellow-400 mb-1">
                &lt;${fmt(a.bidCeilings.fair)}
              </div>
              <div className="text-[11px] text-[#52525b]">10-20% ROI</div>
            </div>
            <div className="rounded-xl border border-red-500/15 bg-red-500/[0.04] p-4 text-center">
              <div className="text-[10px] uppercase tracking-[0.15em] text-red-400/60 mb-2">Walk</div>
              <div className="num-xl text-red-400 mb-1">
                &gt;${fmt(a.bidCeilings.walk)}
              </div>
              <div className="text-[11px] text-[#52525b]">&lt;10% ROI</div>
            </div>
          </div>

          {/* Buy It Now Verdict */}
          {a.buyItNowVerdict && (
            <div className="mt-5 rounded-xl border border-[#27272a] bg-[#111113] px-5 py-4 text-sm text-[#a1a1aa]">
              <span className="font-semibold text-[#e4e4e7]">Buy It Now: </span>
              {a.buyItNowVerdict}
            </div>
          )}

          <div className="mt-4 text-[13px] text-[#52525b]">
            Max bid recommendation: <span className="num-md font-semibold text-[#e4e4e7]">${fmt(a.maxBidRecommendation)}</span> &mdash; based on your repair profile and $4K+ profit target
          </div>
        </div>

        {/* ---- UNKNOWN RISKS ---- */}
        {a.unknownRisks && a.unknownRisks.length > 0 && (
          <div className="card border-yellow-500/10 p-7">
            <h3 className="section-header section-header-risky mb-4">
              Unknown Risk Factors
            </h3>
            <ul className="space-y-2.5 text-[14px] text-[#71717a]">
              {a.unknownRisks.map((risk, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-400 text-[9px]">?</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ---- FLAGS ---- */}
        {(a.greenFlags.length > 0 || a.redFlags.length > 0) && (
          <div className="card p-4 sm:p-7">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {a.greenFlags.length > 0 && (
                <div>
                  <h4 className="section-header section-header-buy mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#52525b]">
                    Green Flags
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {a.greenFlags.map((flag, i) => (
                      <FlagPill key={i} text={flag} type="green" />
                    ))}
                  </div>
                </div>
              )}
              {a.redFlags.length > 0 && (
                <div>
                  <h4 className="section-header section-header-pass mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#52525b]">
                    Red Flags
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {a.redFlags.map((flag, i) => (
                      <FlagPill key={i} text={flag} type="red" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- RECALLS ---- */}
        {a.recalls.length > 0 && (
          <div className="card p-4 sm:p-7">
            <h3 className="section-header mb-5">
              Open Recalls ({a.recalls.length})
            </h3>
            <div className="space-y-4">
              {a.recalls.map((recall, i) => (
                <div key={i} className="border-b border-[#1e1e21] pb-4 last:border-0 last:pb-0">
                  <div className="font-semibold text-[#e4e4e7]">
                    {recall.component}
                  </div>
                  <div className="text-xs text-[#52525b] mt-0.5">
                    Campaign {recall.campaignNumber}
                  </div>
                  <p className="mt-2 text-[13px] text-[#71717a] leading-relaxed">
                    {recall.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- ASK A QUESTION — owner only ---- */}
        {isOwner && <div className="xl:col-span-2 card p-4 sm:p-7">
          <h3 className="section-header mb-4">Ask about this car</h3>

          {/* Q&A history */}
          {askHistory.length > 0 && (
            <div className="space-y-3 mb-4">
              {askHistory.map((qa, i) => (
                <div key={i}>
                  <div className="text-[13px] text-white/50 mb-1">
                    <span className="text-[#7dd3fc] font-medium">Q:</span> {qa.q}
                  </div>
                  <div className="text-[13px] text-white/70 bg-white/[0.02] rounded-lg px-3 py-2">
                    {qa.a}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={askInput}
              onChange={(e) => setAskInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !askLoading && handleAsk()}
              placeholder="Ask anything about this car..."
              className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-white/60 placeholder-white/20 focus:border-[#7dd3fc]/30 focus:outline-none"
            />
            <button
              onClick={handleAsk}
              disabled={!askInput.trim() || askLoading}
              className="shrink-0 rounded-lg bg-[#7dd3fc] px-3 py-2 text-[12px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] disabled:opacity-30 transition-all"
            >
              {askLoading ? "..." : "Ask"}
            </button>
          </div>
        </div>}

        {/* Report issue */}
        {isOwner && (
          <div className="xl:col-span-2 mt-4">
            {reportSent ? (
              <div className="text-[12px] text-[#52525b] text-center py-2">Thanks for the feedback.</div>
            ) : showReport ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[12px] text-[#71717a] mb-2">What did we get wrong? Missing damage, wrong estimate, bad comps?</p>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Tell us what's off..."
                  rows={3}
                  autoFocus
                  className="w-full rounded-lg border border-white/[0.06] bg-transparent px-3 py-2 text-[13px] text-white/60 placeholder-white/15 resize-none focus:border-[#7dd3fc]/20 focus:outline-none mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!reportText.trim()) return;
                      const sb = createBrowserClient();
                      sb.from("analytics_events").insert({
                        event_type: "feedback",
                        platform: listing.platform,
                        vehicle_make: a.vehicle.make,
                        vehicle_model: a.vehicle.model,
                        vehicle_year: a.vehicle.year,
                        part_name: reportText.trim(),
                      }).then(() => {});
                      setReportSent(true);
                    }}
                    className="rounded-lg bg-white/[0.05] border border-white/[0.08] px-4 py-1.5 text-[12px] text-white/50 hover:text-white/70 transition-all"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => setShowReport(false)}
                    className="text-[11px] text-[#3f3f46] hover:text-[#52525b]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowReport(true)}
                className="text-[11px] text-[#3f3f46] hover:text-[#52525b] transition-colors"
              >
                Report an issue with this scan
              </button>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="xl:col-span-2 text-[10px] text-[#3f3f46] leading-relaxed mt-4 px-1">
          Estimates are for informational purposes only and do not constitute professional appraisals or financial advice. AI damage assessment may not identify all damage — always inspect vehicles in person before purchasing. Repair costs are estimates that vary by location, shop, and parts availability. Market values are based on available data and may not reflect actual sale prices. User assumes all risk on purchase decisions. sendit scan is not affiliated with Copart, IAA, or any auction platform.
        </div>
      </div>
    </div>
  );
}
