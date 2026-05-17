"use client";

import { ListingData, VinDecode, AuctionFees, ShippingEstimate, FullAnalysis } from "@/lib/types";

interface StreamingPreviewProps {
  stage: "connecting" | "listing" | "vin" | "comps" | "complete" | "error";
  listing: ListingData | null;
  vinDecode: VinDecode | null;
  fees: AuctionFees | null;
  shipping: ShippingEstimate | null;
  auctionComps: FullAnalysis["auctionComps"];
  retailComps: FullAnalysis["retailComps"];
}

function fmt(n: number) { return n.toLocaleString("en-US", { maximumFractionDigits: 0 }); }

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/[0.04] ${className}`} />;
}

export function StreamingPreview({ stage, listing, vinDecode, fees, shipping, auctionComps, retailComps }: StreamingPreviewProps) {
  const hasListing = listing != null;
  const vehicleTitle = hasListing
    ? `${listing.year} ${listing.make} ${listing.model}${listing.trim ? ` ${listing.trim}` : ""}`
    : "";

  return (
    <div className="mx-auto max-w-[1400px] px-3 sm:px-5 py-4 sm:py-6">
      {/* Nav bar */}
      <div className="flex items-center justify-between mb-3 sm:mb-6">
        <div className="inline-flex items-center gap-1 text-[12px] sm:text-sm text-[#52525b]">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-[11px] text-[#7dd3fc]/60">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#7dd3fc] animate-pulse" />
            {stage === "connecting" && "Connecting..."}
            {stage === "listing" && "Decoding VIN..."}
            {stage === "vin" && "Pulling comps..."}
            {stage === "comps" && "AI analyzing photos..."}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* ============ SIDEBAR — mirrors analysis-results sidebar ============ */}
        <div className="lg:sticky lg:top-16 lg:h-fit lg:w-64 lg:shrink-0">
          <div className="sticky top-12 z-40 -mx-3 sm:-mx-5 mb-3 sm:mb-6 border-b border-[#27272a] bg-[#0a0a0b]/95 px-3 sm:px-5 py-2 sm:py-4 backdrop-blur-xl overflow-hidden lg:static lg:mx-0 lg:mb-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <div className="lg:card-elevated lg:p-6">
              <div className="flex items-center gap-2 sm:gap-5 lg:flex-col lg:items-stretch lg:gap-0">
                {/* Verdict skeleton */}
                <div className="shrink-0 lg:mb-6 lg:text-center">
                  <Sk className="h-10 w-20 rounded-xl mx-auto" />
                </div>

                {/* Stats grid — same 4 cols mobile, stacked desktop */}
                <div className="grid grid-cols-4 gap-1 flex-1 min-w-0 lg:grid-cols-1 lg:gap-0">
                  {["All-in", "Sell at", "Profit", "ROI"].map((label) => (
                    <div key={label} className="min-w-0 lg:py-4 lg:border-t lg:border-[#27272a]">
                      <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-0.5 sm:mb-1">
                        {label}
                      </div>
                      <Sk className="h-5 sm:h-7 w-16 sm:w-24" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BIN / Current Bid */}
            {hasListing && (listing.buyItNow || listing.currentBid) && (
              <div className="hidden lg:flex gap-2 mt-4">
                {listing.buyItNow && (
                  <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                    <div className="text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-1">Buy It Now</div>
                    <div className="text-[15px] mono font-bold text-[#e4e4e7]">${fmt(listing.buyItNow)}</div>
                  </div>
                )}
                {listing.currentBid && (
                  <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                    <div className="text-[10px] uppercase tracking-[0.15em] text-[#52525b] mb-1">Current Bid</div>
                    <div className="text-[15px] mono font-bold text-[#e4e4e7]">${fmt(listing.currentBid)}</div>
                    <div className="text-[9px] text-[#3f3f46] mt-1">at time of scan</div>
                  </div>
                )}
              </div>
            )}
            {!hasListing && (
              <div className="hidden lg:flex gap-2 mt-4">
                <Sk className="flex-1 h-16 rounded-xl" />
                <Sk className="flex-1 h-16 rounded-xl" />
              </div>
            )}
          </div>
        </div>

        {/* ============ MAIN CONTENT — mirrors analysis-results grid ============ */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 auto-rows-min">

          {/* ---- VEHICLE CARD (full width) ---- */}
          {hasListing ? (
            <div className="xl:col-span-2 card p-7">
              <h2 className="mb-1 text-2xl font-bold tracking-tight text-[#fafafa]">
                {vehicleTitle}
              </h2>
              {listing.vin && (
                <div className="mb-3 text-[11px] mono text-[#3f3f46] select-all">{listing.vin}</div>
              )}
              {/* Specs chips */}
              <div className="mb-5 flex flex-wrap gap-2">
                {listing.engine && (
                  <span className="rounded-lg bg-[#ffffff06] border border-[#ffffff08] px-3 py-1.5 text-[13px] text-[#a1a1aa]">{listing.engine}</span>
                )}
                {(vinDecode?.hp || listing.hp) && (
                  <span className="rounded-lg bg-[#ffffff06] border border-[#ffffff08] px-3 py-1.5 text-[13px] text-[#a1a1aa]">
                    <span className="mono">{vinDecode?.hp || listing.hp}</span>hp
                  </span>
                )}
                {listing.transmission && (
                  <span className="rounded-lg bg-[#ffffff06] border border-[#ffffff08] px-3 py-1.5 text-[13px] text-[#a1a1aa]">
                    {listing.transmission.toLowerCase().includes("auto") ? "Auto" : listing.transmission.toLowerCase().includes("manual") ? "Manual" : listing.transmission.split(/\s/)[0]}
                  </span>
                )}
                {listing.mileage && (
                  <span className="rounded-lg bg-[#ffffff06] border border-[#ffffff08] px-3 py-1.5 text-[13px] text-[#a1a1aa]">
                    <span className="mono">{fmt(listing.mileage)}</span> mi
                  </span>
                )}
                {listing.titleStatus && (
                  <span className="rounded-lg bg-[#ffffff06] border border-[#ffffff08] px-3 py-1.5 text-[13px] text-[#a1a1aa]">{listing.titleStatus}</span>
                )}
                {listing.startCode && (
                  <span className="rounded-lg bg-[#ffffff06] border border-[#ffffff08] px-3 py-1.5 text-[13px] text-[#a1a1aa]">Starts: {listing.startCode}</span>
                )}
              </div>
              {/* Verdict summary skeleton */}
              <div className="border-l-2 border-[#27272a] pl-4 py-1 space-y-2">
                <Sk className="h-4 w-full" />
                <Sk className="h-4 w-3/4" />
              </div>
            </div>
          ) : (
            <div className="xl:col-span-2 card p-7">
              <Sk className="h-8 w-72 mb-2" />
              <Sk className="h-3 w-40 mb-4" />
              <div className="flex flex-wrap gap-2 mb-5">
                {[1, 2, 3, 4].map(i => <Sk key={i} className="h-8 w-20 rounded-lg" />)}
              </div>
              <div className="border-l-2 border-[#27272a] pl-4 py-1 space-y-2">
                <Sk className="h-4 w-full" />
                <Sk className="h-4 w-3/4" />
              </div>
            </div>
          )}

          {/* ---- PHOTO GRID (full width) ---- */}
          {hasListing && listing.imageUrls && listing.imageUrls.length > 0 ? (
            <div className="xl:col-span-2">
              <div className="grid gap-2.5 grid-cols-2">
                {listing.imageUrls.slice(0, 4).map((imgUrl, i) => (
                  <div key={i} className="aspect-[4/3] overflow-hidden rounded-2xl bg-[#111113] border border-[#232326]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl} alt=""
                      className="h-full w-full object-cover"
                      loading={i < 2 ? "eager" : "lazy"}
                      onError={(e) => { (e.target as HTMLElement).parentElement!.style.display = "none"; }}
                      onLoad={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (img.naturalWidth < 50) img.parentElement!.style.display = "none";
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : !hasListing ? (
            <div className="xl:col-span-2">
              <div className="grid gap-2.5 grid-cols-2">
                {[1, 2, 3, 4].map(i => <Sk key={i} className="aspect-[4/3] rounded-2xl" />)}
              </div>
            </div>
          ) : null}

          {/* ---- DAMAGE ASSESSMENT skeleton ---- */}
          <div className="card p-4 sm:p-7">
            <div className="mb-4 flex items-center gap-3">
              <h3 className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#52525b]">Damage Assessment</h3>
              <Sk className="h-5 w-16 rounded-lg" />
            </div>
            {stage === "comps" ? (
              <div className="flex items-center gap-3 py-4">
                <div className="h-4 w-4 rounded-full border-2 border-[#27272a] border-t-[#7dd3fc] animate-spin" />
                <span className="text-[13px] text-white/30">Analyzing photos...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <Sk className="h-4 w-full" />
                <Sk className="h-4 w-5/6" />
                <Sk className="h-4 w-4/6" />
                <Sk className="h-4 w-full" />
              </div>
            )}
          </div>

          {/* ---- REPAIR ESTIMATE skeleton ---- */}
          <div className="card p-4 sm:p-7">
            <div className="mb-4">
              <h3 className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#52525b]">Repair Estimate</h3>
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex justify-between items-center">
                  <Sk className="h-4 w-32" />
                  <Sk className="h-4 w-20" />
                </div>
              ))}
              <div className="border-t border-[#27272a] pt-3 mt-3 flex justify-between">
                <Sk className="h-5 w-20" />
                <Sk className="h-5 w-28" />
              </div>
            </div>
          </div>

          {/* ---- MARKET VALUE skeleton ---- */}
          <div className="card p-4 sm:p-7">
            <div className="mb-4">
              <h3 className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#52525b]">Market Value</h3>
            </div>
            <div className="space-y-3">
              <Sk className="h-4 w-full" />
              <Sk className="h-4 w-3/4" />
              <Sk className="h-10 w-full rounded-lg" />
              <Sk className="h-4 w-5/6" />
            </div>
          </div>

          {/* ---- FINANCIALS skeleton ---- */}
          <div className="card p-4 sm:p-7">
            <div className="mb-4">
              <h3 className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#52525b]">Financials</h3>
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex justify-between items-center">
                  <Sk className="h-4 w-28" />
                  <Sk className="h-4 w-20" />
                </div>
              ))}
              <div className="border-t border-[#27272a] pt-3 mt-3">
                <Sk className="h-8 w-full rounded-lg" />
              </div>
            </div>
          </div>

          {/* ---- COMPS (full width) ---- */}
          {auctionComps && auctionComps.length > 0 ? (
            <div className="xl:col-span-2 card p-4 sm:p-7">
              <h3 className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#52525b] mb-4">
                Auction Comps ({auctionComps.length})
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {auctionComps.slice(0, 6).map((comp, i) => (
                  <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[12px] text-[#a1a1aa] truncate mr-2">{comp.damage || "Similar"}</span>
                      <span className="mono text-[14px] font-bold text-[#7dd3fc] shrink-0">${fmt(comp.price)}</span>
                    </div>
                    <div className="text-[11px] text-[#3f3f46]">
                      {comp.mileage ? `${fmt(comp.mileage)} mi` : ""} {comp.location || ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (stage === "listing" || stage === "vin") ? (
            <div className="xl:col-span-2 card p-4 sm:p-7">
              <h3 className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#52525b] mb-4">Auction Comps</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => <Sk key={i} className="h-16 rounded-xl" />)}
              </div>
            </div>
          ) : null}

          {retailComps && retailComps.length > 0 ? (
            <div className="xl:col-span-2 card p-4 sm:p-7">
              <h3 className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#52525b] mb-4">
                Retail Comps ({retailComps.length})
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {retailComps.slice(0, 6).map((comp, i) => (
                  <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[12px] text-[#a1a1aa] truncate mr-2">{comp.trim || comp.model}</span>
                      <span className="mono text-[14px] font-bold text-[#4ade80] shrink-0">${fmt(comp.price)}</span>
                    </div>
                    <div className="text-[11px] text-[#3f3f46]">
                      {comp.mileage ? `${fmt(comp.mileage)} mi` : ""} {comp.sellerType || ""} {comp.source || ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
