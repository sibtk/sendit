import { Metadata } from "next";
import { STATE_TITLE_LAWS, type StateTitleLaw } from "@/lib/state-title-laws";
import { notFound } from "next/navigation";
import Link from "next/link";

// Generate static pages for all 50 states
export function generateStaticParams() {
  return Object.values(STATE_TITLE_LAWS).map((law) => ({
    state: law.state.toLowerCase().replace(/\s+/g, "-"),
  }));
}

function findState(slug: string): StateTitleLaw | null {
  return Object.values(STATE_TITLE_LAWS).find(
    (law) => law.state.toLowerCase().replace(/\s+/g, "-") === slug
  ) || null;
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params;
  const law = findState(state);
  if (!law) return { title: "State Not Found" };

  return {
    title: `${law.state} Salvage & Rebuilt Title Laws 2026 | sendit scan`,
    description: `${law.state} salvage title laws — ${law.flipperRating} for flippers. Inspection: ${law.inspectionCost ? `$${law.inspectionCost}` : "none"}. ${law.ageExemptions || "Standard process."}. Rebuilt title reduces value by ${law.titleImpactPct.rebuilt}%.`,
    keywords: `${law.state} salvage title, ${law.state} rebuilt title, ${law.state} salvage title laws, ${law.state} rebuilt title inspection, ${law.stateCode} title laws`,
  };
}

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const law = findState(state);
  if (!law) notFound();

  const ratingColors = {
    friendly: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" },
    moderate: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" },
    strict: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
  };
  const rc = ratingColors[law.flipperRating];

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <Link href="/tools/title-laws" className="text-[12px] text-[#52525b] hover:text-[#a1a1aa] transition-colors mb-6 block">
        ← All states
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold text-[#fafafa]" style={{ fontFamily: "var(--font-grotesk)" }}>
          {law.state}
        </h1>
        <span className={`rounded-md border px-2.5 py-1 text-[12px] font-medium ${rc.bg} ${rc.border} ${rc.text}`}>
          {law.flipperRating}
        </span>
      </div>
      <p className="text-[15px] text-[#52525b] mb-8">Salvage & rebuilt title laws for car flippers — updated 2026</p>

      <div className="space-y-6">
        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-[#27272a] bg-[#141414] p-4">
            <div className="text-[10px] uppercase tracking-wider text-[#52525b] mb-1">Inspection</div>
            <div className="text-lg font-bold mono text-[#e4e4e7]">{law.inspectionCost ? `$${law.inspectionCost}` : "None"}</div>
          </div>
          <div className="rounded-xl border border-[#27272a] bg-[#141414] p-4">
            <div className="text-[10px] uppercase tracking-wider text-[#52525b] mb-1">Rebuilt Impact</div>
            <div className="text-lg font-bold mono text-[#e4e4e7]">-{law.titleImpactPct.rebuilt}%</div>
          </div>
          <div className="rounded-xl border border-[#27272a] bg-[#141414] p-4">
            <div className="text-[10px] uppercase tracking-wider text-[#52525b] mb-1">Threshold</div>
            <div className="text-sm font-bold mono text-[#e4e4e7]">{law.totalLossThreshold}</div>
          </div>
          <div className="rounded-xl border border-[#27272a] bg-[#141414] p-4">
            <div className="text-[10px] uppercase tracking-wider text-[#52525b] mb-1">Title Fee</div>
            <div className="text-lg font-bold mono text-[#e4e4e7]">{law.rebuiltTitleFee ? `$${law.rebuiltTitleFee}` : "Varies"}</div>
          </div>
        </div>

        {/* Flipper notes */}
        <div className={`rounded-xl border ${rc.border} ${rc.bg} px-5 py-4`}>
          <p className={`text-[14px] ${rc.text}`}>{law.flipperNotes}</p>
        </div>

        {/* Age exemption callout */}
        {law.ageExemptions && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/[0.04] px-5 py-4">
            <div className="text-[12px] font-semibold text-green-400 mb-1">Age Exemption</div>
            <p className="text-[14px] text-green-400/80">{law.ageExemptions}</p>
          </div>
        )}

        {/* Details */}
        <div className="space-y-5 text-[14px] text-[#a1a1aa]">
          <section>
            <h2 className="text-[16px] font-semibold text-[#e4e4e7] mb-2">Conversion Process</h2>
            <p>{law.conversionProcess}</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#e4e4e7] mb-2">Inspection Requirements</h2>
            <p><strong className="text-[#e4e4e7]">Type:</strong> {law.inspectionType}</p>
            <p><strong className="text-[#e4e4e7]">Agency:</strong> {law.inspectionAgency}</p>
            {law.inspectionNotes && <p className="text-[#71717a] mt-1">{law.inspectionNotes}</p>}
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#e4e4e7] mb-2">Out-of-State Titles</h2>
            <p>
              <strong className="text-[#e4e4e7]">Accepts out-of-state salvage:</strong>{" "}
              <span className={law.acceptsOutOfStateSalvage ? "text-green-400" : "text-red-400"}>
                {law.acceptsOutOfStateSalvage ? "Yes" : "No"}
              </span>
            </p>
            <p>
              <strong className="text-[#e4e4e7]">Accepts non-repairable:</strong>{" "}
              <span className={law.acceptsNonRepairable ? "text-green-400" : "text-red-400"}>
                {law.acceptsNonRepairable ? "Yes" : "No"}
              </span>
            </p>
            {law.outOfStateNotes && <p className="text-[#71717a] mt-1">{law.outOfStateNotes}</p>}
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#e4e4e7] mb-2">Title Branding</h2>
            <p>Title reads: <span className="mono text-[#e4e4e7]">{law.titleBrand}</span></p>
            <p>Issues parts-only: {law.issuesPartsOnly ? "Yes" : "No"}</p>
            <p>Issues certificate of destruction: {law.issuesCertOfDestruction ? "Yes" : "No"}</p>
            {law.nonRepairableLabel && <p>Non-repairable label: {law.nonRepairableLabel}</p>}
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#e4e4e7] mb-2">Resale Impact</h2>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 mono text-[13px]">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-[#71717a]">Salvage title</span>
                <span className="text-red-400">-{law.titleImpactPct.salvage}% from clean value</span>
                <span className="text-[#71717a]">Rebuilt title</span>
                <span className="text-yellow-400">-{law.titleImpactPct.rebuilt}% from clean value</span>
              </div>
            </div>
            {law.resaleNotes && <p className="text-[#71717a] mt-2">{law.resaleNotes}</p>}
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#e4e4e7] mb-2">Fees</h2>
            <p>Salvage title fee: {law.salvageTitleFee ? `$${law.salvageTitleFee}` : "Varies"}</p>
            <p>Rebuilt title fee: {law.rebuiltTitleFee ? `$${law.rebuiltTitleFee}` : "Varies"}</p>
          </section>

          {law.specialRestrictions.length > 0 && (
            <section>
              <h2 className="text-[16px] font-semibold text-[#e4e4e7] mb-2">Special Restrictions</h2>
              <ul className="space-y-1">
                {law.specialRestrictions.map((r, i) => (
                  <li key={i} className="text-[#71717a]">• {r}</li>
                ))}
              </ul>
            </section>
          )}

          {law.dmvUrl && (
            <a href={law.dmvUrl} target="_blank" rel="noopener noreferrer" className="block text-[12px] text-[#7dd3fc]/60 hover:text-[#7dd3fc] transition-colors">
              Official {law.state} DMV source ↗
            </a>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-xl border border-[#7dd3fc]/15 bg-[#7dd3fc]/[0.03] px-6 py-5 text-center">
        <p className="text-[14px] text-[#a1a1aa] mb-4">Ready to find your next flip in {law.state}?</p>
        <a href="/" className="inline-block rounded-lg bg-[#7dd3fc] px-5 py-2.5 text-[13px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all">
          Try sendit scan free
        </a>
      </div>
    </div>
  );
}
