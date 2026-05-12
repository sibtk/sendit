"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { getFlips, markWon, markSold, removeFlip, undoWon, undoSold, setAuctionDate } from "@/lib/flips";
import { calculateAuctionFees } from "@/lib/fees";
import { Flip, Platform } from "@/lib/types";

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function daysAgo(date: string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

function parseLocalDate(s: string): Date {
  // "2026-05-14" → treat as local noon, not UTC midnight
  if (s.length === 10) return new Date(s + "T12:00:00");
  return new Date(s);
}

function auctionCountdown(dateStr: string | null): { label: string; urgent: boolean } | null {
  if (!dateStr) return null;
  const auction = parseLocalDate(dateStr);
  const now = new Date();
  const diffMs = auction.getTime() - now.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) return { label: "Auction passed", urgent: false };
  if (diffHrs < 1) return { label: `${Math.max(0, Math.floor(diffMs / 60000))}m`, urgent: true };
  if (diffHrs < 24) return { label: `${diffHrs}h`, urgent: true };
  if (diffDays === 0) return { label: "Today", urgent: true };
  if (diffDays === 1) return { label: "Tomorrow", urgent: true };
  return { label: `${diffDays} days`, urgent: false };
}

function fmtAuctionDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = parseLocalDate(dateStr);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`;
}

function FlipCard({
  flip,
  onUpdate,
}: {
  flip: Flip;
  onUpdate: () => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [, setTick] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Live countdown — tick every 30s for watching cards
  useEffect(() => {
    if (flip.status !== "watching" || !flip.auction_date) return;
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, [flip.status, flip.auction_date]);
  const [showWonForm, setShowWonForm] = useState(false);
  const [showSoldForm, setShowSoldForm] = useState(false);
  const [purchaseInput, setPurchaseInput] = useState("");
  const [feesInput, setFeesInput] = useState("");
  const [feesAutoCalc, setFeesAutoCalc] = useState(true);
  const [shippingInput, setShippingInput] = useState(String(flip.estimated_shipping || ""));

  function onPurchaseChange(val: string) {
    setPurchaseInput(val);
    if (feesAutoCalc && val) {
      const bid = parseInt(val);
      if (bid > 0 && flip.platform) {
        const fees = calculateAuctionFees(flip.platform as Platform, bid);
        setFeesInput(String(fees.totalFees));
      }
    }
  }
  const [saleInput, setSaleInput] = useState("");
  const [repairInput, setRepairInput] = useState("");
  const [channelInput, setChannelInput] = useState("private");
  const [loading, setLoading] = useState(false);

  const vehicle = `${flip.vehicle_year || ""} ${flip.vehicle_make || ""} ${flip.vehicle_model || ""}`.trim();
  const estValue = flip.estimated_value_low && flip.estimated_value_high
    ? `$${fmt(flip.estimated_value_low)} - $${fmt(flip.estimated_value_high)}`
    : null;

  async function handleWon() {
    const price = parseInt(purchaseInput);
    if (!price || price <= 0) return;
    const fees = parseInt(feesInput) || flip.auction_fees || 0;
    const shipping = parseInt(shippingInput) || flip.estimated_shipping || 0;
    setLoading(true);
    await markWon(flip.id, price, fees, shipping);
    setShowWonForm(false);
    onUpdate();
    setLoading(false);
  }

  async function handleSold() {
    const price = parseInt(saleInput);
    if (!price || price <= 0) return;
    const repairs = parseInt(repairInput) || 0;
    setLoading(true);
    await markSold(flip.id, price, channelInput, repairs, flip);
    setShowSoldForm(false);
    onUpdate();
    setLoading(false);
  }

  async function handleRemove() {
    await removeFlip(flip.id);
    onUpdate();
  }

  const countdown = auctionCountdown(flip.auction_date);
  const compactInfo = flip.status === "won"
    ? `$${fmt((flip.purchase_price || 0) + (flip.auction_fees || 0) + (flip.shipping_cost || 0))} invested`
    : flip.status === "sold"
      ? `${(flip.actual_profit || 0) >= 0 ? "+" : ""}$${fmt(flip.actual_profit || 0)}`
      : estValue || "";

  // Compact mode — one line
  if (!expanded) {
    return (
      <div
        className="rounded-lg border border-[#27272a] bg-[#141414] hover:border-[#3f3f46] transition-all px-3 py-2 cursor-pointer flex items-center gap-3"
        onClick={() => setExpanded(true)}
      >
        <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
          flip.platform === "iaa" ? "bg-orange-500/10 text-orange-400" : "bg-blue-500/10 text-blue-400"
        }`}>
          {flip.platform === "iaa" ? "IAA" : "CPT"}
        </span>
        <span className="text-[13px] text-[#e4e4e7] truncate flex-1">{vehicle}</span>
        {countdown && (
          <span className={`text-[11px] mono font-medium shrink-0 ${countdown.urgent ? "text-orange-400" : "text-[#52525b]"}`}>
            {countdown.label}
          </span>
        )}
        {flip.status === "sold" && (
          <span className={`text-[12px] mono font-semibold shrink-0 ${(flip.actual_profit || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
            {compactInfo}
          </span>
        )}
        {flip.status === "won" && (
          <span className="text-[11px] mono text-[#52525b] shrink-0">{compactInfo}</span>
        )}
        <span className="text-[10px] text-[#3f3f46]">▾</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#27272a] bg-[#141414] hover:border-[#3f3f46] transition-all relative">
      {/* Thumbnail */}
      {flip.thumbnail_url && (
        <div
          className="h-32 bg-cover bg-center cursor-pointer rounded-t-xl"
          style={{ backgroundImage: `url(${flip.thumbnail_url})` }}
          onClick={() => flip.analysis_id && router.push(`/analysis/${flip.analysis_id}`)}
        />
      )}
      <div className="p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div
          className="cursor-pointer"
          onClick={() => flip.analysis_id && router.push(`/analysis/${flip.analysis_id}`)}
        >
          <div className="text-[14px] font-medium text-[#e4e4e7]">{vehicle || "Unknown Vehicle"}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${
              flip.platform === "iaa" ? "bg-orange-500/10 text-orange-400" : "bg-blue-500/10 text-blue-400"
            }`}>
              {flip.platform === "iaa" ? "IAA" : "Copart"}
            </span>
            <span className="text-[11px] text-[#52525b]">{daysAgo(flip.created_at)}d ago</span>
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="text-[#3f3f46] hover:text-red-400 transition-colors text-[11px]"
          title="Remove"
        >✕</button>
      </div>
      {/* Status-specific content */}
      {flip.status === "watching" && (
        <div>
          {/* Listing link + collapse */}
          <div className="flex items-center justify-between mb-2">
            {flip.listing_url ? (
              <a
                href={flip.listing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-[#52525b] hover:text-[#7dd3fc] transition-colors"
              >
                View on {flip.platform === "iaa" ? "IAA" : "Copart"} ↗
              </a>
            ) : <div />}
            <button
              onClick={() => setExpanded(false)}
              className="text-[10px] text-[#3f3f46] hover:text-[#52525b] transition-colors"
            >
              collapse
            </button>
          </div>

          {/* Auction date */}
          {flip.auction_date ? (() => {
            const countdown = auctionCountdown(flip.auction_date);
            const dateLabel = fmtAuctionDate(flip.auction_date);
            return (
              <div className="flex items-center justify-between text-[12px] mb-2 rounded-lg bg-white/[0.02] border border-white/[0.04] px-2.5 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#52525b]">{dateLabel}</span>
                  {countdown && (
                    <span className={`mono text-[11px] font-medium px-1.5 py-0.5 rounded ${
                      countdown.urgent
                        ? "bg-orange-500/10 text-orange-400"
                        : "bg-white/[0.04] text-[#71717a]"
                    }`}>
                      {countdown.label}
                    </span>
                  )}
                </div>
                <button
                  onClick={async () => { await setAuctionDate(flip.id, ""); onUpdate(); }}
                  className="text-[10px] text-[#3f3f46] hover:text-[#52525b]"
                >✕</button>
              </div>
            );
          })() : (() => {
            // Generate next 14 days as options
            const days: { label: string; value: string; sub: string }[] = [];
            const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
            const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            for (let i = 0; i < 14; i++) {
              const d = new Date();
              d.setDate(d.getDate() + i);
              const value = d.toISOString().split("T")[0];
              const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`;
              const sub = i === 0 ? "today" : i === 1 ? "1d" : `${i}d`;
              days.push({ label, value, sub });
            }
            return (
              <div className="mb-2 relative group/date">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full flex items-center justify-between rounded-lg border border-dashed border-white/[0.06] bg-transparent px-2.5 py-2 text-[11px] text-[#3f3f46] hover:border-white/[0.12] hover:text-[#52525b] transition-all"
                >
                  <span>Set auction date</span>
                  <span className="text-[10px]">▾</span>
                </button>
                {showDatePicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl border border-white/[0.08] bg-[#141416] shadow-2xl shadow-black/70 max-h-60 overflow-y-auto">
                      {days.map(day => (
                        <button
                          key={day.value}
                          onClick={async () => {
                            await setAuctionDate(flip.id, day.value);
                            setShowDatePicker(false);
                            onUpdate();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/[0.04] transition-colors border-b border-white/[0.03] last:border-0"
                        >
                          <span className="text-[12px] text-[#a1a1aa]">{day.label}</span>
                          <span className="text-[11px] mono font-semibold text-[#7dd3fc]">{day.sub}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {estValue && (
            <div className="text-[12px] text-[#52525b] mb-3">
              Est. value: <span className="mono text-[#a1a1aa]">{estValue}</span>
            </div>
          )}
          {!showWonForm ? (
            <button
              onClick={() => setShowWonForm(true)}
              className="w-full rounded-lg border border-green-500/20 bg-green-500/[0.06] py-2 text-[12px] font-medium text-green-400 hover:bg-green-500/[0.12] transition-all"
            >
              I Won This
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <span className="text-[11px] text-[#52525b] w-16 shrink-0">Purchase</span>
                <input
                  type="number"
                  placeholder="Winning bid"
                  value={purchaseInput}
                  onChange={(e) => onPurchaseChange(e.target.value)}
                  autoFocus
                  className="flex-1 rounded-lg border border-green-500/20 bg-transparent px-3 py-1.5 text-[12px] mono text-green-400 placeholder-[#52525b] focus:outline-none"
                />
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-[11px] text-[#52525b] w-16 shrink-0">Fees</span>
                <input
                  type="number"
                  placeholder={String(flip.auction_fees || 0)}
                  value={feesInput}
                  onChange={(e) => { setFeesInput(e.target.value); setFeesAutoCalc(false); }}
                  className="flex-1 rounded-lg border border-white/[0.08] bg-transparent px-3 py-1.5 text-[12px] mono text-[#a1a1aa] placeholder-[#3f3f46] focus:outline-none"
                />
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-[11px] text-[#52525b] w-16 shrink-0">Shipping</span>
                <input
                  type="number"
                  placeholder={String(flip.estimated_shipping || 0)}
                  value={shippingInput}
                  onChange={(e) => setShippingInput(e.target.value)}
                  className="flex-1 rounded-lg border border-white/[0.08] bg-transparent px-3 py-1.5 text-[12px] mono text-[#a1a1aa] placeholder-[#3f3f46] focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleWon}
                  disabled={loading || !purchaseInput}
                  className="flex-1 rounded-lg bg-green-500/20 py-2 text-[12px] font-medium text-green-400 hover:bg-green-500/30 transition-all disabled:opacity-50"
                >
                  {loading ? "..." : "Confirm Won"}
                </button>
                <button
                  onClick={() => setShowWonForm(false)}
                  className="text-[11px] text-[#52525b] hover:text-[#a1a1aa] px-2"
                >✕</button>
              </div>
            </div>
          )}
        </div>
      )}

      {flip.status === "won" && (
        <div>
          <div className="flex justify-end mb-2">
            <button onClick={() => setExpanded(false)} className="text-[10px] text-[#3f3f46] hover:text-[#52525b] transition-colors">collapse</button>
          </div>
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-[#52525b]">Purchase</span>
            <span className="mono text-[#e4e4e7]">${fmt(flip.purchase_price || 0)}</span>
          </div>
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-[#52525b]">Fees</span>
            <span className="mono text-[#a1a1aa]">${fmt(flip.auction_fees || 0)}</span>
          </div>
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-[#52525b]">Shipping</span>
            <span className="mono text-[#a1a1aa]">${fmt(flip.shipping_cost || 0)}</span>
          </div>
          <div className="flex justify-between text-[12px] mb-3 pt-1 border-t border-[#1e1e21]">
            <span className="text-[#52525b]">Invested</span>
            <span className="mono text-[#e4e4e7] font-medium">${fmt((flip.purchase_price || 0) + (flip.auction_fees || 0) + (flip.shipping_cost || 0))}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            {flip.won_at && (
              <span className="text-[11px] text-[#52525b]">
                Won {daysAgo(flip.won_at)} days ago
              </span>
            )}
            <button
              onClick={async () => { await undoWon(flip.id); onUpdate(); }}
              className="text-[10px] text-[#3f3f46] hover:text-[#a1a1aa] transition-colors"
            >
              ↩ Undo
            </button>
          </div>
          {!showSoldForm ? (
            <button
              onClick={() => setShowSoldForm(true)}
              className="w-full rounded-lg border border-[#7dd3fc]/20 bg-[#7dd3fc]/[0.06] py-2 text-[12px] font-medium text-[#7dd3fc] hover:bg-[#7dd3fc]/[0.12] transition-all"
            >
              Mark as Sold
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <span className="text-[11px] text-[#52525b] w-16 shrink-0">Sale price</span>
                <input
                  type="number"
                  placeholder="What did you sell for?"
                  value={saleInput}
                  onChange={(e) => setSaleInput(e.target.value)}
                  autoFocus
                  className="flex-1 rounded-lg border border-[#7dd3fc]/20 bg-transparent px-3 py-1.5 text-[12px] mono text-[#7dd3fc] placeholder-[#52525b] focus:outline-none"
                />
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-[11px] text-[#52525b] w-16 shrink-0">Repairs</span>
                <input
                  type="number"
                  placeholder={`Est: $${fmt(((flip.estimated_repair_low || 0) + (flip.estimated_repair_high || 0)) / 2)}`}
                  value={repairInput}
                  onChange={(e) => setRepairInput(e.target.value)}
                  className="flex-1 rounded-lg border border-white/[0.08] bg-transparent px-3 py-1.5 text-[12px] mono text-[#a1a1aa] placeholder-[#3f3f46] focus:outline-none"
                />
              </div>
              <select
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-transparent px-3 py-1.5 text-[12px] text-[#a1a1aa] focus:outline-none"
              >
                <option value="private">Private party</option>
                <option value="dealer">Dealer</option>
                <option value="auction">Auction</option>
                <option value="other">Other</option>
              </select>
              {saleInput && (() => {
                const totalCosts = (flip.purchase_price || 0) + (flip.auction_fees || 0) + (flip.shipping_cost || 0) + (parseInt(repairInput) || 0);
                const profit = parseInt(saleInput) - totalCosts;
                return (
                  <div className={`text-center text-[13px] mono font-medium ${profit > 0 ? "text-green-400" : "text-red-400"}`}>
                    {profit > 0 ? "+" : ""}${fmt(profit)} profit
                  </div>
                );
              })()}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSold}
                  disabled={loading || !saleInput}
                  className="flex-1 rounded-lg bg-[#7dd3fc]/20 py-2 text-[12px] font-medium text-[#7dd3fc] hover:bg-[#7dd3fc]/30 transition-all disabled:opacity-50"
                >
                  {loading ? "..." : "Confirm Sale"}
                </button>
                <button
                  onClick={() => setShowSoldForm(false)}
                  className="text-[11px] text-[#52525b] hover:text-[#a1a1aa] px-2"
                >✕</button>
              </div>
            </div>
          )}
        </div>
      )}

      {flip.status === "sold" && (
        <div>
          <div className="flex justify-end mb-2">
            <button onClick={() => setExpanded(false)} className="text-[10px] text-[#3f3f46] hover:text-[#52525b] transition-colors">collapse</button>
          </div>
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-[#52525b]">Sold for</span>
            <span className="mono text-[#e4e4e7]">${fmt(flip.sale_price || 0)}</span>
          </div>
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-[#52525b]">Purchase</span>
            <span className="mono text-[#a1a1aa]">-${fmt(flip.purchase_price || 0)}</span>
          </div>
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-[#52525b]">Fees</span>
            <span className="mono text-[#a1a1aa]">-${fmt(flip.auction_fees || 0)}</span>
          </div>
          {(flip.shipping_cost || 0) > 0 && (
            <div className="flex justify-between text-[12px] mb-1">
              <span className="text-[#52525b]">Shipping</span>
              <span className="mono text-[#a1a1aa]">-${fmt(flip.shipping_cost || 0)}</span>
            </div>
          )}
          {(flip.repair_cost || 0) > 0 && (
            <div className="flex justify-between text-[12px] mb-1">
              <span className="text-[#52525b]">Repairs</span>
              <span className="mono text-[#a1a1aa]">-${fmt(flip.repair_cost || 0)}</span>
            </div>
          )}
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-[#52525b]">Via</span>
            <span className="text-[#a1a1aa] capitalize">{flip.sale_channel || "—"}</span>
          </div>
          <div className={`flex justify-between text-[14px] font-bold pt-2 border-t border-[#1e1e21] mt-2 ${
            (flip.actual_profit || 0) >= 0 ? "text-green-400" : "text-red-400"
          }`}>
            <span>P&L</span>
            <span className="mono">
              {(flip.actual_profit || 0) >= 0 ? "+" : ""}${fmt(flip.actual_profit || 0)}
            </span>
          </div>
          <button
            onClick={async () => { await undoSold(flip.id); onUpdate(); }}
            className="mt-2 text-[10px] text-[#3f3f46] hover:text-[#a1a1aa] transition-colors"
          >
            ↩ Undo sale
          </button>
        </div>
      )}
      </div>
    </div>
  );
}

export default function FlipsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [flips, setFlips] = useState<Flip[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapseWatching, setCollapseWatching] = useState(false);
  const [collapseBought, setCollapseBought] = useState(false);
  const [collapseSold, setCollapseSold] = useState(false);
  const [showExpired, setShowExpired] = useState(false);

  async function loadFlips() {
    if (!user) return;
    const data = await getFlips(user.id);
    setFlips(data);
    setLoading(false);
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    loadFlips();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-20 text-center">
        <div className="text-[#52525b] text-sm">Loading...</div>
      </div>
    );
  }

  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  const isExpired = (f: Flip) =>
    f.auction_date && (Date.now() - parseLocalDate(f.auction_date).getTime() > THREE_DAYS);

  const allWatching = flips.filter(f => f.status === "watching")
    .sort((a, b) => {
      if (!a.auction_date && !b.auction_date) return 0;
      if (!a.auction_date) return 1;
      if (!b.auction_date) return -1;
      return parseLocalDate(a.auction_date).getTime() - parseLocalDate(b.auction_date).getTime();
    });
  const watching = allWatching.filter(f => !isExpired(f));
  const expired = allWatching.filter(f => isExpired(f));
  const won = flips.filter(f => f.status === "won");
  const sold = flips.filter(f => f.status === "sold")
    .sort((a, b) => new Date(b.sold_at || 0).getTime() - new Date(a.sold_at || 0).getTime());

  const totalInvested = won.reduce((s, f) => s + (f.purchase_price || 0) + (f.auction_fees || 0) + (f.shipping_cost || 0), 0);
  const totalProfit = sold.reduce((s, f) => s + (f.actual_profit || 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="text-2xl font-bold text-[#fafafa] mb-6" style={{ fontFamily: "var(--font-grotesk)" }}>
        My Cars
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="rounded-xl border border-[#27272a] bg-[#141414] p-4">
          <div className="text-[11px] uppercase tracking-wider text-[#52525b] mb-1">Watching</div>
          <div className="text-xl font-bold mono text-[#e4e4e7]">{watching.length}</div>
        </div>
        <div className="rounded-xl border border-[#27272a] bg-[#141414] p-4">
          <div className="text-[11px] uppercase tracking-wider text-[#52525b] mb-1">Active</div>
          <div className="text-xl font-bold mono text-[#e4e4e7]">{won.length}</div>
        </div>
        <div className="rounded-xl border border-[#27272a] bg-[#141414] p-4">
          <div className="text-[11px] uppercase tracking-wider text-[#52525b] mb-1">Invested</div>
          <div className="text-xl font-bold mono text-[#e4e4e7]">${fmt(totalInvested)}</div>
        </div>
        <div className="rounded-xl border border-[#27272a] bg-[#141414] p-4">
          <div className="text-[11px] uppercase tracking-wider text-[#52525b] mb-1">Total P&L</div>
          <div className={`text-xl font-bold mono ${totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
            {totalProfit >= 0 ? "+" : ""}${fmt(totalProfit)}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {flips.length === 0 && (
        <div className="text-center py-20">
          <div className="text-[#3f3f46] text-sm mb-4">No flips yet</div>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg bg-[#7dd3fc] px-4 py-2 text-sm font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all"
          >
            Analyze a car
          </button>
        </div>
      )}

      {/* 3-column layout: Watching | Bought | Sold */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Watching */}
        <div>
          <button
            onClick={() => setCollapseWatching(!collapseWatching)}
            className="flex items-center justify-between w-full mb-3 group"
          >
            <h2 className="text-[13px] uppercase tracking-wider text-[#52525b] font-medium">
              Watching <span className="mono text-[#7dd3fc]">{watching.length}</span>
            </h2>
            <span className={`text-[10px] text-[#3f3f46] group-hover:text-[#52525b] transition-all ${collapseWatching ? "" : "rotate-180"}`}>▾</span>
          </button>
          {!collapseWatching && (
            <div className="space-y-3">
              {watching.map(f => (
                <FlipCard key={f.id} flip={f} onUpdate={loadFlips} />
              ))}
              {watching.length === 0 && expired.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#27272a] py-8 text-center text-[12px] text-[#3f3f46]">
                  Analyze a car and hit Watch
                </div>
              )}
              {/* Expired section */}
              {expired.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowExpired(!showExpired)}
                    className="flex items-center gap-2 text-[11px] text-[#3f3f46] hover:text-[#52525b] transition-colors mb-2"
                  >
                    <span>{showExpired ? "Hide" : "Show"} expired ({expired.length})</span>
                  </button>
                  {showExpired && (
                    <div className="space-y-3 opacity-50">
                      {expired.map(f => (
                        <FlipCard key={f.id} flip={f} onUpdate={loadFlips} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bought */}
        <div>
          <button
            onClick={() => setCollapseBought(!collapseBought)}
            className="flex items-center justify-between w-full mb-3 group"
          >
            <h2 className="text-[13px] uppercase tracking-wider text-[#52525b] font-medium">
              Bought <span className="mono text-[#7dd3fc]">{won.length}</span>
            </h2>
            <span className={`text-[10px] text-[#3f3f46] group-hover:text-[#52525b] transition-all ${collapseBought ? "" : "rotate-180"}`}>▾</span>
          </button>
          {!collapseBought && (
            <div className="space-y-3">
              {won.map(f => (
                <FlipCard key={f.id} flip={f} onUpdate={loadFlips} />
              ))}
              {won.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#27272a] py-8 text-center text-[12px] text-[#3f3f46]">
                  No active flips
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sold */}
        <div>
          <button
            onClick={() => setCollapseSold(!collapseSold)}
            className="flex items-center justify-between w-full mb-3 group"
          >
            <h2 className="text-[13px] uppercase tracking-wider text-[#52525b] font-medium">
              Sold <span className="mono text-[#7dd3fc]">{sold.length}</span>
            </h2>
            <span className={`text-[10px] text-[#3f3f46] group-hover:text-[#52525b] transition-all ${collapseSold ? "" : "rotate-180"}`}>▾</span>
          </button>
          {!collapseSold && (
            <div className="space-y-3">
              {sold.map(f => (
                <FlipCard key={f.id} flip={f} onUpdate={loadFlips} />
              ))}
              {sold.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#27272a] py-8 text-center text-[12px] text-[#3f3f46]">
                  No sales yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
