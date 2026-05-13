import { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Estimate Repair Costs on a Salvage Car Before You Bid | sendit scan",
  description: "The #1 mistake auction buyers make is underestimating repairs. Learn how to assess damage from photos, estimate parts and labor, and calculate your real all-in cost.",
  keywords: "salvage car repair cost, estimate repair cost copart, how much to fix salvage car, auction car repair estimate, copart repair cost calculator",
};

export default function RepairCostGuide() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <article>
        <time className="text-[11px] text-[#3f3f46]">May 13, 2026</time>
        <h1 className="text-3xl font-bold text-[#fafafa] mt-2 mb-4" style={{ fontFamily: "var(--font-grotesk)" }}>
          How to Estimate Repair Costs on a Salvage Car Before You Bid
        </h1>
        <p className="text-[15px] text-[#71717a] mb-8 leading-relaxed">
          The repair estimate is the hardest number to get right — and the most important. Get it wrong and the entire deal falls apart. Here's how to estimate repair costs using only the information available before you buy.
        </p>

        <div className="prose-custom space-y-8 text-[14px] text-[#a1a1aa] leading-relaxed">
          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Step 1: Read the Damage Description</h2>
            <p>Both Copart and IAA list the primary and secondary damage type. Common descriptions:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[#71717a]">
              <li><strong className="text-[#e4e4e7]">Front End</strong> — bumper, hood, headlights, radiator support. Usually $2,000-$6,000.</li>
              <li><strong className="text-[#e4e4e7]">Left/Right Side</strong> — doors, quarter panels, rocker panels. $1,500-$8,000 depending on how many panels.</li>
              <li><strong className="text-[#e4e4e7]">Rear End</strong> — bumper, tail lights, trunk. Usually cheapest to fix: $1,500-$4,000.</li>
              <li><strong className="text-[#e4e4e7]">Rollover</strong> — roof, pillars, multiple panels. Usually totaled for a reason. $8,000+.</li>
              <li><strong className="text-[#e4e4e7]">Biohazard</strong> — mold, fluid contamination. Exterior usually clean. $500-$3,000 for remediation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Step 2: Study Every Photo</h2>
            <p>Photos are your primary tool. For each photo:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[#71717a]">
              <li>Check panel alignment — uneven gaps mean structural damage</li>
              <li>Compare wheel angles — a wheel sitting different from the other side means suspension damage ($500-$2,000)</li>
              <li>Look for missing parts — missing bumper is obvious, but also check mirrors, trim, lights</li>
              <li>Check for airbag deployment — if bags are out, add $2,500-$5,000 to your estimate</li>
              <li>Look at the interior — flood damage, mold, missing parts</li>
            </ul>
            <p className="mt-3">The damage description is a starting point. Photos are the truth. Sometimes the listing says "Front End" but the car is nearly clean — and sometimes "Minor Dent" turns out to be a crushed quarter panel.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Step 3: Price the Parts</h2>
            <p>Parts cost varies dramatically by vehicle tier:</p>
            <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-[13px]">
              <div className="space-y-3">
                <div>
                  <span className="text-[#e4e4e7] font-medium">Economy (Camry, Civic, Corolla):</span>
                  <span className="text-[#71717a] ml-2">Bumper $150-300 | Hood $200-350 | Headlight $100-200</span>
                </div>
                <div>
                  <span className="text-[#e4e4e7] font-medium">Midrange (Mustang, Charger, RAV4):</span>
                  <span className="text-[#71717a] ml-2">Bumper $250-450 | Hood $300-500 | Headlight $200-400</span>
                </div>
                <div>
                  <span className="text-[#e4e4e7] font-medium">Luxury (BMW, Lexus, Mercedes):</span>
                  <span className="text-[#71717a] ml-2">Bumper $400-800 | Hood $500-900 | Headlight $600-2000+</span>
                </div>
              </div>
            </div>
            <p className="mt-3">Where to check real prices: eBay (used parts), PartsGeek (aftermarket), or the manufacturer's parts site (OEM). Used parts are cheapest, OEM is most expensive.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Step 4: Add Labor and Paint</h2>
            <p>Labor rates depend on your situation:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[#71717a]">
              <li><strong className="text-[#e4e4e7]">You own a shop:</strong> $0/hr — just parts cost</li>
              <li><strong className="text-[#e4e4e7]">DIY:</strong> $0/hr labor, but add your time</li>
              <li><strong className="text-[#e4e4e7]">Budget body shop:</strong> $40-60/hr</li>
              <li><strong className="text-[#e4e4e7]">Quality shop:</strong> $75-100/hr</li>
              <li><strong className="text-[#e4e4e7]">Dealer/premium:</strong> $120-150/hr</li>
            </ul>
            <p className="mt-3">Paint: budget $400-800 for economy cars, $800-1,500 for midrange, $1,500-3,000 for luxury. A full respray costs more than spot repair.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Or Just Let AI Do It</h2>
            <p>All of the above takes 30-60 minutes per car. Or you can paste the listing URL into sendit scan and get an AI damage assessment from photos, itemized repair estimate, market comps, and a flip verdict in 15 seconds. The tool adjusts estimates to your repair profile — whether you own a shop or use a budget body shop.</p>
          </section>
        </div>

        <div className="mt-12 rounded-xl border border-[#7dd3fc]/15 bg-[#7dd3fc]/[0.03] px-6 py-5 text-center">
          <p className="text-[14px] text-[#a1a1aa] mb-1">30 minutes of research → 15 seconds.</p>
          <p className="text-[12px] text-[#52525b] mb-4">AI damage assessment + repair estimate + market comps + flip verdict.</p>
          <a href="/" className="inline-block rounded-lg bg-[#7dd3fc] px-5 py-2.5 text-[13px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all">
            Try sendit scan free
          </a>
        </div>
      </article>
    </div>
  );
}
