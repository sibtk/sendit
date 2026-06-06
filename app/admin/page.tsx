"use client";

import { useState, useEffect, useCallback } from "react";

type Tab = "overview" | "users" | "scans" | "affiliates" | "training";
type TrainingStatus = "all" | "pending" | "approved" | "corrected" | "trashed";

interface Affiliate {
  id: string;
  ref: string;
  name: string;
  contact: string;
  commission_pct: number;
  clicks: number;
  active: boolean;
  signups: number;
  pro: number;
  dealer: number;
  mrr: number;
  payout: number;
}

interface Stats {
  users: { total: number; free: number; pro: number; dealer: number; mrr: number };
  scans: { total: number };
  verdicts: Record<string, number>;
  platforms: Record<string, number>;
  topVehicles: { name: string; count: number }[];
  training: { pending: number; approved: number; corrected: number; trashed: number };
}

interface Analysis {
  id: string;
  platform: string;
  url: string;
  createdAt: string;
  trainingStatus: string;
  reviewNotes: string | null;
  vehicle: { year: number; make: string; model: string; mileage: number };
  photos: string[];
  verdict: string;
  damageSeverity: string;
  damageAreas: string[];
  repairEstimate: { low: number; high: number };
  profit: { low: number; high: number };
  verdictSummary: string;
  fullAnalysis: Record<string, unknown>;
  listingData: Record<string, unknown>;
}

