"use client";

import { useState } from "react";
import Link from "next/link";
import { STATE_TITLE_LAWS, getStateLaw, getFlipperFriendlyStates, getStrictStates, getStatesWithAgeExemptions, type StateTitleLaw } from "@/lib/state-title-laws";

function RatingBadge({ rating }: { rating: string }) {
  const styles = {
    friendly: "bg-green-500/10 border-green-500/20 text-green-400",
    moderate: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
    strict: "bg-red-500/10 border-red-500/20 text-red-400",
  };
  return (
    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${styles[rating as keyof typeof styles] || styles.moderate}`}>
      {rating}
    </span>
  );
}

function StateCard({ law }: { law: StateTitleLaw }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-[#27272a] bg-[#141414] p-5 hover:border-[#3f3f46] transition-all">
      <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <h3 className="text-[16px] font-semibold text-[#e4e4e7]">{law.state}</h3>
          <RatingBadge rating={law.flipperRating} />
        </div>
        <span className={`text-[10px] text-[#3f3f46] transition-transform ${expanded ? "rotate-180" : ""}`}>▾</span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-[12px] mb-3">
        <div>
          <span className="text-[#52525b] block text-[10px] mb-0.5">Inspection</span>
          <span className="text-[#a1a1aa]">{law.inspectionCost ? `$${law.inspectionCost}` : "None"}</span>
        </div>
        <div>
          <span className="text-[#52525b] block text-[10px] mb-0.5">Rebuilt impact</span>
          <span className="text-[#a1a1aa]">-{law.titleImpactPct.rebuilt}%</span>
        </div>
        <div>
          <span className="text-[#52525b] block text-[10px] mb-0.5">Threshold</span>
          <span className="text-[#a1a1aa]">{law.totalLossThreshold}</span>
        </div>
      </div>

      <p className="text-[12px] text-[#52525b]">{law.flipperNotes}</p>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-[#1e1e21] space-y-3 text-[12px]">
          <div>
            <span className="text-[#52525b] text-[10px] uppercase tracking-wider">Process</span>
            <p className="text-[#a1a1aa] mt-1">{law.conversionProcess}</p>
          </div>
          <div>
            <span className="text-[#52525b] text-[10px] uppercase tracking-wider">Inspection</span>
            <p className="text-[#a1a1aa] mt-1">{law.inspectionType} — {law.inspectionAgency}</p>
            {law.inspectionNotes && <p className="text-[#71717a] mt-1">{law.inspectionNotes}</p>}
          </div>
          <div>
            <span className="text-[#52525b] text-[10px] uppercase tracking-wider">Out-of-state</span>
            <p className="text-[#a1a1aa] mt-1">
              Accepts salvage: {law.acceptsOutOfStateSalvage ? "Yes" : "No"} |
              Accepts non-repairable: {law.acceptsNonRepairable ? "Yes" : "No"}
            </p>
            {law.outOfStateNotes && <p className="text-[#71717a] mt-1">{law.outOfStateNotes}</p>}
          </div>
          {law.ageExemptions && (
            <div>
              <span className="text-[#52525b] text-[10px] uppercase tracking-wider">Age exemption</span>
              <p className="text-green-400 mt-1">{law.ageExemptions}</p>
            </div>
          )}
          <div>
            <span className="text-[#52525b] text-[10px] uppercase tracking-wider">Title brand</span>
            <p className="text-[#a1a1aa] mt-1">{law.titleBrand}</p>
          </div>
          <div>
            <span className="text-[#52525b] text-[10px] uppercase tracking-wider">Value impact</span>
            <p className="text-[#a1a1aa] mt-1">Salvage: -{law.titleImpactPct.salvage}% | Rebuilt: -{law.titleImpactPct.rebuilt}%</p>
            {law.resaleNotes && <p className="text-[#71717a] mt-1">{law.resaleNotes}</p>}
          </div>
          <div>
            <span className="text-[#52525b] text-[10px] uppercase tracking-wider">Fees</span>
            <p className="text-[#a1a1aa] mt-1">
              Salvage title: {law.salvageTitleFee ? `$${law.salvageTitleFee}` : "Varies"} |
              Rebuilt title: {law.rebuiltTitleFee ? `$${law.rebuiltTitleFee}` : "Varies"}
            </p>
          </div>
          {law.specialRestrictions.length > 0 && (
            <div>
              <span className="text-[#52525b] text-[10px] uppercase tracking-wider">Restrictions</span>
              <ul className="mt-1 space-y-1">
                {law.specialRestrictions.map((r, i) => (
                  <li key={i} className="text-[#71717a]">• {r}</li>
                ))}
              </ul>
            </div>
          )}
          {law.dmvUrl && (
            <a href={law.dmvUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#7dd3fc]/60 hover:text-[#7dd3fc] transition-colors">
              Official DMV source ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function TitleLawsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "friendly" | "moderate" | "strict">("all");

  const friendlyStates = getFlipperFriendlyStates();
  const strictStates = getStrictStates();
  const ageExemptions = getStatesWithAgeExemptions();

  const allStates = Object.values(STATE_TITLE_LAWS);
  const filtered = allStates.filter((law: StateTitleLaw) => {
    if (filter !== "all" && law.flipperRating !== filter) return false;
    if (search && !law.state.toLowerCase().includes(search.toLowerCase()) && !law.stateCode.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="text-3xl font-bold text-[#fafafa] mb-2" style={{ fontFamily: "var(--font-grotesk)" }}>
        Salvage & Rebuilt Title Laws by State
      </h1>
      <p className="text-[#52525b] text-[15px] mb-8">
        Every state's rules for salvage titles, rebuilt inspections, fees, and flipper friendliness. Updated 2026.
      </p>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="rounded-xl border border-green-500/10 bg-green-500/[0.03] p-4 text-center">
          <div className="text-2xl font-bold mono text-green-400">{friendlyStates.length}</div>
          <div className="text-[11px] text-[#52525b] mt-1">Flipper Friendly</div>
        </div>
        <div className="rounded-xl border border-yellow-500/10 bg-yellow-500/[0.03] p-4 text-center">
          <div className="text-2xl font-bold mono text-yellow-400">{50 - friendlyStates.length - strictStates.length}</div>
          <div className="text-[11px] text-[#52525b] mt-1">Moderate</div>
        </div>
        <div className="rounded-xl border border-red-500/10 bg-red-500/[0.03] p-4 text-center">
          <div className="text-2xl font-bold mono text-red-400">{strictStates.length}</div>
          <div className="text-[11px] text-[#52525b] mt-1">Strict</div>
        </div>
      </div>

      {/* Age exemptions callout */}
      {ageExemptions.length > 0 && (
        <div className="mb-8 rounded-xl border border-green-500/15 bg-green-500/[0.03] px-5 py-4">
          <h3 className="text-[14px] font-semibold text-green-400 mb-2">States with Age Exemptions</h3>
          <p className="text-[12px] text-[#71717a] mb-3">These states reduce or eliminate salvage requirements for older vehicles — huge for flipping.</p>
          <div className="flex flex-wrap gap-2">
            {ageExemptions.map((law: StateTitleLaw) => (
              <span key={law.stateCode} className="rounded-md bg-green-500/10 border border-green-500/20 px-2 py-1 text-[11px] text-green-400">
                {law.stateCode}: {law.ageExemptions}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search state..."
          className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[13px] text-white/70 placeholder-white/20 focus:border-[#7dd3fc]/30 focus:outline-none"
        />
        <div className="flex gap-1.5">
          {(["all", "friendly", "moderate", "strict"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-2 text-[11px] font-medium transition-all ${
                filter === f
                  ? "bg-[#7dd3fc]/10 border border-[#7dd3fc]/20 text-[#7dd3fc]"
                  : "border border-white/[0.06] text-[#52525b] hover:text-[#a1a1aa]"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* State cards */}
      <div className="space-y-3">
        {filtered.map(law => (
          <StateCard key={law.stateCode} law={law} />
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-xl border border-[#7dd3fc]/15 bg-[#7dd3fc]/[0.03] px-6 py-5 text-center">
        <p className="text-[14px] text-[#a1a1aa] mb-1">Title laws are just one piece of the puzzle.</p>
        <p className="text-[12px] text-[#52525b] mb-4">Get the full picture — damage, repairs, fees, market value — in 15 seconds.</p>
        <a href="/" className="inline-block rounded-lg bg-[#7dd3fc] px-5 py-2.5 text-[13px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all">
          Try sendit scan free
        </a>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 text-[10px] text-[#3f3f46] leading-relaxed px-1">
        Title laws change frequently and vary by county. The information on this page is for general reference only and may not reflect the most current regulations. Always verify with your local DMV or title office before making purchasing decisions. sendit scan is not a legal service and this does not constitute legal advice.
      </div>
    </div>
  );
}
