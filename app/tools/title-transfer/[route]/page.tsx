import { Metadata } from "next";
import { STATE_TITLE_LAWS, type StateTitleLaw } from "@/lib/state-title-laws";
import { notFound } from "next/navigation";
import Link from "next/link";

const ORIGINS = ["california", "new-york", "florida", "texas", "pennsylvania", "michigan", "ohio", "illinois", "georgia", "new-jersey"];
const DESTINATIONS = ["texas", "florida", "oklahoma", "arkansas", "north-carolina", "georgia", "alabama", "indiana", "arizona", "illinois"];

export function generateStaticParams() {
  const params: { route: string }[] = [];
  for (const from of ORIGINS) {
    for (const to of DESTINATIONS) {
      if (from !== to) params.push({ route: `${from}-to-${to}` });
    }
  }
  return params;
}

function parseRoute(route: string): { from: string; to: string } | null {
  const match = route.match(/^(.+)-to-(.+)$/);
  if (!match) return null;
  return { from: match[1], to: match[2] };
}

function findState(slug: string): StateTitleLaw | null {
  return Object.values(STATE_TITLE_LAWS).find(
    (law) => law.state.toLowerCase().replace(/\s+/g, "-") === slug
  ) || null;
}

export async function generateMetadata({ params }: { params: Promise<{ route: string }> }): Promise<Metadata> {
  const { route } = await params;
  const parsed = parseRoute(route);
  if (!parsed) return { title: "Not Found" };
  const fromState = findState(parsed.from);
  const toState = findState(parsed.to);
  if (!fromState || !toState) return { title: "Not Found" };

  return {
    title: `${fromState.state} to ${toState.state}: Salvage Title Transfer Guide 2026 | sendit scan`,
    description: `Buy a salvage car in ${fromState.state}, title it in ${toState.state}. Inspection costs, fees, process, and whether the cross-state move is worth it.`,
  };
}

export default async function CrossStatePage({ params }: { params: Promise<{ route: string }> }) {
  const { route } = await params;
  const parsed = parseRoute(route);
  if (!parsed) notFound();
  const fromState = findState(parsed.from);
  const toState = findState(parsed.to);
  if (!fromState || !toState) notFound();

  const rc = (rating: string) =>
    rating === "friendly" ? "bg-green-500/10 border-green-500/20 text-green-400" :
    rating === "strict" ? "bg-red-500/10 border-red-500/20 text-red-400" :
    "bg-yellow-500/10 border-yellow-500/20 text-yellow-400";

  const worthIt = toState.flipperRating === "friendly" && fromState.flipperRating !== "friendly";

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <Link href="/tools/title-laws" className="text-[12px] text-[#52525b] hover:text-[#a1a1aa] transition-colors mb-6 block">← All states</Link>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#fafafa] mb-2" style={{ fontFamily: "var(--font-grotesk)" }}>{fromState.state} → {toState.state}</h1>
      <p className="text-[15px] text-[#52525b] mb-8">Salvage title transfer guide for car flippers</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-[#27272a] bg-[#141414] p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[14px] font-semibold text-[#e4e4e7]">{fromState.state}</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${rc(fromState.flipperRating)}`}>{fromState.flipperRating}</span>
          </div>
          <div className="space-y-1 text-[12px] text-[#71717a]">
            <p>Inspection: {fromState.inspectionCost ? `$${fromState.inspectionCost}` : "None"}</p>
            <p>Rebuilt impact: -{fromState.titleImpactPct.rebuilt}%</p>
          </div>
        </div>
        <div className="rounded-xl border border-[#27272a] bg-[#141414] p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[14px] font-semibold text-[#e4e4e7]">{toState.state}</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${rc(toState.flipperRating)}`}>{toState.flipperRating}</span>
          </div>
          <div className="space-y-1 text-[12px] text-[#71717a]">
            <p>Inspection: {toState.inspectionCost ? `$${toState.inspectionCost}` : "None"}</p>
            <p>Rebuilt impact: -{toState.titleImpactPct.rebuilt}%</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 text-[14px] text-[#a1a1aa] leading-relaxed">
        <div className={`rounded-xl border px-5 py-4 ${worthIt ? "border-green-500/20 bg-green-500/[0.03]" : "border-[#27272a] bg-[#141414]"}`}>
          <h2 className={`text-[16px] font-semibold mb-2 ${worthIt ? "text-green-400" : "text-[#e4e4e7]"}`}>{worthIt ? "Worth the cross-state move" : "Compare the numbers"}</h2>
          <p>{toState.acceptsOutOfStateSalvage ? `${toState.state} accepts out-of-state salvage titles.` : `${toState.state} may not accept out-of-state salvage titles directly.`} {toState.acceptsNonRepairable ? "Non-repairable titles are also accepted." : "Non-repairable titles may NOT be accepted."}</p>
          {toState.outOfStateNotes && <p className="mt-2 text-[#71717a]">{toState.outOfStateNotes}</p>}
        </div>

        <section>
          <h2 className="text-[16px] font-semibold text-[#e4e4e7] mb-2">The Process</h2>
          <ol className="list-decimal list-inside space-y-2 text-[#71717a]">
            <li>Buy the vehicle at auction in {fromState.state}</li>
            <li>Get the {fromState.state} title from the auction</li>
            <li>Transport the vehicle to {toState.state}</li>
            <li>Apply for a {toState.state} salvage title</li>
            <li>Complete repairs</li>
            {toState.inspectionRequired && <li>Pass {toState.state} rebuilt inspection ({toState.inspectionType}) — {toState.inspectionCost ? `$${toState.inspectionCost}` : "fee varies"}</li>}
            <li>Receive {toState.state} rebuilt title</li>
          </ol>
        </section>

        {toState.ageExemptions && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/[0.04] px-5 py-4">
            <div className="text-[12px] font-semibold text-green-400 mb-1">{toState.state} Age Exemption</div>
            <p className="text-[14px] text-green-400/80">{toState.ageExemptions}</p>
          </div>
        )}

        <section>
          <h2 className="text-[16px] font-semibold text-[#e4e4e7] mb-2">Estimated Costs</h2>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 mono text-[13px]">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-[#71717a]">Title fee</span><span className="text-[#e4e4e7]">{toState.rebuiltTitleFee ? `$${toState.rebuiltTitleFee}` : "Varies"}</span>
              <span className="text-[#71717a]">Inspection</span><span className="text-[#e4e4e7]">{toState.inspectionCost ? `$${toState.inspectionCost}` : "$0"}</span>
              <span className="text-[#71717a]">Transport</span><span className="text-[#e4e4e7]">$300-$1,200</span>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-8 text-[10px] text-[#3f3f46]">Title laws change frequently. Always verify with your local DMV before purchasing.</div>

      <div className="mt-8 rounded-xl border border-[#7dd3fc]/15 bg-[#7dd3fc]/[0.03] px-6 py-5 text-center">
        <p className="text-[14px] text-[#a1a1aa] mb-4">Find a car worth flipping from {fromState.state} to {toState.state}.</p>
        <a href="/" className="inline-block rounded-lg bg-[#7dd3fc] px-5 py-2.5 text-[13px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all">Try sendit scan free</a>
      </div>
    </div>
  );
}
