import { Metadata } from "next";
import { BlogSchema } from "@/components/blog-schema";

export const metadata: Metadata = {
  title: "IAA Fees Explained: Complete Buyer's Guide 2026 | sendit scan",
  description: "Every IAA fee broken down — 35-tier buyer premium, internet bid fee, gate fee, environmental fee. Know your real cost before bidding at IAA auctions.",
  keywords: "IAA fees, IAA buyer premium, IAAI fees, IAA gate fee, IAA internet bid fee, how much does IAA charge, IAA fee schedule 2026, IAAI buyer fees",
};

export default function IAAFeesGuide() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <BlogSchema title="IAA Fees Explained: Complete Buyer's Guide 2026" description="Every IAA fee broken down — 35-tier buyer premium, internet bid fee, gate fee, environmental fee." slug="iaa-fees-guide" datePublished="2026-03-22" />
      <article>
        <time className="text-[11px] text-[#3f3f46]">March 22, 2026</time>
        <h1 className="text-3xl font-bold text-[#fafafa] mt-2 mb-4" style={{ fontFamily: "var(--font-grotesk)" }}>
          IAA Fees Explained: Complete Buyer's Guide 2026
        </h1>
        <p className="text-[15px] text-[#71717a] mb-8 leading-relaxed">
          IAA (Insurance Auto Auctions) uses a 35-tier buyer premium system that's more complex than Copart's. Here's every fee explained so you know your true cost before bidding.
        </p>

        <div className="prose-custom space-y-8 text-[14px] text-[#a1a1aa] leading-relaxed">
          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">IAA Buyer Premium</h2>
            <p>Unlike Copart's simple percentage tiers, IAA uses a graduated flat-fee system for lower bids that transitions to percentages at higher amounts. The premium depends on your exact bid amount and can range from 10% to over 25% on low-value vehicles.</p>
            <p className="mt-3">Key ranges:</p>
            <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 mono text-[13px]">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-[#71717a]">$0 - $99</span><span className="text-[#e4e4e7]">$25 flat</span>
                <span className="text-[#71717a]">$100 - $199</span><span className="text-[#e4e4e7]">$25-50 flat</span>
                <span className="text-[#71717a]">$200 - $499</span><span className="text-[#e4e4e7]">$50-100 flat</span>
                <span className="text-[#71717a]">$500 - $999</span><span className="text-[#e4e4e7]">$125-180 flat</span>
                <span className="text-[#71717a]">$1,000 - $1,999</span><span className="text-[#e4e4e7]">$200-300 flat</span>
                <span className="text-[#71717a]">$2,000 - $4,999</span><span className="text-[#e4e4e7]">~12-15%</span>
                <span className="text-[#71717a]">$5,000 - $9,999</span><span className="text-[#e4e4e7]">~10-12%</span>
                <span className="text-[#71717a]">$10,000+</span><span className="text-[#e4e4e7]">~8-10%</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Other IAA Fees</h2>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 mono text-[13px]">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-[#71717a]">Gate/Yard Fee</span><span className="text-[#e4e4e7]">$95</span>
                <span className="text-[#71717a]">Internet Bid Fee</span><span className="text-[#e4e4e7]">Tiered ($0-159)</span>
                <span className="text-[#71717a]">Environmental Fee</span><span className="text-[#e4e4e7]">$15</span>
                <span className="text-[#71717a]">Title Fee</span><span className="text-[#e4e4e7]">$20</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">IAA vs Copart Fees: Quick Comparison</h2>
            <p>At low bid amounts (under $2,000), IAA is generally cheaper than Copart. At higher amounts ($5,000+), they're comparable. IAA's graduated system benefits budget flippers buying cheap cars.</p>
            <p className="mt-3">The biggest difference: IAA often provides an ACV (Actual Cash Value) and insurance repair estimate on listings, giving you more data to work with before bidding. Copart doesn't always show this.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Calculate Your Exact IAA Cost</h2>
            <p>Don't guess — calculate it. Use our free IAA fee calculator to see your exact out-the-door cost, or paste any IAA listing into sendit scan for a full breakdown including fees, shipping, repairs, and profit projection.</p>
          </section>
        </div>

        <div className="mt-12 mb-8 text-[13px] text-[#52525b]">
          <p className="font-medium text-white/20 mb-2">Related guides</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <a href="/blog/copart-fees-guide" className="hover:text-[#7dd3fc] transition-colors">Copart Fees Guide</a>
            <a href="/blog/copart-vs-iaa" className="hover:text-[#7dd3fc] transition-colors">Copart vs IAA</a>
            <a href="/blog/how-to-estimate-repair-costs" className="hover:text-[#7dd3fc] transition-colors">Estimating Repair Costs</a>
            <a href="/blog/most-profitable-cars-to-flip" className="hover:text-[#7dd3fc] transition-colors">Most Profitable Cars to Flip</a>
            <a href="/tools/fees" className="hover:text-[#7dd3fc] transition-colors">Fee Calculator</a>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-[#7dd3fc]/15 bg-[#7dd3fc]/[0.03] px-6 py-5 text-center">
          <p className="text-[14px] text-[#a1a1aa] mb-1">Know your real cost before you bid.</p>
          <p className="text-[12px] text-[#52525b] mb-4">Paste any IAA listing URL. Fees, repairs, and profit in 15 seconds.</p>
          <div className="flex items-center justify-center gap-3">
            <a href="/" className="rounded-lg bg-[#7dd3fc] px-5 py-2.5 text-[13px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all">
              Try sendit scan free
            </a>
            <a href="/tools/fees" className="rounded-lg border border-white/[0.08] px-5 py-2.5 text-[13px] text-white/40 hover:text-white/60 transition-all">
              Fee calculator
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}
