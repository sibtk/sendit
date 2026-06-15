"use client";

import { useState, useEffect } from "react";
import { UserSettings, loadSettings, saveSettings, DEFAULT_SETTINGS } from "@/lib/settings";
import { REPAIR_PROFILES, RepairProfile } from "@/lib/types";
import { useAuth } from "@/components/auth/auth-provider";

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [freeMonthsAvailable, setFreeMonthsAvailable] = useState(0);
  const [progressToNext, setProgressToNext] = useState(0);
  const [referralCopied, setReferralCopied] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/referral?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.code) setReferralCode(data.code);
        setReferralCount(data.referralCount || 0);
        setFreeMonthsAvailable(data.freeMonthsAvailable || 0);
        setProgressToNext(data.progressToNext || 0);
      })
      .catch(() => {});
  }, [user]);

  function update(patch: Partial<UserSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  }

  function handleSave() {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inputClass = "w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white/70 placeholder-white/15 transition-all hover:border-white/[0.12] focus:border-[#7dd3fc]/30 focus:outline-none";
  const labelClass = "mb-1.5 block text-[11px] font-medium text-white/30";

  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#e4e4e7]" style={{ fontFamily: "var(--font-grotesk)" }}>Settings</h1>
          <p className="text-sm text-[#52525b]">Your defaults for every analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleReset} className="text-xs text-[#3f3f46] hover:text-[#71717a] transition-colors">
            Reset
          </button>
          <button
            onClick={handleSave}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              saved
                ? "bg-[#4ade80]/20 text-[#4ade80]"
                : "bg-[#7dd3fc] text-[#0a0a0b] hover:bg-[#a5e4ff] active:scale-[0.97]"
            }`}
          >
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Location */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/20 mb-4">Location</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className={labelClass}>Zip</label>
              <input
                type="text"
                value={settings.zip}
                onChange={(e) => update({ zip: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                placeholder="77001"
                maxLength={5}
                className={`${inputClass} mono`}
              />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input
                type="text"
                value={settings.city}
                onChange={(e) => update({ city: e.target.value })}
                placeholder="Houston"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input
                type="text"
                value={settings.state}
                onChange={(e) => update({ state: e.target.value.toUpperCase().slice(0, 2) })}
                placeholder="TX"
                maxLength={2}
                className={`${inputClass} mono`}
              />
            </div>
          </div>
        </section>

        {/* Repair */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/20 mb-4">Repair</h2>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Repair Profile</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(REPAIR_PROFILES) as [RepairProfile, { label: string; laborRate: number }][]).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => update({ repairProfile: key, customLaborRate: null })}
                    className={`rounded-lg border px-3 py-2.5 text-[12px] text-left transition-all ${
                      settings.repairProfile === key
                        ? "border-[#7dd3fc]/30 bg-[#7dd3fc]/[0.06] text-[#7dd3fc]"
                        : "border-white/[0.06] text-white/40 hover:border-white/[0.12] hover:text-white/60"
                    }`}
                  >
                    <div className="font-medium">{val.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-60">
                      {val.laborRate === 0 ? "$0/hr labor" : `$${val.laborRate}/hr`}
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => update({ repairProfile: "custom" })}
                  className={`rounded-lg border px-3 py-2.5 text-[12px] text-left transition-all ${
                    settings.repairProfile === "custom"
                      ? "border-[#7dd3fc]/30 bg-[#7dd3fc]/[0.06] text-[#7dd3fc]"
                      : "border-white/[0.06] text-white/40 hover:border-white/[0.12] hover:text-white/60"
                  }`}
                >
                  <div className="font-medium">Custom rate</div>
                  <div className="text-[10px] mt-0.5 opacity-60">Set your own</div>
                </button>
              </div>
            </div>

            {settings.repairProfile === "custom" && (
              <div>
                <label className={labelClass}>Your Labor Rate ($/hr)</label>
                <input
                  type="number"
                  value={settings.customLaborRate || ""}
                  onChange={(e) => update({ customLaborRate: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="65"
                  className={`${inputClass} mono max-w-[120px]`}
                />
              </div>
            )}

            <div>
              <label className={labelClass}>Parts Preference</label>
              <div className="flex gap-2">
                {(["used", "aftermarket", "oem"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => update({ partsPreference: p })}
                    className={`rounded-lg border px-4 py-2 text-[12px] font-medium capitalize transition-all ${
                      settings.partsPreference === p
                        ? "border-[#7dd3fc]/30 bg-[#7dd3fc]/[0.06] text-[#7dd3fc]"
                        : "border-white/[0.06] text-white/40 hover:border-white/[0.12]"
                    }`}
                  >
                    {p === "oem" ? "OEM" : p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Selling */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/20 mb-4">Selling</h2>
          <div>
            <label className={labelClass}>How do you sell?</label>
            <div className="flex gap-2">
              {([
                { key: "private", label: "Private party", desc: "FB/CL — higher price, slower" },
                { key: "dealer_wholesale", label: "Wholesale", desc: "Dealer/auction — lower, faster" },
                { key: "both", label: "Both", desc: "Show both scenarios" },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => update({ sellChannel: opt.key })}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-left transition-all ${
                    settings.sellChannel === opt.key
                      ? "border-[#7dd3fc]/30 bg-[#7dd3fc]/[0.06] text-[#7dd3fc]"
                      : "border-white/[0.06] text-white/40 hover:border-white/[0.12]"
                  }`}
                >
                  <div className="text-[12px] font-medium">{opt.label}</div>
                  <div className="text-[10px] mt-0.5 opacity-50">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Business */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/20 mb-4">Business</h2>
          <div className="space-y-3">
            {([
              { key: "hasDeaelerLicense" as const, label: "I have a dealer license", desc: "Can buy/sell more than 4 cars/yr in TX" },
              { key: "iaaVolumeDiscount" as const, label: "IAA high-volume buyer", desc: "25+ units/yr — lower fees (6% vs 7.5%)" },
              { key: "canDoRebuiltInspection" as const, label: "Can do rebuilt title inspections", desc: "Skip the $150-300 third-party inspection" },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => update({ [opt.key]: !settings[opt.key] })}
                className="w-full flex items-center justify-between rounded-lg border border-white/[0.06] px-4 py-3 transition-all hover:border-white/[0.12] text-left"
              >
                <div>
                  <div className="text-[13px] text-white/60">{opt.label}</div>
                  <div className="text-[11px] text-white/20 mt-0.5">{opt.desc}</div>
                </div>
                <div className={`h-5 w-9 rounded-full transition-all flex items-center ${
                  settings[opt.key]
                    ? "bg-[#7dd3fc]/30 justify-end"
                    : "bg-white/[0.06] justify-start"
                }`}>
                  <div className={`h-4 w-4 rounded-full mx-0.5 transition-all ${
                    settings[opt.key] ? "bg-[#7dd3fc]" : "bg-white/20"
                  }`} />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Limits */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/20 mb-4">Limits</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Max investment per car</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15 mono text-sm">$</span>
                <input
                  type="number"
                  value={settings.maxInvestment || ""}
                  onChange={(e) => update({ maxInvestment: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="No limit"
                  className={`${inputClass} pl-7 mono`}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Min profit to show BUY</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15 mono text-sm">$</span>
                <input
                  type="number"
                  value={settings.minProfit || ""}
                  onChange={(e) => update({ minProfit: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="4000"
                  className={`${inputClass} pl-7 mono`}
                />
              </div>
            </div>
          </div>
        </section>
        {/* Refer Friends */}
        {user && referralCode && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/20 mb-4">Refer Friends</h2>
            <div className="rounded-lg border border-white/[0.06] px-4 py-4 space-y-4">
              <div>
                <label className={labelClass}>Your link</label>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[13px] text-[#7dd3fc]/70 mono truncate">
                    senditscan.com?ref={referralCode}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://senditscan.com?ref=${referralCode}`);
                      setReferralCopied(true);
                      setTimeout(() => setReferralCopied(false), 1500);
                    }}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[12px] text-white/40 hover:text-white/60 transition-all shrink-0"
                  >
                    {referralCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <div>
                <div className="text-[12px] text-white/40 mb-2">
                  Invite 3 friends to subscribe, get a free month. Your friends get 10% off.
                </div>
                <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#7dd3fc]/50 transition-all"
                    style={{ width: `${(progressToNext / 3) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-white/20 mt-1.5">
                  {progressToNext}/3 paid friends{referralCount > 0 ? ` · ${referralCount} total referrals` : ""}
                </div>
              </div>
              {freeMonthsAvailable > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/[0.04] px-3 py-2.5">
                  <span className="text-[13px] text-green-400">
                    {freeMonthsAvailable} free month{freeMonthsAvailable > 1 ? "s" : ""} available
                  </span>
                  <button
                    onClick={async () => {
                      if (!user) return;
                      setRedeeming(true);
                      try {
                        const res = await fetch("/api/referral", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: user.id, action: "redeem" }),
                        });
                        if (res.ok) {
                          setFreeMonthsAvailable((p) => p - 1);
                        }
                      } catch {}
                      setRedeeming(false);
                    }}
                    disabled={redeeming}
                    className="rounded-lg bg-green-500/20 px-3 py-1.5 text-[12px] font-medium text-green-400 hover:bg-green-500/30 transition-all disabled:opacity-50"
                  >
                    {redeeming ? "..." : "Redeem"}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Account */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/20 mb-4">Account</h2>
          <a
            href="/subscription"
            className="block w-full rounded-lg border border-white/[0.06] px-4 py-3 transition-all hover:border-white/[0.12] text-left"
          >
            <div className="text-[13px] text-white/60">Manage subscription</div>
            <div className="text-[11px] text-white/20 mt-0.5">View plan, billing, and upgrade options</div>
          </a>
        </section>
      </div>
    </div>
  );
}
