import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Salvage Auction Guides & Tips | sendit scan Blog",
  description: "Expert guides on flipping cars from Copart and IAA auctions. Fee breakdowns, repair cost tips, title guides, and profit strategies.",
};

const posts = [
  {
    slug: "copart-fees-guide",
    title: "Copart Fees Explained: Complete Buyer's Guide 2026",
    excerpt: "Every fee Copart charges — buyer premium, gate fee, internet bid fee, environmental fee, title fee. Know your real cost before you bid.",
    date: "May 13, 2026",
  },
  {
    slug: "iaa-fees-guide",
    title: "IAA Fees Explained: Complete Buyer's Guide 2026",
    excerpt: "IAA's 35-tier buyer premium, internet bid fees, gate fees, and how they differ from Copart. Calculate your total before auction day.",
    date: "May 13, 2026",
  },
  {
    slug: "salvage-vs-rebuilt-title",
    title: "Salvage vs Rebuilt Title: What's the Difference and What's It Worth?",
    excerpt: "How salvage and rebuilt titles affect resale value, insurance, and registration. State-by-state guide for flippers.",
    date: "May 13, 2026",
  },
  {
    slug: "how-to-estimate-repair-costs",
    title: "How to Estimate Repair Costs on a Salvage Car Before You Bid",
    excerpt: "The #1 mistake auction buyers make is underestimating repairs. Here's how to get it right using photos, comps, and AI.",
    date: "May 13, 2026",
  },
  {
    slug: "state-title-laws-guide",
    title: "Salvage Title Laws by State: Complete Flipper's Guide 2026",
    excerpt: "Every state's salvage and rebuilt title laws — inspection costs, fees, age exemptions, flipper-friendly ratings. The definitive reference.",
    date: "May 13, 2026",
  },
  {
    slug: "copart-vs-iaa",
    title: "Copart vs IAA: Which Auction Is Better for Flipping Cars?",
    excerpt: "Fees, inventory, buyer experience, and which platform gives you better margins. Real comparison from a flipper's perspective.",
    date: "May 13, 2026",
  },
  {
    slug: "most-profitable-cars-to-flip",
    title: "Most Profitable Cars to Flip from Copart & IAA in 2026",
    excerpt: "Which makes and models have the best flip margins? Data-driven breakdown of what's actually making money at auction.",
    date: "May 13, 2026",
  },
];

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-3xl font-bold text-[#fafafa] mb-2" style={{ fontFamily: "var(--font-grotesk)" }}>
        Blog
      </h1>
      <p className="text-[#52525b] text-[15px] mb-10">Guides, tips, and data for salvage auction car flippers.</p>

      <div className="space-y-8">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
            <article className="border-b border-white/[0.04] pb-8">
              <time className="text-[11px] text-[#3f3f46]">{post.date}</time>
              <h2 className="text-[18px] font-semibold text-[#e4e4e7] mt-1 mb-2 group-hover:text-[#7dd3fc] transition-colors">
                {post.title}
              </h2>
              <p className="text-[14px] text-[#71717a] leading-relaxed">{post.excerpt}</p>
            </article>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-[#7dd3fc]/15 bg-[#7dd3fc]/[0.03] px-6 py-5 text-center">
        <p className="text-[14px] text-[#a1a1aa] mb-3">Skip the research. Get the verdict in 15 seconds.</p>
        <a href="/" className="inline-block rounded-lg bg-[#7dd3fc] px-5 py-2.5 text-[13px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all">
          Try sendit scan free
        </a>
      </div>
    </div>
  );
}
