"use client";

import { useState, useEffect } from "react";

type FlipStatus = "watching" | "bidding" | "won" | "transit" | "shop" | "listed" | "sold";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

interface Flip {
  id: string;
  status: FlipStatus;
  vehicle: string;
  platform: string;
  lotNumber: string;
  purchasePrice: number | null;
  auctionFees: number | null;
  shippingCost: number | null;
  salePrice: number | null;
  saleChannel: string | null;
  expenses: Expense[];
  createdAt: string;
  soldAt: string | null;
  notes: string;
}

const STATUS_CONFIG: Record<FlipStatus, { label: string; color: string; bg: string }> = {
  watching: { label: "Watching", color: "text-[#71717a]", bg: "bg-[#27272a]" },
  bidding: { label: "Bidding", color: "text-blue-400", bg: "bg-blue-500/15" },
  won: { label: "Won", color: "text-purple-400", bg: "bg-purple-500/15" },
  transit: { label: "In Transit", color: "text-yellow-400", bg: "bg-yellow-500/15" },
  shop: { label: "In Shop", color: "text-orange-400", bg: "bg-orange-500/15" },
  listed: { label: "Listed", color: "text-cyan-400", bg: "bg-cyan-500/15" },
  sold: { label: "Sold", color: "text-green-400", bg: "bg-green-500/15" },
};

const STATUSES: FlipStatus[] = ["watching", "bidding", "won", "transit", "shop", "listed", "sold"];

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function loadFlips(): Flip[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("sendit_flips");
  return stored ? JSON.parse(stored) : [];
}

