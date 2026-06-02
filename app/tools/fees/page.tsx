"use client";

import { useState, useEffect } from "react";
import { calculateAuctionFees } from "@/lib/fees";
import { Platform, AuctionFees } from "@/lib/types";

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function FeesPage() {
  const [platform, setPlatform] = useState<Platform>("iaa");
  const [bidAmount, setBidAmount] = useState("");
  const [result, setResult] = useState<AuctionFees | null>(null);

  // Auto-calculate on any input change
  useEffect(() => {
    const bid = parseFloat(bidAmount);
    if (!isNaN(bid) && bid > 0) {
      setResult(calculateAuctionFees(platform, bid));
    } else {
      setResult(null);
    }
  }, [platform, bidAmount]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-white/90 mb-1" style={{ fontFamily: "var(--font-grotesk)" }}>
          Copart & IAA Fee Calculator
        </h1>
        <p className="text-[14px] text-white/30 mb-10">
          Know your real out-the-door cost before you bid. Updated for 2026.
        </p>

        {/* Platform toggle */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6">
          {(["iaa", "copart"] as Platform[]).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`flex-1 rounded-lg py-2.5 text-[13px] font-semibold transition-all ${
                platform === p
                  ? "bg-white/[0.08] text-white/80"
                  : "text-white/25 hover:text-white/40"
              }`}
            >
              {p === "iaa" ? "IAA" : "Copart"}
            </button>
          ))}
        </div>

        {/* Bid input */}
        <div className="relative mb-8">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 mono text-2xl">$</span>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="0"
            autoFocus
            className="w-full bg-transparent border-b border-white/[0.1] pl-10 pr-4 py-4 text-4xl mono text-white/90 placeholder-white/10 focus:border-[#7dd3fc]/30 focus:outline-none transition-colors"
          />
        </div>

        {/* Results — inline, always visible when there's input */}
        <div className={`space-y-0 transition-all duration-300 ${result ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          {result && (
            <>
              {/* Fee breakdown */}
              <div className="space-y-0">
                {[
                  { label: "Buyer Premium", value: result.buyerPremium },
                  { label: "Gate Fee", value: result.gateFee },
                  { label: "Internet Bid Fee", value: result.internetBidFee },
                  { label: "Environmental", value: result.environmentalFee },
                  ...(result.titleFee > 0 ? [{ label: "Title Fee", value: result.titleFee }] : []),
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-2.5 border-b border-white/[0.04]">
                    <span className="text-[13px] text-white/30">{row.label}</span>
                    <span className="mono text-[14px] text-white/50">${fmt(row.value)}</span>
                  </div>
                ))}
              </div>

              {/* Total fees */}
              <div className="flex justify-between py-3 mt-1">
                <span className="text-[13px] text-white/50">Total Fees</span>
                <span className="mono text-[14px] font-semibold text-white/70">${fmt(result.totalFees)}</span>
              </div>

              {/* Out the door — the hero number */}
              <div className="mt-4 pt-6 border-t border-white/[0.06]">
                <div className="text-[11px] text-white/20 uppercase tracking-widest mb-2">Out the door</div>
                <div className="mono text-4xl font-bold text-[#7dd3fc]">
                  ${fmt(result.totalWithBid)}
                </div>
                <div className="mt-2 text-[11px] text-white/15">
                  {platform === "iaa" ? "IAA" : "Copart"} standard buyer fees. Verify before bidding.
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* SEO content — fee breakdowns that Google can index */}
      <div className="mt-20 space-y-12 text-[14px] text-[#a1a1aa] leading-relaxed">
        <section>
          <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">How Copart and IAA Auction Fees Work</h2>
          <p>The winning bid at a salvage auction is never your final cost. Both Copart and IAA add multiple fees on top of your bid — buyer premiums, gate fees, internet bid fees, environmental fees, and title processing fees. These fees typically add 15-25% to your winning bid, and they vary based on the platform, your bid amount, and whether you have a dealer license.</p>
          <p className="mt-3">This calculator gives you the exact out-the-door number for any bid amount on either platform, so you can set your max bid knowing your real total cost.</p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Copart Buyer Premium Tiers (2026)</h2>
          <p>Copart&apos;s buyer premium is a tiered percentage that scales with your winning bid. It&apos;s the largest fee you&apos;ll pay:</p>
          <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-4 py-2.5 text-white/40 font-medium">Winning Bid</th>
                  <th className="text-right px-4 py-2.5 text-white/40 font-medium">Premium Rate</th>
                </tr>
              </thead>
              <tbody className="mono">
                <tr className="border-b border-white/[0.04]"><td className="px-4 py-2 text-white/50">$0 - $99.99</td><td className="px-4 py-2 text-right text-white/70">18% ($2 min)</td></tr>
                <tr className="border-b border-white/[0.04]"><td className="px-4 py-2 text-white/50">$100 - $499.99</td><td className="px-4 py-2 text-right text-white/70">18%</td></tr>
                <tr className="border-b border-white/[0.04]"><td className="px-4 py-2 text-white/50">$500 - $999.99</td><td className="px-4 py-2 text-right text-white/70">14%</td></tr>
                <tr className="border-b border-white/[0.04]"><td className="px-4 py-2 text-white/50">$1,000 - $1,499.99</td><td className="px-4 py-2 text-right text-white/70">12%</td></tr>
                <tr className="border-b border-white/[0.04]"><td className="px-4 py-2 text-white/50">$1,500 - $1,999.99</td><td className="px-4 py-2 text-right text-white/70">11%</td></tr>
                <tr className="border-b border-white/[0.04]"><td className="px-4 py-2 text-white/50">$2,000 - $3,999.99</td><td className="px-4 py-2 text-right text-white/70">8.5%</td></tr>
                <tr className="border-b border-white/[0.04]"><td className="px-4 py-2 text-white/50">$4,000 - $5,999.99</td><td className="px-4 py-2 text-right text-white/70">7%</td></tr>
                <tr className="border-b border-white/[0.04]"><td className="px-4 py-2 text-white/50">$6,000 - $7,999.99</td><td className="px-4 py-2 text-right text-white/70">6%</td></tr>
                <tr><td className="px-4 py-2 text-white/50">$8,000+</td><td className="px-4 py-2 text-right text-white/70">5%</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">On top of the buyer premium, Copart charges a $79 gate fee, $169 internet bid fee, and a $10 environmental fee on every transaction.</p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">IAA Buyer Premium Tiers (2026)</h2>
          <p>IAA uses a 35-tier flat-fee schedule instead of percentages. The buyer premium is a fixed dollar amount based on bid range, which makes IAA cheaper at higher bid amounts but more expensive on low bids.</p>
          <p className="mt-3">IAA also charges a $79 gate fee, $169 internet bid fee, and a $10 environmental fee — the same as Copart. The key difference is how the buyer premium scales.</p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Copart vs IAA: Which Has Lower Fees?</h2>
          <p>For bids under $2,000, Copart and IAA are roughly the same. For bids between $2,000 and $6,000, IAA is typically cheaper because their flat-fee tiers don&apos;t scale as aggressively. Above $6,000, Copart&apos;s 5-6% premium starts to win since IAA&apos;s flat fees can exceed the percentage-based amount.</p>
          <p className="mt-3">Use the calculator above to compare both platforms for your specific bid amount. The difference can be hundreds of dollars on a single car.</p>
          <p className="mt-3">For a deeper comparison, read our full <a href="/blog/copart-vs-iaa" className="text-[#7dd3fc] hover:underline">Copart vs IAA breakdown</a>.</p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Additional Costs Beyond Auction Fees</h2>
          <p>The fees in this calculator are just the auction costs. Your real total cost also includes:</p>
          <ul className="list-disc list-inside mt-2 space-y-1.5 text-[#71717a]">
            <li><strong className="text-[#e4e4e7]">Shipping/transport</strong> — $150-$800+ depending on distance. Use our <a href="/tools/shipping" className="text-[#7dd3fc] hover:underline">shipping estimator</a>.</li>
            <li><strong className="text-[#e4e4e7]">Repair costs</strong> — varies wildly by damage. Read our <a href="/blog/how-to-estimate-repair-costs" className="text-[#7dd3fc] hover:underline">repair cost estimation guide</a>.</li>
            <li><strong className="text-[#e4e4e7]">Title and registration</strong> — $50-$500+ depending on state. Check <a href="/tools/title-laws" className="text-[#7dd3fc] hover:underline">title laws by state</a>.</li>
            <li><strong className="text-[#e4e4e7]">Rebuilt title inspection</strong> — $100-$300 in most states if you can&apos;t do it yourself.</li>
            <li><strong className="text-[#e4e4e7]">Storage fees</strong> — Copart and IAA charge $50+/day after the pickup deadline (usually 3-5 business days).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">How to Calculate Your Maximum Bid</h2>
          <p>Work backwards from the numbers. Start with what the car is worth with a rebuilt title (typically 20-30% below clean title value). Subtract your repair estimate, auction fees, shipping, title costs, and your target profit margin. What&apos;s left is your max bid.</p>
          <p className="mt-3">Or skip the spreadsheet — <a href="/" className="text-[#7dd3fc] hover:underline">paste any Copart or IAA listing into sendit scan</a> and get fees, repairs, comps, and a profit verdict in 30 seconds.</p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-[15px] font-medium text-[#e4e4e7] mb-1">How much does Copart charge in fees?</h3>
              <p className="text-[#71717a]">Copart charges a buyer premium (5-18% depending on bid amount), a $79 gate fee, a $169 internet bid fee, and a $10 environmental fee. On a $3,000 winning bid, total fees are typically around $550-600, making your out-the-door cost roughly $3,550-3,600.</p>
            </div>
            <div>
              <h3 className="text-[15px] font-medium text-[#e4e4e7] mb-1">Are IAA fees the same as Copart?</h3>
              <p className="text-[#71717a]">The gate fee ($79), internet bid fee ($169), and environmental fee ($10) are the same. The buyer premium is different — IAA uses flat-fee tiers instead of percentages, which makes them cheaper on some bid ranges and more expensive on others.</p>
            </div>
            <div>
              <h3 className="text-[15px] font-medium text-[#e4e4e7] mb-1">Do dealer buyers pay lower fees?</h3>
              <p className="text-[#71717a]">Yes. Licensed dealers get reduced buyer premiums at both Copart and IAA. Copart&apos;s dealer rate is roughly 3-4% lower across all tiers. If you buy 25+ cars per year, consider getting a dealer license to save thousands in fees annually.</p>
            </div>
            <div>
              <h3 className="text-[15px] font-medium text-[#e4e4e7] mb-1">What happens if I don&apos;t pick up my car on time?</h3>
              <p className="text-[#71717a]">Both Copart and IAA charge daily storage fees starting 3-5 business days after purchase. Rates vary by yard but typically run $50-100 per day. Some yards charge less for the first week and then increase. Always arrange transport before bidding.</p>
            </div>
          </div>
        </section>

        <div className="rounded-xl border border-[#7dd3fc]/15 bg-[#7dd3fc]/[0.03] px-6 py-5 text-center">
          <p className="text-[14px] text-[#a1a1aa] mb-3">Fees are just the start. Get the full picture on any listing.</p>
          <a href="/" className="inline-block rounded-lg bg-[#7dd3fc] px-5 py-2.5 text-[13px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all">
            Try sendit scan free
          </a>
        </div>

        <div className="text-[11px] text-[#3f3f46]">
          <p>Related: <a href="/blog/copart-fees-guide" className="hover:text-[#52525b]">Copart Fees Guide</a> · <a href="/blog/iaa-fees-guide" className="hover:text-[#52525b]">IAA Fees Guide</a> · <a href="/blog/copart-vs-iaa" className="hover:text-[#52525b]">Copart vs IAA</a> · <a href="/blog/most-profitable-cars-to-flip" className="hover:text-[#52525b]">Most Profitable Cars to Flip</a></p>
        </div>
      </div>
    </div>
  );
}
