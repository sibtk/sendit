import { Metadata } from "next";
import { STATE_TITLE_LAWS, type StateTitleLaw } from "@/lib/state-title-laws";
import { notFound } from "next/navigation";
import Link from "next/link";

// Top origin states (high volume auction inventory)
const ORIGINS = ["california", "new-york", "florida", "texas", "pennsylvania", "michigan", "ohio", "illinois", "georgia", "new-jersey"];
// Top destination states (flipper friendly)
const DESTINATIONS = ["texas", "florida", "oklahoma", "arkansas", "north-carolina", "georgia", "alabama", "indiana", "arizona", "illinois"];

export function generateStaticParams() {
  const params: { from: string; to: string }[] = [];
  for (const from of ORIGINS) {
    for (const to of DESTINATIONS) {
      if (from !== to) {
        params.push({ from, to });
      }
    }
  }
  return params;
}

function findState(slug: string): StateTitleLaw | null {
  return Object.values(STATE_TITLE_LAWS).find(
    (law) => law.state.toLowerCase().replace(/\s+/g, "-") === slug
  ) || null;
}

export async function generateMetadata({ params }: { params: Promise<{ from: string; to: string }> }): Promise<Metadata> {
  const { from, to } = await params;
  const fromState = findState(from);
  const toState = findState(to);
  if (!fromState || !toState) return { title: "Not Found" };

  return {
    title: `${fromState.state} to ${toState.state}: Salvage Title Transfer Guide 2026 | sendit scan`,
    description: `How to buy a salvage car in ${fromState.state} and title it in ${toState.state}. Inspection costs, fees, process, and whether it's worth the cross-state move.`,
    keywords: `${fromState.state} salvage title to ${toState.state}, transfer salvage title ${fromState.stateCode} to ${toState.stateCode}, ${fromState.state} to ${toState.state} rebuilt title, cross state salvage title`,
  };
}

