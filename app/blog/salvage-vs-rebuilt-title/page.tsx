import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Salvage vs Rebuilt Title: What's the Difference? 2026 Guide | sendit scan",
  description: "How salvage and rebuilt titles affect resale value, insurance, and registration. State-by-state impact on flip profitability.",
  keywords: "salvage title vs rebuilt title, salvage title value, rebuilt title worth, salvage title insurance, rebuilt title resale value",
};

export default function SalvageVsRebuiltGuide() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <article>
        <time className="text-[11px] text-[#3f3f46]">May 13, 2026</time>
        <h1 className="text-3xl font-bold text-[#fafafa] mt-2 mb-4" style={{ fontFamily: "var(--font-grotesk)" }}>
          Salvage vs Rebuilt Title: What's the Difference and What's It Worth?
        </h1>

        <div className="prose-custom space-y-8 text-[14px] text-[#a1a1aa] leading-relaxed">
          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Salvage Title</h2>
            <p>A salvage title means an insurance company declared the vehicle a total loss — the repair cost exceeded a threshold (usually 60-80%) of the car's value. You can buy it but you CANNOT legally drive it until it's repaired and inspected.</p>
            <p className="mt-3"><strong className="text-[#e4e4e7]">Impact on value:</strong> -15% to -25% from clean title value depending on the car's desirability. High-demand cars (Hellcat, Supra, Wrangler) lose less. Commodity cars (Camry, Altima) lose more.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Rebuilt Title</h2>
            <p>A rebuilt title means the car WAS salvage, has been repaired, and passed a state inspection. It's legal to drive, register, and insure. This is what flippers aim for — buy salvage, fix it, get rebuilt title, sell.</p>
            <p className="mt-3"><strong className="text-[#e4e4e7]">Impact on value:</strong> -10% to -20% from clean title. Less stigma than salvage because it's been inspected and approved. Some buyers don't care at all — especially at the right price.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Non-Repairable Title</h2>
            <p>Worse than salvage. The issuing state says this car cannot be titled for road use. However — you CAN export it to another state that allows re-titling (Texas, Florida, Georgia, Alabama are common). Once rebuilt and inspected in the new state, it gets a rebuilt title.</p>
            <p className="mt-3"><strong className="text-[#e4e4e7]">Impact on value:</strong> -25% to -35% because of the extra hassle and cost of cross-state titling.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">Insurance on Rebuilt Titles</h2>
            <p>Most major insurers offer liability coverage for rebuilt title vehicles. Comprehensive and collision are harder — some companies won't cover it, others will at standard rates. Shop around: Progressive and GEICO are generally rebuilt-title friendly.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#e4e4e7] mb-3">The Flip Math</h2>
            <p>The title discount is your profit margin. Buy a car at salvage auction for 40-60% of clean value, spend 10-20% on repairs, sell at rebuilt value (80-90% of clean). The spread is your money.</p>
            <p className="mt-3">sendit scan calculates all of this automatically — title impact, repair costs, market value, and profit projection. Paste any listing and see the numbers.</p>
          </section>
        </div>

        <div className="mt-12 rounded-xl border border-[#7dd3fc]/15 bg-[#7dd3fc]/[0.03] px-6 py-5 text-center">
          <p className="text-[14px] text-[#a1a1aa] mb-4">See exactly how title status affects your profit.</p>
          <a href="/" className="inline-block rounded-lg bg-[#7dd3fc] px-5 py-2.5 text-[13px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all">
            Try sendit scan free
          </a>
        </div>
      </article>
    </div>
  );
}
