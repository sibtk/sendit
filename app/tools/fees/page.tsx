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
    <div className="mx-auto max-w-lg px-5 py-12">
      <h1 className="text-3xl font-bold text-white/90 mb-1" style={{ fontFamily: "var(--font-grotesk)" }}>
        Fee Calculator
      </h1>
      <p className="text-[14px] text-white/30 mb-10">
        Know your out-the-door cost before you bid.
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
  );
}