export default async function CrossStatePage({ params }: { params: Promise<{ from: string; to: string }> }) {
  const { from, to } = await params;
  const fromState = findState(from);
  const toState = findState(to);
  if (!fromState || !toState) notFound();

  const toRc = {
    friendly: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" },
    moderate: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" },
    strict: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
  }[toState.flipperRating];

  const fromRc = {
    friendly: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" },
    moderate: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" },
    strict: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
  }[fromState.flipperRating];

  const worthIt = toState.flipperRating === "friendly" && fromState.flipperRating !== "friendly";
  const inspectionSavings = (fromState.inspectionCost || 0) - (toState.inspectionCost || 0);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <Link href="/tools/title-laws" className="text-[12px] text-[#52525b] hover:text-[#a1a1aa] transition-colors mb-6 block">
        ← All states
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-[#fafafa] mb-2" style={{ fontFamily: "var(--font-grotesk)" }}>
        {fromState.state} → {toState.state}
      </h1>
      <p className="text-[15px] text-[#52525b] mb-8">Salvage title transfer guide for car flippers</p>

      {/* State comparison */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-[#27272a] bg-[#141414] p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[14px] font-semibold text-[#e4e4e7]">{fromState.state}</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${fromRc.bg} ${fromRc.border} ${fromRc.text}`}>{fromState.flipperRating}</span>
          </div>
          <div className="space-y-1 text-[12px] text-[#71717a]">
            <p>Inspection: {fromState.inspectionCost ? `$${fromState.inspectionCost}` : "None"}</p>
            <p>Rebuilt impact: -{fromState.titleImpactPct.rebuilt}%</p>
            <p>Threshold: {fromState.totalLossThreshold}</p>
          </div>
        </div>
        <div className="rounded-xl border border-[#27272a] bg-[#141414] p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[14px] font-semibold text-[#e4e4e7]">{toState.state}</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${toRc.bg} ${toRc.border} ${toRc.text}`}>{toState.flipperRating}</span>
          </div>
          <div className="space-y-1 text-[12px] text-[#71717a]">
            <p>Inspection: {toState.inspectionCost ? `$${toState.inspectionCost}` : "None"}</p>
            <p>Rebuilt impact: -{toState.titleImpactPct.rebuilt}%</p>
            <p>Threshold: {toState.totalLossThreshold}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 text-[14px] text-[#a1a1aa] leading-relaxed">
        {/* Verdict */}
        <div className={`rounded-xl border px-5 py-4 ${worthIt ? "border-green-500/20 bg-green-500/[0.03]" : "border-[#27272a] bg-[#141414]"}`}>
          <h2 className={`text-[16px] font-semibold mb-2 ${worthIt ? "text-green-400" : "text-[#e4e4e7]"}`}>
            {worthIt ? "Worth the cross-state move" : "Compare the numbers"}
          </h2>
          <p>
            {toState.acceptsOutOfStateSalvage
              ? `${toState.state} accepts out-of-state salvage titles from ${fromState.state}.`
              : `${toState.state} may not accept ${fromState.state} salvage titles directly — check with the ${toState.state} DMV.`}
            {" "}
            {toState.acceptsNonRepairable
              ? `Non-repairable titles from ${fromState.state} are also accepted.`
              : `Non-repairable titles from ${fromState.state} may NOT be accepted.`}
          </p>
          {toState.outOfStateNotes && <p className="mt-2 text-[#71717a]">{toState.outOfStateNotes}</p>}
        </div>

        {/* Process */}
        <section>
          <h2 className="text-[16px] font-semibold text-[#e4e4e7] mb-2">The Process</h2>
          <ol className="list-decimal list-inside space-y-2 text-[#71717a]">
            <li>Buy the vehicle at auction in {fromState.state}</li>
            <li>Get the {fromState.state} title (salvage/non-repairable) from the auction</li>
            <li>Transport the vehicle to {toState.state}</li>
            <li>Apply for a {toState.state} salvage title using the {fromState.state} title + bill of sale</li>
            <li>Complete repairs</li>
            {toState.inspectionRequired && <li>Pass {toState.state} rebuilt inspection ({toState.inspectionType}) — {toState.inspectionCost ? `$${toState.inspectionCost}` : "fee varies"}</li>}
            <li>Receive {toState.state} rebuilt title: "{toState.titleBrand}"</li>
          </ol>
        </section>

        {/* Age exemption */}
        {toState.ageExemptions && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/[0.04] px-5 py-4">
            <div className="text-[12px] font-semibold text-green-400 mb-1">{toState.state} Age Exemption</div>
            <p className="text-[14px] text-green-400/80">{toState.ageExemptions}</p>
          </div>
        )}

        {/* Cost estimate */}
        <section>
          <h2 className="text-[16px] font-semibold text-[#e4e4e7] mb-2">Estimated Cross-State Costs</h2>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 mono text-[13px]">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-[#71717a]">{toState.state} title fee</span>
              <span className="text-[#e4e4e7]">{toState.rebuiltTitleFee ? `$${toState.rebuiltTitleFee}` : "Varies"}</span>
              <span className="text-[#71717a]">Rebuilt inspection</span>
              <span className="text-[#e4e4e7]">{toState.inspectionCost ? `$${toState.inspectionCost}` : "$0"}</span>
              <span className="text-[#71717a]">Transport (estimate)</span>
              <span className="text-[#e4e4e7]">$300-$1,200</span>
              <span className="text-[#71717a] font-semibold border-t border-white/[0.06] pt-2">Total extra cost</span>
              <span className="text-[#7dd3fc] font-semibold border-t border-white/[0.06] pt-2">
                ${(toState.rebuiltTitleFee || 50) + (toState.inspectionCost || 0) + 300}-${(toState.rebuiltTitleFee || 100) + (toState.inspectionCost || 0) + 1200}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-xl border border-[#7dd3fc]/15 bg-[#7dd3fc]/[0.03] px-6 py-5 text-center">
        <p className="text-[14px] text-[#a1a1aa] mb-4">Find a car worth flipping from {fromState.state} to {toState.state}.</p>
        <a href="/" className="inline-block rounded-lg bg-[#7dd3fc] px-5 py-2.5 text-[13px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all">
          Try sendit scan free
        </a>
      </div>
    </div>
  );
}
