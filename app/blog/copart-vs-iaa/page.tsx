import { Metadata } from "next";
import { BlogSchema } from "@/components/blog-schema";

export const metadata: Metadata = {
  title: "Copart vs IAA: Which Auction Is Better for Flipping Cars? 2026 | sendit scan",
  description: "Copart vs IAA compared — fees, inventory, buyer experience, VIN visibility, ACV data, and which platform gives better flip margins. Real flipper's perspective.",
  keywords: "copart vs iaa, copart vs iaai, which auction is better, copart or iaa for flipping, salvage auction comparison 2026",
};

export default function CopartVsIAA() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <BlogSchema title="Copart vs IAA: Which Auction Is Better for Flipping Cars?" description="Copart vs IAA compared — fees, inventory, buyer experience, and which platform gives better flip margins." slug="copart-vs-iaa" datePublished="2026-05-13" />
      <article>
        <time className="text-[11px] text-[#3f3f46]">May 13, 2026</time>
        <h1 className="text-3xl font-bold text-[#fafafa] mt-2 mb-4" style={{ fontFamily: "var(--font-grotesk)" }}>
          Copart vs IAA: Which Auction Is Better for Flipping Cars?
        </h1>
        <p className="text-[15px] text-[#71717a] mb-8 leading-relaxed">
          Both platforms sell the same types of cars — insurance total losses, fleet vehicles, dealer trade-ins. But they differ in fees, data, and buyer experience. Here's what matters for flippers.
        </p>

        <div className="prose-custom space-y-8 text-[14px] text-[#a1a1aa] leading-relaxed">
          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Fees</h2>
            <p><strong className="text-[#e4e4e7]">IAA wins on cheap cars.</strong> Their graduated flat-fee system means a $1,000 car costs less in fees at IAA than Copart. On a $500 bid, IAA charges ~$125 in buyer premium vs Copart's ~$70 — but IAA's gate fee is higher ($95 vs $79).</p>
            <p className="mt-3"><strong className="text-[#e4e4e7]">At $5,000+, they're comparable.</strong> Both end up around 8-12% total fees. The difference becomes negligible on higher-value vehicles.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Data Available to Buyers</h2>
            <p><strong className="text-[#e4e4e7]">IAA gives you more data.</strong> IAA listings typically include:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[#71717a]">
              <li>ACV (Actual Cash Value) — what the insurance company valued the car at clean</li>
              <li>Estimated repair cost — the insurance company's repair estimate</li>
              <li>Seller type (insurance, dealer, private, fleet)</li>
              <li>Full VIN (when logged in)</li>
            </ul>
            <p className="mt-3"><strong className="text-[#e4e4e7]">Copart masks the VIN.</strong> Last 6 digits are hidden unless you're a licensed dealer. IAA shows the full VIN to registered buyers. This matters for VIN decode and history checks.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Inventory</h2>
            <p><strong className="text-[#e4e4e7]">Copart has more volume.</strong> ~4 million transactions/year vs IAA's ~2.5 million vehicles offered. More inventory means more selection, but also more competition from international buyers (40% of Copart sales go overseas).</p>
            <p className="mt-3">IAA tends to have more insurance total losses, while Copart has a broader mix including clean title vehicles, fleet disposals, and dealer consignments.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Photos</h2>
            <p>Both platforms provide 10-20 photos per listing. IAA's photos follow a consistent order: front-right, front-left, rear-left, rear-right, then interior and damage closeups. Copart's order varies but includes labeled damage photos.</p>
            <p className="mt-3">Photo quality varies by location — some branches use better cameras than others. Don't rely on photos alone for expensive purchases.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">The Verdict for Flippers</h2>
            <p><strong className="text-[#e4e4e7]">Use both.</strong> Serious flippers monitor both platforms. IAA gives better data (ACV + repair estimate = easier to calculate margins). Copart gives more selection. The best deal on any given car depends on who's bidding that day, not the platform.</p>
            <p className="mt-3">The smartest approach: analyze cars from both platforms, compare the numbers, bid on the ones with the best margins regardless of which auction it's on.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Analyze Both in One Place</h2>
            <p>sendit scan works with both Copart and IAA. Paste any listing URL — we handle the fees, scrape the photos, analyze the damage, pull market comps, and give you a flip verdict. Same tool, both platforms, 15 seconds.</p>
          </section>
        </div>

        <div className="mt-12 mb-8 text-[13px] text-[#52525b]">
          <p className="font-medium text-white/20 mb-2">Related guides</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <a href="/blog/copart-fees-guide" className="hover:text-[#7dd3fc] transition-colors">Copart Fees Guide</a>
            <a href="/blog/iaa-fees-guide" className="hover:text-[#7dd3fc] transition-colors">IAA Fees Guide</a>
            <a href="/blog/most-profitable-cars-to-flip" className="hover:text-[#7dd3fc] transition-colors">Most Profitable Cars to Flip</a>
            <a href="/tools/fees" className="hover:text-[#7dd3fc] transition-colors">Fee Calculator</a>
            <a href="/tools/shipping" className="hover:text-[#7dd3fc] transition-colors">Shipping Estimator</a>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-[#7dd3fc]/15 bg-[#7dd3fc]/[0.03] px-6 py-5 text-center">
          <p className="text-[14px] text-[#a1a1aa] mb-4">Works with both Copart and IAA. Paste any link.</p>
          <a href="/" className="inline-block rounded-lg bg-[#7dd3fc] px-5 py-2.5 text-[13px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all">
            Try sendit scan free
          </a>
        </div>
      </article>
    </div>
  );
}
