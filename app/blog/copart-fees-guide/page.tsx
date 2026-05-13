import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Copart Fees Explained: Complete Buyer's Guide 2026 | sendit scan",
  description: "Every Copart fee broken down — buyer premium tiers, gate fee, internet bid fee, environmental fee, title fee. Calculate your real out-the-door cost before you bid.",
  keywords: "copart fees, copart buyer premium, copart gate fee, copart internet bid fee, how much does copart charge, copart fee schedule 2026, copart buyer fees",
};

export default function CopartFeesGuide() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <article>
        <time className="text-[11px] text-[#3f3f46]">May 13, 2026</time>
        <h1 className="text-3xl font-bold text-[#fafafa] mt-2 mb-4" style={{ fontFamily: "var(--font-grotesk)" }}>
          Copart Fees Explained: Complete Buyer's Guide 2026
        </h1>
        <p className="text-[15px] text-[#71717a] mb-8 leading-relaxed">
          The winning bid is just the beginning. Copart adds multiple fees on top of your bid that can add 15-25% to your total cost. Here's every fee you'll pay and how to calculate your real out-the-door number.
        </p>

        <div className="prose-custom space-y-8 text-[14px] text-[#a1a1aa] leading-relaxed">
          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Buyer Premium (The Big One)</h2>
            <p>Copart's buyer premium is a tiered percentage of your winning bid. It's the largest fee you'll pay and it scales with the purchase price:</p>
            <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 mono text-[13px]">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-[#71717a]">$0 - $99.99</span><span className="text-[#e4e4e7]">18% ($2 minimum)</span>
                <span className="text-[#71717a]">$100 - $499.99</span><span className="text-[#e4e4e7]">18%</span>
                <span className="text-[#71717a]">$500 - $999.99</span><span className="text-[#e4e4e7]">14%</span>
                <span className="text-[#71717a]">$1,000 - $1,499.99</span><span className="text-[#e4e4e7]">12%</span>
                <span className="text-[#71717a]">$1,500 - $1,999.99</span><span className="text-[#e4e4e7]">11%</span>
                <span className="text-[#71717a]">$2,000 - $3,999.99</span><span className="text-[#e4e4e7]">9%</span>
                <span className="text-[#71717a]">$4,000 - $5,999.99</span><span className="text-[#e4e4e7]">7.5%</span>
                <span className="text-[#71717a]">$6,000 - $7,999.99</span><span className="text-[#e4e4e7]">6.5%</span>
                <span className="text-[#71717a]">$8,000+</span><span className="text-[#e4e4e7]">6%</span>
              </div>
            </div>
            <p className="mt-3">Example: On a $10,000 winning bid, the buyer premium is $600 (6%).</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Other Fees</h2>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 mono text-[13px]">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-[#71717a]">Gate/Yard Fee</span><span className="text-[#e4e4e7]">$79</span>
                <span className="text-[#71717a]">Internet Bid Fee</span><span className="text-[#e4e4e7]">$159</span>
                <span className="text-[#71717a]">Environmental Fee</span><span className="text-[#e4e4e7]">$15</span>
                <span className="text-[#71717a]">Title Retrieval</span><span className="text-[#e4e4e7]">$20</span>
              </div>
            </div>
            <p className="mt-3">These fixed fees apply to every purchase regardless of bid amount. That's $273 in flat fees on top of the buyer premium.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Real Example: $15,000 Winning Bid</h2>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 mono text-[13px]">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-[#71717a]">Winning Bid</span><span className="text-[#e4e4e7]">$15,000</span>
                <span className="text-[#71717a]">Buyer Premium (6%)</span><span className="text-[#e4e4e7]">$900</span>
                <span className="text-[#71717a]">Gate Fee</span><span className="text-[#e4e4e7]">$79</span>
                <span className="text-[#71717a]">Internet Bid Fee</span><span className="text-[#e4e4e7]">$159</span>
                <span className="text-[#71717a]">Environmental Fee</span><span className="text-[#e4e4e7]">$15</span>
                <span className="text-[#71717a]">Title Fee</span><span className="text-[#e4e4e7]">$20</span>
                <span className="text-[#71717a] font-semibold border-t border-white/[0.06] pt-2">Total Out-the-Door</span>
                <span className="text-[#7dd3fc] font-semibold border-t border-white/[0.06] pt-2">$16,173</span>
              </div>
            </div>
            <p className="mt-3">That's $1,173 in fees — about 7.8% on top of your bid. On cheaper cars (under $2,000), fees can be 20%+ of the bid price.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">What About Taxes?</h2>
            <p>Sales tax varies by state and is NOT included in Copart's fees. You'll pay sales tax when you register the vehicle. Some states charge tax on the full purchase price, others on the bid amount only. Factor in 5-10% depending on your state.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">How to Never Overpay</h2>
            <p>The mistake most buyers make: they bid based on the car's value without accounting for fees, shipping, and repairs. A car worth $20,000 clean that you bid $15,000 on sounds like a deal — until you add $1,173 in fees, $800 in shipping, and $5,000 in repairs. Now you're all-in at $21,973 on a $20,000 car.</p>
            <p className="mt-3">That's why we built sendit scan — paste any Copart or IAA listing URL and get the full breakdown instantly: fees, shipping, AI damage assessment, repair costs, and a profit projection. Know your real all-in cost before you bid.</p>
          </section>
        </div>

        <div className="mt-12 rounded-xl border border-[#7dd3fc]/15 bg-[#7dd3fc]/[0.03] px-6 py-5 text-center">
          <p className="text-[14px] text-[#a1a1aa] mb-1">Know your real cost before you bid.</p>
          <p className="text-[12px] text-[#52525b] mb-4">Paste any Copart or IAA link. Fees, repairs, and profit calculated in 15 seconds.</p>
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