function fmt(n: number) {
  return n?.toLocaleString("en-US") ?? "0";
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("admin_authed") === "1";
    }
    return false;
  });
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);

  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [totalAnalyses, setTotalAnalyses] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TrainingStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [correctionText, setCorrectionText] = useState("");
  const [correcting, setCorrecting] = useState(false);
  const [pendingCorrection, setPendingCorrection] = useState<Record<string, unknown> | null>(null);
  const [affiliatesList, setAffiliatesList] = useState<Affiliate[]>([]);
  const [newAffiliate, setNewAffiliate] = useState({ ref: "", name: "", contact: "", commission_pct: 20 });
  const [showAddAffiliate, setShowAddAffiliate] = useState(false);

  // Fetch stats
  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  // Fetch analyses
  const fetchAnalyses = useCallback(async () => {
    const res = await fetch(`/api/admin/analyses?page=${page}&status=${statusFilter}`);
    const data = await res.json();
    setAnalyses(data.analyses || []);
    setTotalAnalyses(data.total || 0);
    setTotalPages(data.totalPages || 1);
  }, [page, statusFilter]);

  const fetchAffiliates = useCallback(async () => {
    const res = await fetch("/api/admin/affiliates");
    const data = await res.json();
    setAffiliatesList(data.affiliates || []);
  }, []);

  useEffect(() => {
    if (tab === "training") fetchAnalyses();
    if (tab === "affiliates") fetchAffiliates();
  }, [tab, fetchAnalyses, fetchAffiliates]);

  // Training actions
  async function setTrainingStatus(id: string, status: string) {
    await fetch("/api/admin/analyses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, training_status: status }),
    });
    fetchAnalyses();
    if (stats) {
      setStats({ ...stats }); // trigger re-fetch visual
    }
  }

  async function applyCorrection(id: string) {
    if (!correctionText.trim()) return;
    setCorrecting(true);
    try {
      const res = await fetch("/api/admin/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: id, instruction: correctionText }),
      });
      const data = await res.json();
      if (data.corrected) {
        setPendingCorrection(data.corrected);
      }
    } catch {
      // silent
    }
    setCorrecting(false);
  }

  async function saveCorrection(id: string) {
    if (!pendingCorrection) return;
    await fetch("/api/admin/analyses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        training_status: "corrected",
        corrected_result: pendingCorrection,
        review_notes: correctionText,
      }),
    });
    setPendingCorrection(null);
    setCorrectionText("");
    fetchAnalyses();
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "scans", label: "Scans" },
    { key: "affiliates", label: "Affiliates" },
    { key: "training", label: "Training" },
  ];

  async function handleLogin() {
    setAuthError(false);
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      sessionStorage.setItem("admin_authed", "1");
    } else {
      setAuthError(true);
    }
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm px-5 py-32">
        <h1
          className="text-2xl font-bold text-[#e4e4e7] mb-6 text-center"
          style={{ fontFamily: "var(--font-grotesk)" }}
        >
          Admin
        </h1>
        <div className="flex gap-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Password"
            autoFocus
            className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[14px] text-white/60 placeholder-white/15 focus:border-[#7dd3fc]/30 focus:outline-none"
          />
          <button
            onClick={handleLogin}
            className="rounded-lg bg-[#7dd3fc] px-5 py-2.5 text-[14px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all"
          >
            Go
          </button>
        </div>
        {authError && (
          <p className="text-[12px] text-red-400 mt-2 text-center">Wrong password</p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1
        className="text-2xl font-bold text-[#e4e4e7] mb-1"
        style={{ fontFamily: "var(--font-grotesk)" }}
      >
        Admin
      </h1>
      <p className="text-sm text-[#52525b] mb-8">Dashboard & training data</p>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-8 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
              tab === t.key
                ? "bg-white/[0.08] text-white/80"
                : "text-white/25 hover:text-white/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && stats && (
        <div className="space-y-8">
          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "MRR", value: `$${fmt(stats.users.mrr)}`, sub: `${stats.users.pro} Pro · ${stats.users.dealer} Dealer` },
              { label: "Total Users", value: fmt(stats.users.total), sub: `${stats.users.free} free · ${stats.users.pro + stats.users.dealer} paid` },
              { label: "Total Scans", value: fmt(stats.scans.total), sub: "all time" },
              { label: "Training Data", value: fmt(stats.training.approved + stats.training.corrected), sub: `${stats.training.pending} pending review` },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
              >
                <div className="text-[11px] text-white/20 uppercase tracking-widest mb-2">
                  {m.label}
                </div>
                <div className="text-2xl font-bold text-[#e4e4e7] mono">{m.value}</div>
                <div className="text-[11px] text-white/20 mt-1">{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Verdicts + Platforms */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="text-[11px] text-white/20 uppercase tracking-widest mb-3">
                Verdicts
              </div>
              <div className="space-y-2">
                {Object.entries(stats.verdicts).map(([verdict, count]) => (
                  <div key={verdict} className="flex justify-between">
                    <span
                      className={`text-[13px] font-medium ${
                        verdict === "BUY"
                          ? "text-green-400"
                          : verdict === "PASS"
                          ? "text-red-400"
                          : "text-amber-400"
                      }`}
                    >
                      {verdict}
                    </span>
                    <span className="text-[13px] mono text-white/40">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="text-[11px] text-white/20 uppercase tracking-widest mb-3">
                Platforms
              </div>
              <div className="space-y-2">
                {Object.entries(stats.platforms).map(([platform, count]) => (
                  <div key={platform} className="flex justify-between">
                    <span className="text-[13px] text-white/60 capitalize">{platform}</span>
                    <span className="text-[13px] mono text-white/40">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="text-[11px] text-white/20 uppercase tracking-widest mb-3">
                Training Progress
              </div>
              <div className="space-y-2">
                {Object.entries(stats.training).map(([status, count]) => (
                  <div key={status} className="flex justify-between">
                    <span className="text-[13px] text-white/60 capitalize">{status}</span>
                    <span className="text-[13px] mono text-white/40">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top vehicles */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="text-[11px] text-white/20 uppercase tracking-widest mb-3">
              Most Scanned Vehicles
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {stats.topVehicles.map((v) => (
                <div
                  key={v.name}
                  className="rounded-lg border border-white/[0.04] px-3 py-2"
                >
                  <div className="text-[12px] text-white/60 truncate">{v.name}</div>
                  <div className="text-[11px] mono text-white/25">{v.count} scans</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "overview" && !stats && (
        <div className="h-48 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
      )}

      {/* Scans Tab */}
      {tab === "scans" && stats && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="text-[11px] text-white/20 uppercase tracking-widest mb-3">
              Verdict Distribution
            </div>
            <div className="flex gap-3">
              {Object.entries(stats.verdicts).map(([verdict, count]) => {
                const total = Object.values(stats.verdicts).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={verdict} className="flex-1 rounded-lg border border-white/[0.04] p-4 text-center">
                    <div className={`text-2xl font-bold mono ${
                      verdict === "BUY" ? "text-green-400" : verdict === "PASS" ? "text-red-400" : "text-amber-400"
                    }`}>
                      {pct}%
                    </div>
                    <div className="text-[12px] text-white/30 mt-1">{verdict} ({count})</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="text-[11px] text-white/20 uppercase tracking-widest mb-3">
                Platform Split
              </div>
              {Object.entries(stats.platforms).map(([platform, count]) => {
                const total = Object.values(stats.platforms).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={platform} className="flex items-center gap-3 mb-2">
                    <span className="text-[13px] text-white/60 capitalize w-16">{platform}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/[0.04]">
                      <div
                        className="h-full rounded-full bg-[#7dd3fc]/50"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[12px] mono text-white/30 w-12 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="text-[11px] text-white/20 uppercase tracking-widest mb-3">
                Top Vehicles
              </div>
              <div className="space-y-1.5">
                {stats.topVehicles.slice(0, 8).map((v, i) => (
                  <div key={v.name} className="flex justify-between text-[13px]">
                    <span className="text-white/50">
                      <span className="text-white/20 mono mr-2">{i + 1}.</span>
                      {v.name}
                    </span>
                    <span className="mono text-white/25">{v.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Affiliates Tab */}
      {tab === "affiliates" && (
        <div className="space-y-6">
          {/* Add affiliate */}
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-white/20 uppercase tracking-widest">
              Affiliates ({affiliatesList.length})
            </div>
            <button
              onClick={() => setShowAddAffiliate(!showAddAffiliate)}
              className="rounded-lg border border-[#7dd3fc]/20 bg-[#7dd3fc]/[0.06] px-3 py-1.5 text-[12px] font-medium text-[#7dd3fc] hover:bg-[#7dd3fc]/[0.12] transition-all"
            >
              {showAddAffiliate ? "Cancel" : "Add Affiliate"}
            </button>
          </div>

          {showAddAffiliate && (
            <div className="rounded-xl border border-[#7dd3fc]/20 bg-[#7dd3fc]/[0.03] p-5">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[11px] text-white/30 mb-1 block">Name</label>
                  <input
                    type="text"
                    value={newAffiliate.name}
                    onChange={(e) => setNewAffiliate({ ...newAffiliate, name: e.target.value })}
                    placeholder="V Tuned Garage"
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-white/60 placeholder-white/15 focus:border-[#7dd3fc]/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/30 mb-1 block">Ref code</label>
                  <input
                    type="text"
                    value={newAffiliate.ref}
                    onChange={(e) => setNewAffiliate({ ...newAffiliate, ref: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    placeholder="vtuned"
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-white/60 placeholder-white/15 focus:border-[#7dd3fc]/30 focus:outline-none mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/30 mb-1 block">Contact (email/phone)</label>
                  <input
                    type="text"
                    value={newAffiliate.contact}
                    onChange={(e) => setNewAffiliate({ ...newAffiliate, contact: e.target.value })}
                    placeholder="email or phone"
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-white/60 placeholder-white/15 focus:border-[#7dd3fc]/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/30 mb-1 block">Commission %</label>
                  <input
                    type="number"
                    value={newAffiliate.commission_pct}
                    onChange={(e) => setNewAffiliate({ ...newAffiliate, commission_pct: parseInt(e.target.value) || 20 })}
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-white/60 placeholder-white/15 focus:border-[#7dd3fc]/30 focus:outline-none mono"
                  />
                </div>
              </div>
              {newAffiliate.ref && (
                <div className="text-[11px] text-white/20 mb-3 mono">
                  Link: senditscan.com?ref={newAffiliate.ref}
                </div>
              )}
              <button
                onClick={async () => {
                  if (!newAffiliate.ref || !newAffiliate.name) return;
                  await fetch("/api/admin/affiliates", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newAffiliate),
                  });
                  setNewAffiliate({ ref: "", name: "", contact: "", commission_pct: 20 });
                  setShowAddAffiliate(false);
                  fetchAffiliates();
                }}
                disabled={!newAffiliate.ref || !newAffiliate.name}
                className="rounded-lg bg-[#7dd3fc] px-4 py-2 text-[13px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all disabled:opacity-30"
              >
                Create Affiliate
              </button>
            </div>
          )}

          {/* Affiliate list */}
          {affiliatesList.length > 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-5 py-2.5 text-white/30 font-medium">Affiliate</th>
                    <th className="text-right px-5 py-2.5 text-white/30 font-medium">Clicks</th>
                    <th className="text-right px-5 py-2.5 text-white/30 font-medium">Signups</th>
                    <th className="text-right px-5 py-2.5 text-white/30 font-medium">Conv %</th>
                    <th className="text-right px-5 py-2.5 text-white/30 font-medium">Paid</th>
                    <th className="text-right px-5 py-2.5 text-white/30 font-medium">MRR</th>
                    <th className="text-right px-5 py-2.5 text-white/30 font-medium">Payout</th>
                    <th className="text-right px-5 py-2.5 text-white/30 font-medium">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliatesList.map((a) => {
                    const convPct = a.clicks > 0 ? Math.round((a.signups / a.clicks) * 100) : 0;
                    return (
                      <tr key={a.id} className={`border-b border-white/[0.04] ${!a.active ? "opacity-40" : ""}`}>
                        <td className="px-5 py-3">
                          <div className="text-white/60 font-medium">{a.name}</div>
                          <div className="text-[11px] text-white/20 mono">{a.ref} · {a.commission_pct}%</div>
                        </td>
                        <td className="px-5 py-3 text-right mono text-white/40">{fmt(a.clicks)}</td>
                        <td className="px-5 py-3 text-right mono text-white/40">{a.signups}</td>
                        <td className="px-5 py-3 text-right mono text-white/40">{convPct}%</td>
                        <td className="px-5 py-3 text-right mono text-white/40">{a.pro + a.dealer}</td>
                        <td className="px-5 py-3 text-right mono text-white/60">${fmt(a.mrr)}</td>
                        <td className="px-5 py-3 text-right mono text-[#7dd3fc]">${fmt(a.payout)}/mo</td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => navigator.clipboard.writeText(`https://senditscan.com?ref=${a.ref}`)}
                            className="text-[11px] text-[#7dd3fc]/60 hover:text-[#7dd3fc] transition-colors"
                          >
                            Copy
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {affiliatesList.length > 1 && (
                  <tfoot>
                    <tr className="border-t border-white/[0.06]">
                      <td className="px-5 py-3 text-white/30 font-medium">Total</td>
                      <td className="px-5 py-3 text-right mono text-white/40">{fmt(affiliatesList.reduce((s, a) => s + a.clicks, 0))}</td>
                      <td className="px-5 py-3 text-right mono text-white/40">{affiliatesList.reduce((s, a) => s + a.signups, 0)}</td>
                      <td className="px-5 py-3 text-right mono text-white/40"></td>
                      <td className="px-5 py-3 text-right mono text-white/40">{affiliatesList.reduce((s, a) => s + a.pro + a.dealer, 0)}</td>
                      <td className="px-5 py-3 text-right mono text-white/60">${fmt(affiliatesList.reduce((s, a) => s + a.mrr, 0))}</td>
                      <td className="px-5 py-3 text-right mono text-[#7dd3fc]">${fmt(affiliatesList.reduce((s, a) => s + a.payout, 0))}/mo</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
              <div className="text-[14px] text-white/30 mb-1">No affiliates yet</div>
              <div className="text-[12px] text-white/15">Click &quot;Add Affiliate&quot; to create your first one</div>
            </div>
          )}
        </div>
      )}

      {/* Training Tab */}
      {tab === "training" && (
        <div className="space-y-6">
          {/* Filters + export */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {(["all", "pending", "approved", "corrected", "trashed"] as TrainingStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    statusFilter === s
                      ? "bg-white/[0.08] text-white/80"
                      : "text-white/25 hover:text-white/40"
                  }`}
                >
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[12px] text-white/20">{totalAnalyses} analyses</span>
              <a
                href="/api/admin/export"
                className="rounded-lg border border-[#7dd3fc]/20 bg-[#7dd3fc]/[0.06] px-3 py-1.5 text-[12px] font-medium text-[#7dd3fc] hover:bg-[#7dd3fc]/[0.12] transition-all"
              >
                Export JSONL
              </a>
            </div>
          </div>

          {/* Analysis cards */}
          <div className="space-y-3">
            {analyses.map((a) => (
              <div
                key={a.id}
                className={`rounded-xl border bg-white/[0.02] transition-all ${
                  a.trainingStatus === "approved"
                    ? "border-green-500/20"
                    : a.trainingStatus === "corrected"
                    ? "border-[#7dd3fc]/20"
                    : a.trainingStatus === "trashed"
                    ? "border-red-500/10 opacity-50"
                    : "border-white/[0.06]"
                }`}
              >
                {/* Card header */}
                <button
                  onClick={() => {
                    setExpandedId(expandedId === a.id ? null : a.id);
                    setPendingCorrection(null);
                    setCorrectionText("");
                  }}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left"
                >
                  {/* Photo thumbnail */}
                  {a.photos[0] && (
                    <img
                      src={a.photos[0]}
                      alt=""
                      className="w-16 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-white/70">
                        {a.vehicle.year} {a.vehicle.make} {a.vehicle.model}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                          a.verdict === "BUY"
                            ? "bg-green-500/20 text-green-400"
                            : a.verdict === "PASS"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {a.verdict}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          a.trainingStatus === "approved"
                            ? "bg-green-500/10 text-green-400/60"
                            : a.trainingStatus === "corrected"
                            ? "bg-[#7dd3fc]/10 text-[#7dd3fc]/60"
                            : a.trainingStatus === "trashed"
                            ? "bg-red-500/10 text-red-400/60"
                            : "bg-white/[0.04] text-white/20"
                        }`}
                      >
                        {a.trainingStatus}
                      </span>
                    </div>
                    <div className="text-[12px] text-white/25 mt-0.5">
                      {a.platform} · {a.damageSeverity} damage ·{" "}
                      repairs ${fmt(a.repairEstimate?.low || 0)}-${fmt(a.repairEstimate?.high || 0)} ·{" "}
                      profit ${fmt(a.profit?.low || 0)}-${fmt(a.profit?.high || 0)}
                    </div>
                  </div>

                  <span className="text-[11px] text-white/15">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </button>

                {/* Expanded view */}
                {expandedId === a.id && (
                  <div className="px-5 pb-5 border-t border-white/[0.04]">
                    {/* Photos */}
                    <div className="flex gap-2 mt-4 mb-4 overflow-x-auto">
                      {a.photos.map((photo, i) => (
                        <img
                          key={i}
                          src={photo}
                          alt=""
                          className="h-32 rounded-lg object-cover flex-shrink-0"
                        />
                      ))}
                    </div>

                    {/* Analysis summary */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="rounded-lg border border-white/[0.04] p-3">
                        <div className="text-[10px] text-white/20 uppercase tracking-widest mb-1">Damage</div>
                        <div className="text-[13px] text-white/60">
                          {(a.damageAreas || []).join(", ")} — {a.damageSeverity}
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/[0.04] p-3">
                        <div className="text-[10px] text-white/20 uppercase tracking-widest mb-1">Verdict</div>
                        <div className="text-[13px] text-white/60">{a.verdictSummary}</div>
                      </div>
                    </div>

                    {/* Repair estimate details */}
                    {(a.fullAnalysis as { repairEstimate?: { parts?: { name: string; type: string; costLow: number; costHigh: number }[] } })?.repairEstimate?.parts && (
                      <div className="rounded-lg border border-white/[0.04] p-3 mb-4">
                        <div className="text-[10px] text-white/20 uppercase tracking-widest mb-2">Repair Parts</div>
                        <div className="space-y-1">
                          {((a.fullAnalysis as { repairEstimate: { parts: { name: string; type: string; costLow: number; costHigh: number }[] } }).repairEstimate.parts).map((part, i) => (
                            <div key={i} className="flex justify-between text-[12px]">
                              <span className="text-white/50">{part.name} <span className="text-white/20">({part.type})</span></span>
                              <span className="mono text-white/30">${fmt(part.costLow)}-${fmt(part.costHigh)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Review notes if any */}
                    {a.reviewNotes && (
                      <div className="rounded-lg border border-[#7dd3fc]/10 bg-[#7dd3fc]/[0.03] p-3 mb-4">
                        <div className="text-[10px] text-[#7dd3fc]/40 uppercase tracking-widest mb-1">Correction Applied</div>
                        <div className="text-[12px] text-[#7dd3fc]/60">{a.reviewNotes}</div>
                      </div>
                    )}

                    {/* AI Correction input */}
                    {a.trainingStatus !== "trashed" && (
                      <div className="mb-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={expandedId === a.id ? correctionText : ""}
                            onChange={(e) => setCorrectionText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && applyCorrection(a.id)}
                            placeholder="e.g. headlights are fine, remove from repairs..."
                            className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-white/60 placeholder-white/15 focus:border-[#7dd3fc]/30 focus:outline-none"
                          />
                          <button
                            onClick={() => applyCorrection(a.id)}
                            disabled={correcting || !correctionText.trim()}
                            className="rounded-lg bg-white/[0.06] border border-white/[0.08] px-4 py-2 text-[12px] font-medium text-white/40 hover:text-white/60 transition-all disabled:opacity-30"
                          >
                            {correcting ? "..." : "Apply"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Pending correction preview */}
                    {pendingCorrection && expandedId === a.id && (
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.03] p-3 mb-4">
                        <div className="text-[10px] text-amber-400/60 uppercase tracking-widest mb-2">Correction Preview</div>
                        <pre className="text-[11px] text-white/40 overflow-x-auto max-h-96 overflow-y-auto">
                          {JSON.stringify(pendingCorrection, null, 2)}
                        </pre>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => saveCorrection(a.id)}
                            className="rounded-lg bg-green-500/20 px-3 py-1.5 text-[12px] font-medium text-green-400 hover:bg-green-500/30 transition-all"
                          >
                            Save Correction
                          </button>
                          <button
                            onClick={() => setPendingCorrection(null)}
                            className="rounded-lg border border-white/[0.06] px-3 py-1.5 text-[12px] text-white/30 hover:text-white/50 transition-all"
                          >
                            Discard
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTrainingStatus(a.id, "approved")}
                        className={`rounded-lg px-4 py-2 text-[12px] font-medium transition-all ${
                          a.trainingStatus === "approved"
                            ? "bg-green-500/20 text-green-400"
                            : "border border-white/[0.06] text-white/30 hover:text-green-400 hover:border-green-500/20"
                        }`}
                      >
                        {a.trainingStatus === "approved" ? "Approved" : "Approve"}
                      </button>
                      <button
                        onClick={() => setTrainingStatus(a.id, "trashed")}
                        className={`rounded-lg px-4 py-2 text-[12px] font-medium transition-all ${
                          a.trainingStatus === "trashed"
                            ? "bg-red-500/20 text-red-400"
                            : "border border-white/[0.06] text-white/30 hover:text-red-400 hover:border-red-500/20"
                        }`}
                      >
                        {a.trainingStatus === "trashed" ? "Trashed" : "Trash"}
                      </button>
                      {a.trainingStatus === "trashed" && (
                        <button
                          onClick={() => setTrainingStatus(a.id, "pending")}
                          className="rounded-lg border border-white/[0.06] px-4 py-2 text-[12px] text-white/30 hover:text-white/50 transition-all"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-lg border border-white/[0.06] px-3 py-1.5 text-[12px] text-white/30 hover:text-white/50 disabled:opacity-20"
              >
                Prev
              </button>
              <span className="text-[12px] text-white/20">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-white/[0.06] px-3 py-1.5 text-[12px] text-white/30 hover:text-white/50 disabled:opacity-20"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
