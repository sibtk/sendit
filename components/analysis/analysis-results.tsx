"use client";

import { FullAnalysis, Verdict } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";

// Persist user edits per analysis
interface UserEdits {
  repairOverride: number | null;
  sellOverride: number | null;
  partOverrides: Record<number, { low?: number; high?: number }>;
  laborOverride: { low?: number; high?: number };
  paintOverride: { low?: number; high?: number };
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

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const styles = {
    BUY: "text-buy glow-buy bg-buy",
    PASS: "text-pass glow-pass bg-pass",
    RISKY: "text-risky glow-risky bg-risky",
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl border px-8 py-4 text-3xl font-bold tracking-widest animate-pulse-glow ${styles[verdict]}`}
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
}: {
  analysis: FullAnalysis;
}) {
  const { analysis: a, listing, vinDecode, fees, shipping } = analysis;
  const [expandedParts, setExpandedParts] = useState<Set<number>>(new Set());

  // Load saved edits on mount
  const saved = typeof window !== "undefined" ? loadEdits(analysis.id) : {};

  const [sliderPrice, setSliderPrice] = useState(saved.sliderPrice ?? (a.financials.purchase || 0));
  const [repairOverride, setRepairOverride] = useState<number | null>(saved.repairOverride ?? null);
  const [sellOverride, setSellOverride] = useState<number | null>(saved.sellOverride ?? null);
  const [partOverrides, setPartOverrides] = useState<Record<number, { low?: number; high?: number }>>(saved.partOverrides ?? {});
  const [laborOverride, setLaborOverride] = useState<{ low?: number; high?: number }>(saved.laborOverride ?? {});
  const [paintOverride, setPaintOverride] = useState<{ low?: number; high?: number }>(saved.paintOverride ?? {});
  const [noShipping, setNoShipping] = useState(saved.noShipping ?? false);
  const [userNotes, setUserNotes] = useState(saved.userNotes ?? "");

  // Auto-save edits on any change
  const doSave = useCallback(() => {
    saveEdits(analysis.id, {
      repairOverride, sellOverride, partOverrides,
      laborOverride, paintOverride, noShipping, userNotes, sliderPrice,
    });
  }, [analysis.id, repairOverride, sellOverride, partOverrides, laborOverride, paintOverride, noShipping, userNotes, sliderPrice]);

  useEffect(() => { doSave(); }, [doSave]);

  // Compute effective repair total from part/labor/paint overrides
  const hasPartOverrides = Object.keys(partOverrides).length > 0
    || laborOverride.low !== undefined || laborOverride.high !== undefined
    || paintOverride.low !== undefined || paintOverride.high !== undefined;

  const computedPartsLow = a.repairEstimate.parts.reduce((sum, part, i) =>
    sum + (partOverrides[i]?.low ?? part.costLow), 0);
  const computedPartsHigh = a.repairEstimate.parts.reduce((sum, part, i) =>
    sum + (partOverrides[i]?.high ?? part.costHigh), 0);
  const effectiveLaborLow = laborOverride.low ?? (a.repairEstimate.laborTotal?.low || 0);
  const effectiveLaborHigh = laborOverride.high ?? (a.repairEstimate.laborTotal?.high || 0);
  const effectivePaintLow = paintOverride.low ?? (a.repairEstimate.paint?.low || 0);
  const effectivePaintHigh = paintOverride.high ?? (a.repairEstimate.paint?.high || 0);
  const computedRepairLow = computedPartsLow + effectiveLaborLow + effectivePaintLow;
  const computedRepairHigh = computedPartsHigh + effectiveLaborHigh + effectivePaintHigh;

  // Priority: direct repair override > computed from part overrides > AI estimate
  const effectiveRepairLow = repairOverride ?? (hasPartOverrides ? computedRepairLow : a.repairEstimate.total.low);
  const effectiveRepairHigh = repairOverride ?? (hasPartOverrides ? computedRepairHigh : a.repairEstimate.total.high);
  const effectiveSellLow = sellOverride ?? a.financials.salePrice.low;
  const effectiveSellHigh = sellOverride ? Math.round(sellOverride * 1.1) : a.financials.salePrice.high;

  // Recompute all downstream values
  const purchase = a.financials.purchase;
  const feeAmount = a.financials.auctionFees.amount;
  const shipCost = noShipping ? 0 : (a.financials.shipping?.estimate || 0);
  const detailCost = a.financials.detailing || 0;

  const liveAllInLow = purchase + feeAmount + shipCost + effectiveRepairLow + detailCost;
  const liveAllInHigh = purchase + feeAmount + shipCost + effectiveRepairHigh + detailCost;
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
        <div className={`sticky top-12 z-40 -mx-5 mb-6 border-b border-[#27272a] bg-[#0a0a0b]/95 px-5 py-4 backdrop-blur-xl lg:static lg:mx-0 lg:mb-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none`}>
          {/* Desktop sidebar card with verdict glow */}
          <div className={`lg:card-elevated lg:p-6 lg:glow-${verdictColor}-ambient`}>
            <div className="flex items-center gap-5 lg:flex-col lg:items-stretch lg:gap-0">
              {/* Verdict badge */}
              <div className="lg:mb-6 lg:text-center">
                <VerdictBadge verdict={a.verdict} />
              </div>

              {/* Stats grid */}
              <div className="flex flex-1 items-center gap-5 lg:flex-col lg:items-stretch lg:gap-0">
                {/* All-in */}
                <div className="lg:py-4 lg:border-t lg:border-[#27272a]">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-1">
                    All-in
                  </div>
                  <div className={`num-xl ${isOverridden ? "text-[#7dd3fc]" : "text-[#e4e4e7]"}`}>
                    ${fmt(liveAllInLow)}
                  </div>
                </div>

                {/* Sell at */}
                <div className="lg:py-4 lg:border-t lg:border-[#27272a]">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-1">
                    Sell at
                  </div>
                  <div className={`num-xl ${sellOverride ? "text-[#7dd3fc]" : "text-[#e4e4e7]"}`}>
                    ${fmt(effectiveSellLow)}
                  </div>
                </div>

                {/* Profit — accent color */}
                <div className="lg:py-4 lg:border-t lg:border-[#27272a]">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-1">
                    Profit
                  </div>
                  <div
                    className={`num-xl ${liveProfitLow > 0 ? "text-buy" : "text-pass"}`}
                  >
                    {liveProfitLow > 0 ? "+" : ""}$
                    {fmt(liveProfitLow)}
                  </div>
                </div>

                {/* ROI */}
                <div className="lg:py-4 lg:border-t lg:border-[#27272a]">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-1">
                    ROI
                  </div>
                  <div className={`num-xl ${isOverridden ? "text-[#7dd3fc]" : "text-[#d4d4d8]"}`}>
                    {liveRoi}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="hidden lg:block mt-6">
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Your notes..."
              rows={4}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-[13px] text-white/60 placeholder-white/15 resize-none focus:border-[#7dd3fc]/20 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ============================================
          MAIN CONTENT — Scrollable Cards
          ============================================ */}
      <div className="flex-1 space-y-6">

        {/* ---- VEHICLE CARD ---- */}
        <div className={`card-gradient card-gradient-${verdictColor} p-7`}>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-[#fafafa]">
            {vehicleTitle}
          </h2>

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
            {a.vehicle.drivetrain && (
              <span className="rounded-lg bg-[#ffffff06] border border-[#ffffff08] px-3 py-1.5 text-[13px] text-[#a1a1aa]">
                {a.vehicle.drivetrain}
              </span>
            )}
            {listing.mileage && (
              <span className="rounded-lg bg-[#ffffff06] border border-[#ffffff08] px-3 py-1.5 text-[13px] text-[#a1a1aa]">
                <span className="mono">{fmt(listing.mileage)}</span> mi
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
          </div>

          {/* Verdict summary — blockquote callout */}
          <div className={`border-l-2 border-${verdictColor === "buy" ? "green" : verdictColor === "pass" ? "red" : "yellow"}-500/40 pl-4 py-1`}>
            <p className="text-[14px] leading-relaxed text-[#a1a1aa]">
              {a.verdictSummary}
            </p>
          </div>
        </div>

        {/* ---- PHOTO GRID ---- */}
        {listing.imageUrls.length > 0 && (
          <div>
            <div className={`grid gap-2.5 ${listing.imageUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {listing.imageUrls.slice(0, 4).map((imgUrl, i) => (
                <div
                  key={i}
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#111113] border border-[#232326]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={`Damage photo ${i + 1}`}
                    className="h-full w-full object-cover photo-hover"
                    loading="lazy"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-2xl" />
                </div>
              ))}
            </div>
            {listing.imageUrls.length > 4 && (
              <div className="mt-2 text-center">
                <span className="text-xs text-[#52525b]">
                  +{listing.imageUrls.length - 4} more photos
                </span>
              </div>
            )}
          </div>
        )}

        {/* ---- DAMAGE ASSESSMENT ---- */}
        <div className="card p-7">
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
            <div className="flex flex-wrap gap-2">
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
        </div>

        {/* ---- REPAIR TABLE ---- */}
        <div className="card p-7">
          <div className="mb-5 flex items-center gap-3">
            <h3 className="section-header">
              Repair Estimate
            </h3>
            <span className="rounded-lg bg-[#ffffff06] border border-[#ffffff08] px-2.5 py-1 text-xs text-[#52525b] font-medium">
              {analysis.repairProfile.replace("_", " ")}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#27272a] text-left text-[11px] uppercase tracking-wider text-[#52525b]">
                  <th className="pb-3 pr-4 font-medium">Part</th>
                  <th className="pb-3 pr-4 text-center font-medium">Type</th>
                  <th className="pb-3 pr-4 text-right font-medium">Low</th>
                  <th className="pb-3 text-right font-medium">High</th>
                </tr>
              </thead>
              <tbody>
                {a.repairEstimate.parts.map((part, i) => (
                  <tr
                    key={i}
                    className="row-stripe border-b border-[#1a1a1e] hover:bg-[#ffffff06] transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <span className="text-[#e4e4e7] text-[13px]">{part.name}</span>
                    </td>
                    <td className="py-3 pr-4 text-center">
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
                        className={`w-20 rounded border border-dashed bg-transparent px-2 py-1 text-right mono text-[14px] transition-all focus:outline-none ${
                          partOverrides[i]?.low !== undefined
                            ? "border-[#7dd3fc]/30 text-[#7dd3fc]"
                            : "border-white/[0.08] text-[#a1a1aa] hover:border-white/[0.15]"
                        }`}
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        defaultValue={part.costHigh}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : undefined;
                          setPartOverrides(prev => ({ ...prev, [i]: { ...prev[i], high: val } }));
                        }}
                        className={`w-20 rounded border border-dashed bg-transparent px-2 py-1 text-right mono text-[14px] transition-all focus:outline-none ${
                          partOverrides[i]?.high !== undefined
                            ? "border-[#7dd3fc]/30 text-[#7dd3fc]"
                            : "border-white/[0.08] text-[#a1a1aa] hover:border-white/[0.15]"
                        }`}
                      />
                    </td>
                  </tr>
                ))}
                {a.repairEstimate.laborHours > 0 && (
                  <tr className="row-stripe border-b border-[#1a1a1e]">
                    <td className="py-2 pr-4 text-[#a1a1aa] text-[13px]" colSpan={2}>
                      <span className="mr-2.5 text-xs text-[#3f3f46]">&#9702;</span>
                      Labor ({a.repairEstimate.laborHours}h @ ${a.repairEstimate.laborRateHr}/hr)
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        defaultValue={a.repairEstimate.laborTotal.low}
                        onChange={(e) => setLaborOverride(prev => ({ ...prev, low: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        className={`w-20 rounded border border-dashed bg-transparent px-2 py-1 text-right mono text-[14px] transition-all focus:outline-none ${
                          laborOverride.low !== undefined ? "border-[#7dd3fc]/30 text-[#7dd3fc]" : "border-white/[0.08] text-[#a1a1aa] hover:border-white/[0.15]"
                        }`}
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        defaultValue={a.repairEstimate.laborTotal.high}
                        onChange={(e) => setLaborOverride(prev => ({ ...prev, high: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        className={`w-20 rounded border border-dashed bg-transparent px-2 py-1 text-right mono text-[14px] transition-all focus:outline-none ${
                          laborOverride.high !== undefined ? "border-[#7dd3fc]/30 text-[#7dd3fc]" : "border-white/[0.08] text-[#a1a1aa] hover:border-white/[0.15]"
                        }`}
                      />
                    </td>
                  </tr>
                )}
                <tr className="row-stripe border-b border-[#1a1a1e]">
                  <td className="py-2 pr-4 text-[#a1a1aa] text-[13px]" colSpan={2}>
                    <span className="mr-2.5 text-xs text-[#3f3f46]">&#9702;</span>
                    Paint
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      defaultValue={a.repairEstimate.paint.low}
                      onChange={(e) => setPaintOverride(prev => ({ ...prev, low: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className={`w-20 rounded border border-dashed bg-transparent px-2 py-1 text-right mono text-[14px] transition-all focus:outline-none ${
                        paintOverride.low !== undefined ? "border-[#7dd3fc]/30 text-[#7dd3fc]" : "border-white/[0.08] text-[#a1a1aa] hover:border-white/[0.15]"
                      }`}
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      defaultValue={a.repairEstimate.paint.high}
                      onChange={(e) => setPaintOverride(prev => ({ ...prev, high: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className={`w-20 rounded border border-dashed bg-transparent px-2 py-1 text-right mono text-[14px] transition-all focus:outline-none ${
                        paintOverride.high !== undefined ? "border-[#7dd3fc]/30 text-[#7dd3fc]" : "border-white/[0.08] text-[#a1a1aa] hover:border-white/[0.15]"
                      }`}
                    />
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-4 pr-4 font-bold text-[#fafafa] text-[15px]" colSpan={2}>
                    TOTAL
                  </td>
                  <td className={`mono pt-4 pr-4 text-right font-bold text-[17px] ${hasPartOverrides ? "text-[#7dd3fc]" : "text-[#fafafa]"}`}>
                    ${fmt(effectiveRepairLow)}
                  </td>
                  <td className={`mono pt-4 text-right font-bold text-[17px] ${hasPartOverrides ? "text-[#7dd3fc]" : "text-[#fafafa]"}`}>
                    ${fmt(effectiveRepairHigh)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ---- COST STACK (Receipt Style) ---- */}
        <div className="card-elevated p-7">
          <h3 className="section-header mb-5">
            Cost Breakdown
          </h3>
          <div className="space-y-0">
            {/* Line items */}
            <div className="flex justify-between py-2.5 border-b border-dashed border-[#1e1e21]">
              <span className="text-[14px] text-[#71717a]">
                Purchase ({a.financials.auctionFees.platform === "copart" ? "Copart" : "IAA"})
              </span>
              <span className="num-md text-[#d4d4d8]">
                ${fmt(a.financials.purchase)}
              </span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-dashed border-[#1e1e21]">
              <span className="text-[14px] text-[#71717a]">
                Auction fees ({a.financials.auctionFees.feePct}%)
              </span>
              <span className="num-md text-[#d4d4d8]">
                ${fmt(a.financials.auctionFees.amount)}
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

            {/* Subtotal line */}
            <div className="my-1 border-t border-[#27272a]" />

            <div className="flex justify-between py-3">
              <span className="text-[14px] font-semibold text-[#e4e4e7]">ALL-IN</span>
              <span className={`num-lg ${isOverridden ? "text-[#7dd3fc]" : "text-[#e4e4e7]"}`}>
                ${fmt(liveAllInLow)} - ${fmt(liveAllInHigh)}
              </span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-[14px] font-semibold text-[#e4e4e7]">SELL AT</span>
              <span className={`num-lg ${sellOverride ? "text-[#7dd3fc]" : "text-[#e4e4e7]"}`}>
                ${fmt(effectiveSellLow)} - ${fmt(effectiveSellHigh)}
              </span>
            </div>

            {/* Profit line — the star */}
            <div className="my-1 border-t-2 border-[#27272a]" />

            <div className="flex justify-between items-center py-4">
              <span className={`text-lg font-bold tracking-wide ${liveProfitLow > 0 ? "text-buy" : "text-pass"}`}>
                PROFIT
              </span>
              <span
                className={`num-xl ${liveProfitLow > 0 ? "text-buy" : "text-pass"}`}
              >
                {liveProfitLow > 0 ? "+" : ""}${fmt(liveProfitLow)} to{" "}
                {liveProfitHigh > 0 ? "+" : ""}${fmt(liveProfitHigh)}
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

        {/* ---- BID SIMULATOR ---- */}
        <div className="card-elevated p-7">
          <h3 className="section-header mb-2">
            Bid Simulator
          </h3>
          <p className="text-[12px] text-[#52525b] mb-6">Drag to see your profit at any purchase price</p>

          {(() => {
            const fixedCosts = (a.financials.shipping?.estimate || 0) + a.financials.detailing;
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
                    {/* Actual range input overlay */}
                    <input
                      type="range"
                      min={0}
                      max={maxSlider}
                      step={Math.max(100, Math.round(maxSlider / 300))}
                      value={sliderPrice}
                      onChange={(e) => setSliderPrice(parseInt(e.target.value))}
                      className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
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

        {/* ---- MARKET VALUE ---- */}
        <div className="card p-7">
          <div className="mb-5 flex items-center gap-3">
            <h3 className="section-header">Market Value</h3>
            <span className="rounded-lg bg-[#ffffff06] border border-[#ffffff08] px-2 py-0.5 text-[10px] text-[#52525b] font-medium">AI estimate</span>
          </div>
          <div className="grid grid-cols-2 gap-5 text-sm sm:grid-cols-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-1.5">
                Clean Retail
              </div>
              <div className="num-md text-[#e4e4e7]">
                ${fmt(a.marketValue.cleanRetail.low)} - ${fmt(a.marketValue.cleanRetail.high)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-1.5">
                Private Party
              </div>
              <div className="num-md text-[#e4e4e7]">
                ${fmt(a.marketValue.privateParty.low)} - ${fmt(a.marketValue.privateParty.high)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-1.5">
                Demand
              </div>
              <div className="text-[#e4e4e7] capitalize font-medium">
                {a.marketValue.demand}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-1.5">
                Days to Sell
              </div>
              <div className="mono text-[#e4e4e7] font-medium">
                {a.marketValue.daysToSell}
              </div>
            </div>
          </div>
          {a.marketValue.titleImpactPct > 0 && (
            <div className="mt-4 rounded-xl border border-yellow-500/15 bg-yellow-500/[0.05] px-4 py-3 text-xs text-yellow-400">
              Title impact: -{a.marketValue.titleImpactPct}% from clean value
            </div>
          )}
          {a.marketValue.mileageNotes && (
            <p className="mt-3 text-xs text-[#52525b]">
              {a.marketValue.mileageNotes}
            </p>
          )}
        </div>

        {/* ---- BID CEILINGS ---- */}
        <div className="card p-7">
          <h3 className="section-header mb-5">
            Bid Ceilings
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-green-500/15 bg-green-500/[0.04] p-4 text-center">
              <div className="text-[10px] uppercase tracking-[0.15em] text-green-400/60 mb-2">Steal</div>
              <div className="num-xl text-green-400 mb-1">
                &lt;${fmt(a.bidCeilings.steal)}
              </div>
              <div className="text-[11px] text-[#52525b]">$10K+ profit</div>
            </div>
            <div className="rounded-xl border border-blue-500/15 bg-blue-500/[0.04] p-4 text-center">
              <div className="text-[10px] uppercase tracking-[0.15em] text-blue-400/60 mb-2">Good</div>
              <div className="num-xl text-blue-400 mb-1">
                &lt;${fmt(a.bidCeilings.good)}
              </div>
              <div className="text-[11px] text-[#52525b]">$5-10K profit</div>
            </div>
            <div className="rounded-xl border border-yellow-500/15 bg-yellow-500/[0.04] p-4 text-center">
              <div className="text-[10px] uppercase tracking-[0.15em] text-yellow-400/60 mb-2">Fair</div>
              <div className="num-xl text-yellow-400 mb-1">
                &lt;${fmt(a.bidCeilings.fair)}
              </div>
              <div className="text-[11px] text-[#52525b]">$2-5K profit</div>
            </div>
            <div className="rounded-xl border border-red-500/15 bg-red-500/[0.04] p-4 text-center">
              <div className="text-[10px] uppercase tracking-[0.15em] text-red-400/60 mb-2">Walk</div>
              <div className="num-xl text-red-400 mb-1">
                &gt;${fmt(a.bidCeilings.walk)}
              </div>
              <div className="text-[11px] text-[#52525b]">&lt;$2K or loss</div>
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
          <div className="card p-7">
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
          <div className="card p-7">
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

        {/* ---- RAW DATA (collapsed) ---- */}
        <details className="card p-7 group">
          <summary className="cursor-pointer text-sm text-[#3f3f46] hover:text-[#71717a] transition-colors font-medium">
            Raw listing data
          </summary>
          <pre className="mono mt-4 max-h-96 overflow-auto text-xs text-[#3f3f46] rounded-xl bg-[#111113] border border-[#232326] p-4">
            {JSON.stringify({ listing, vinDecode, fees, shipping }, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