function saveFlips(flips: Flip[]) {
  localStorage.setItem("sendit_flips", JSON.stringify(flips));
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function calcTotalCost(flip: Flip): number {
  const expenses = flip.expenses.reduce((sum, e) => sum + e.amount, 0);
  return (flip.purchasePrice || 0) + (flip.auctionFees || 0) + (flip.shippingCost || 0) + expenses;
}

function calcProfit(flip: Flip): number | null {
  if (!flip.salePrice) return null;
  return flip.salePrice - calcTotalCost(flip);
}

export default function DashboardPage() {
  const [flips, setFlips] = useState<Flip[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedFlip, setSelectedFlip] = useState<string | null>(null);
  const [newVehicle, setNewVehicle] = useState("");

  // Expense form
  const [expCategory, setExpCategory] = useState("parts");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");

  useEffect(() => { setFlips(loadFlips()); }, []);

  function addFlip() {
    if (!newVehicle.trim()) return;
    const flip: Flip = {
      id: crypto.randomUUID(),
      status: "watching",
      vehicle: newVehicle.trim(),
      platform: "",
      lotNumber: "",
      purchasePrice: null,
      auctionFees: null,
      shippingCost: null,
      salePrice: null,
      saleChannel: null,
      expenses: [],
      createdAt: new Date().toISOString(),
      soldAt: null,
      notes: "",
    };
    const updated = [flip, ...flips];
    setFlips(updated);
    saveFlips(updated);
    setNewVehicle("");
    setShowAdd(false);
    setSelectedFlip(flip.id);
  }

  function updateFlip(id: string, updates: Partial<Flip>) {
    const updated = flips.map((f) => (f.id === id ? { ...f, ...updates } : f));
    setFlips(updated);
    saveFlips(updated);
  }

  function deleteFlip(id: string) {
    const updated = flips.filter((f) => f.id !== id);
    setFlips(updated);
    saveFlips(updated);
    if (selectedFlip === id) setSelectedFlip(null);
  }

  function addExpense(flipId: string) {
    const amount = parseFloat(expAmount);
    if (!expDesc.trim() || isNaN(amount)) return;
    const flip = flips.find((f) => f.id === flipId);
    if (!flip) return;
    const expense: Expense = {
      id: crypto.randomUUID(),
      category: expCategory,
      description: expDesc.trim(),
      amount,
      date: new Date().toISOString().split("T")[0],
    };
    updateFlip(flipId, { expenses: [...flip.expenses, expense] });
    setExpDesc("");
    setExpAmount("");
  }

  function removeExpense(flipId: string, expenseId: string) {
    const flip = flips.find((f) => f.id === flipId);
    if (!flip) return;
    updateFlip(flipId, { expenses: flip.expenses.filter((e) => e.id !== expenseId) });
  }

  const activeFlips = flips.filter((f) => f.status !== "sold");
  const soldFlips = flips.filter((f) => f.status === "sold");
  const totalInvested = activeFlips.reduce((sum, f) => sum + calcTotalCost(f), 0);
  const totalProfit = soldFlips.reduce((sum, f) => sum + (calcProfit(f) || 0), 0);
  const selected = flips.find((f) => f.id === selectedFlip);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#e4e4e7]">Flip Tracker</h1>
          <p className="text-sm text-[#52525b]">Track your flips from bid to sale</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-xl bg-[#e4e4e7] px-5 py-2.5 text-sm font-semibold text-[#0a0a0b] hover:bg-white transition-all"
        >
          + Add Flip
        </button>
      </div>

      {/* Quick stats */}
      {flips.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
          <div className="card p-4">
            <div className="text-[10px] uppercase tracking-widest text-[#52525b]">Active</div>
            <div className="mono text-2xl font-bold text-[#e4e4e7]">{activeFlips.length}</div>
          </div>
          <div className="card p-4">
            <div className="text-[10px] uppercase tracking-widest text-[#52525b]">Sold</div>
            <div className="mono text-2xl font-bold text-[#e4e4e7]">{soldFlips.length}</div>
          </div>
          <div className="card p-4">
            <div className="text-[10px] uppercase tracking-widest text-[#52525b]">Invested</div>
            <div className="mono text-2xl font-bold text-[#e4e4e7]">${fmt(totalInvested)}</div>
          </div>
          <div className="card p-4">
            <div className="text-[10px] uppercase tracking-widest text-[#52525b]">Total P&L</div>
            <div className={`mono text-2xl font-bold ${totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
              {totalProfit >= 0 ? "+" : ""}${fmt(totalProfit)}
            </div>
          </div>
        </div>
      )}

      {/* Add flip modal */}
      {showAdd && (
        <div className="card-elevated p-5 mb-6">
          <h3 className="text-sm font-semibold text-[#e4e4e7] mb-3">New Flip</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newVehicle}
              onChange={(e) => setNewVehicle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFlip()}
              placeholder="e.g. 2022 Toyota GR Supra 3.0"
              className="flex-1 rounded-xl border border-[#27272a] bg-[#111113] px-4 py-3 text-sm text-[#e4e4e7] placeholder-[#3f3f46]"
              autoFocus
            />
            <button onClick={addFlip} className="rounded-xl bg-[#e4e4e7] px-5 py-3 text-sm font-semibold text-[#0a0a0b] hover:bg-white">
              Add
            </button>
            <button onClick={() => setShowAdd(false)} className="rounded-xl border border-[#27272a] px-4 py-3 text-sm text-[#52525b] hover:text-[#71717a]">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Flip list */}
        <div className="lg:w-1/2 space-y-3">
          {flips.length === 0 && !showAdd && (
            <div className="card p-12 text-center">
              <p className="text-[#3f3f46] mb-4">No flips yet</p>
              <button
                onClick={() => setShowAdd(true)}
                className="text-sm text-[#71717a] hover:text-[#a1a1aa] transition-colors"
              >
                Add your first flip →
              </button>
            </div>
          )}

          {flips.map((flip) => {
            const cost = calcTotalCost(flip);
            const profit = calcProfit(flip);
            const days = daysSince(flip.createdAt);
            const isSelected = selectedFlip === flip.id;

            return (
              <div
                key={flip.id}
                onClick={() => setSelectedFlip(isSelected ? null : flip.id)}
                className={`card p-4 cursor-pointer transition-all ${
                  isSelected ? "border-[#52525b] bg-[#1e1e21]" : "hover:border-[#3f3f46]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${STATUS_CONFIG[flip.status].color} ${STATUS_CONFIG[flip.status].bg}`}>
                      {STATUS_CONFIG[flip.status].label}
                    </span>
                    <span className="text-sm font-medium text-[#e4e4e7]">{flip.vehicle}</span>
                  </div>
                  <div className="text-right">
                    {profit !== null ? (
                      <span className={`mono text-sm font-bold ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {profit >= 0 ? "+" : ""}${fmt(profit)}
                      </span>
                    ) : cost > 0 ? (
                      <span className="mono text-sm text-[#52525b]">${fmt(cost)} in</span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-1.5 flex gap-4 text-[11px] text-[#3f3f46]">
                  <span>{days}d ago</span>
                  {flip.expenses.length > 0 && <span>{flip.expenses.length} expenses</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="lg:w-1/2 space-y-4">
            <div className="card-elevated p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#e4e4e7]">{selected.vehicle}</h2>
                <button onClick={() => deleteFlip(selected.id)} className="text-xs text-red-400/50 hover:text-red-400">
                  Delete
                </button>
              </div>

              {/* Status selector */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateFlip(selected.id, {
                      status: s,
                      ...(s === "sold" ? { soldAt: new Date().toISOString() } : {}),
                    })}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all ${
                      selected.status === s
                        ? `${STATUS_CONFIG[s].color} ${STATUS_CONFIG[s].bg} border border-current/20`
                        : "text-[#3f3f46] hover:text-[#52525b]"
                    }`}
                  >
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>

              {/* Cost fields */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#3f3f46] block mb-1">Purchase</label>
                  <input
                    type="number"
                    value={selected.purchasePrice || ""}
                    onChange={(e) => updateFlip(selected.id, { purchasePrice: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="$0"
                    className="w-full rounded-lg border border-[#27272a] bg-[#111113] px-3 py-2 text-sm mono text-[#e4e4e7] placeholder-[#27272a]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#3f3f46] block mb-1">Auction Fees</label>
                  <input
                    type="number"
                    value={selected.auctionFees || ""}
                    onChange={(e) => updateFlip(selected.id, { auctionFees: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="$0"
                    className="w-full rounded-lg border border-[#27272a] bg-[#111113] px-3 py-2 text-sm mono text-[#e4e4e7] placeholder-[#27272a]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#3f3f46] block mb-1">Shipping</label>
                  <input
                    type="number"
                    value={selected.shippingCost || ""}
                    onChange={(e) => updateFlip(selected.id, { shippingCost: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="$0"
                    className="w-full rounded-lg border border-[#27272a] bg-[#111113] px-3 py-2 text-sm mono text-[#e4e4e7] placeholder-[#27272a]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#3f3f46] block mb-1">Sale Price</label>
                  <input
                    type="number"
                    value={selected.salePrice || ""}
                    onChange={(e) => updateFlip(selected.id, { salePrice: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="$0"
                    className="w-full rounded-lg border border-[#27272a] bg-[#111113] px-3 py-2 text-sm mono text-[#e4e4e7] placeholder-[#27272a]"
                  />
                </div>
              </div>

              {/* P&L summary */}
              <div className="rounded-xl bg-[#111113] border border-[#1e1e21] p-4 mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#52525b]">Total cost</span>
                  <span className="mono text-[#d4d4d8]">${fmt(calcTotalCost(selected))}</span>
                </div>
                {selected.salePrice && (
                  <>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#52525b]">Sale price</span>
                      <span className="mono text-[#d4d4d8]">${fmt(selected.salePrice)}</span>
                    </div>
                    <div className="border-t border-[#1e1e21] my-2" />
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-[#e4e4e7]">Profit</span>
                      <span className={`mono text-lg font-bold ${(calcProfit(selected) || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {(calcProfit(selected) || 0) >= 0 ? "+" : ""}${fmt(calcProfit(selected) || 0)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Expenses */}
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#52525b] mb-3">
                Expenses ({selected.expenses.length})
              </h3>

              {selected.expenses.length > 0 && (
                <div className="space-y-1.5 mb-4">
                  {selected.expenses.map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between rounded-lg bg-[#111113] px-3 py-2 text-sm group">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#27272a] px-1.5 py-0.5 text-[10px] text-[#52525b]">{exp.category}</span>
                        <span className="text-[#a1a1aa]">{exp.description}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="mono text-[#d4d4d8]">${fmt(exp.amount)}</span>
                        <button
                          onClick={() => removeExpense(selected.id, exp.id)}
                          className="text-[#27272a] group-hover:text-red-400/50 hover:!text-red-400 text-xs transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add expense */}
              <div className="flex gap-2">
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="rounded-lg border border-[#27272a] bg-[#111113] px-2 py-2 text-xs text-[#71717a]"
                >
                  <option value="parts">Parts</option>
                  <option value="labor">Labor</option>
                  <option value="paint">Paint</option>
                  <option value="tow">Tow</option>
                  <option value="title">Title</option>
                  <option value="detailing">Detail</option>
                  <option value="storage">Storage</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="text"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Description"
                  className="flex-1 rounded-lg border border-[#27272a] bg-[#111113] px-3 py-2 text-sm text-[#e4e4e7] placeholder-[#27272a]"
                />
                <input
                  type="number"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="$"
                  className="w-20 rounded-lg border border-[#27272a] bg-[#111113] px-3 py-2 text-sm mono text-[#e4e4e7] placeholder-[#27272a]"
                />
                <button
                  onClick={() => addExpense(selected.id)}
                  disabled={!expDesc || !expAmount}
                  className="rounded-lg bg-[#27272a] px-3 py-2 text-sm text-[#a1a1aa] hover:bg-[#3f3f46] disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
