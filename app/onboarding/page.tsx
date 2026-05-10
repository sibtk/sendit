"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { createBrowserClient } from "@/lib/auth";
import { REPAIR_PROFILES, RepairProfile } from "@/lib/types";

const STEPS = ["Location", "Repair", "Selling"];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [repairProfile, setRepairProfile] = useState<RepairProfile | "custom">("budget_shop");
  const [customRate, setCustomRate] = useState("");
  const [sellChannel, setSellChannel] = useState<"private" | "dealer_wholesale" | "both">("private");

  async function handleFinish() {
    if (!user) return;
    setSaving(true);

    const supabase = createBrowserClient();
    await supabase.from("user_profiles").upsert({
      id: user.id,
      zip: zip || "77001",
      city: city || "Houston",
      state: state || "TX",
      repair_profile: repairProfile,
      custom_labor_rate: customRate ? parseInt(customRate) : null,
      sell_channel: sellChannel,
      onboarded: true,
    });

    router.push("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-52px)] items-center justify-center px-5">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`h-1 flex-1 rounded-full transition-all ${
                i <= step ? "bg-[#7dd3fc]" : "bg-white/[0.06]"
              }`} />
            </div>
          ))}
        </div>

        <h1
          className="text-2xl font-bold text-white/90 mb-1"
          style={{ fontFamily: "var(--font-grotesk)" }}
        >
          {step === 0 && "Where are you based?"}
          {step === 1 && "How do you repair?"}
          {step === 2 && "How do you sell?"}
        </h1>
        <p className="text-[14px] text-white/30 mb-8">
          {step === 0 && "We'll use this for shipping estimates and local market data."}
          {step === 1 && "This adjusts repair cost estimates to match your setup."}
          {step === 2 && "This affects the sale price range we calculate."}
        </p>

        {/* Step 0: Location */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="mb-1.5 block text-[11px] text-white/30">Zip</label>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder="77001"
                  maxLength={5}
                  autoFocus
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-3 text-sm mono text-white/70 placeholder-white/15 focus:border-[#7dd3fc]/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] text-white/30">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Houston"
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-3 text-sm text-white/70 placeholder-white/15 focus:border-[#7dd3fc]/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] text-white/30">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="TX"
                  maxLength={2}
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-3 text-sm mono text-white/70 placeholder-white/15 focus:border-[#7dd3fc]/30 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Repair */}
        {step === 1 && (
          <div className="space-y-3">
            {(Object.entries(REPAIR_PROFILES) as [RepairProfile, { label: string; laborRate: number }][]).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setRepairProfile(key)}
                className={`w-full rounded-xl border px-4 py-3.5 text-left transition-all ${
                  repairProfile === key
                    ? "border-[#7dd3fc]/30 bg-[#7dd3fc]/[0.06] text-[#7dd3fc]"
                    : "border-white/[0.06] text-white/40 hover:border-white/[0.12]"
                }`}
              >
                <div className="text-[13px] font-medium">{val.label}</div>
                <div className="text-[11px] mt-0.5 opacity-50">
                  {val.laborRate === 0 ? "$0/hr labor" : `$${val.laborRate}/hr labor`}
                </div>
              </button>
            ))}
            <button
              onClick={() => setRepairProfile("custom")}
              className={`w-full rounded-xl border px-4 py-3.5 text-left transition-all ${
                repairProfile === "custom"
                  ? "border-[#7dd3fc]/30 bg-[#7dd3fc]/[0.06] text-[#7dd3fc]"
                  : "border-white/[0.06] text-white/40 hover:border-white/[0.12]"
              }`}
            >
              <div className="text-[13px] font-medium">Custom rate</div>
              <div className="text-[11px] mt-0.5 opacity-50">Set your own $/hr</div>
            </button>
            {repairProfile === "custom" && (
              <input
                type="number"
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                placeholder="Your labor rate ($/hr)"
                className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm mono text-white/70 placeholder-white/15 focus:border-[#7dd3fc]/30 focus:outline-none"
              />
            )}
          </div>
        )}

        {/* Step 2: Selling */}
        {step === 2 && (
          <div className="space-y-3">
            {([
              { key: "private" as const, label: "Private party", desc: "Facebook Marketplace, Craigslist — higher price, takes longer" },
              { key: "dealer_wholesale" as const, label: "Wholesale to dealers", desc: "Quick sale, lower price, less hassle" },
              { key: "both" as const, label: "Both", desc: "I sell wherever I get the best deal" },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSellChannel(opt.key)}
                className={`w-full rounded-xl border px-4 py-3.5 text-left transition-all ${
                  sellChannel === opt.key
                    ? "border-[#7dd3fc]/30 bg-[#7dd3fc]/[0.06] text-[#7dd3fc]"
                    : "border-white/[0.06] text-white/40 hover:border-white/[0.12]"
                }`}
              >
                <div className="text-[13px] font-medium">{opt.label}</div>
                <div className="text-[11px] mt-0.5 opacity-50">{opt.desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-[13px] text-white/25 hover:text-white/40 transition-colors"
            >
              Back
            </button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="rounded-xl bg-[#7dd3fc] px-6 py-2.5 text-sm font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all active:scale-[0.97]"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="rounded-xl bg-[#7dd3fc] px-6 py-2.5 text-sm font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] disabled:opacity-30 transition-all active:scale-[0.97]"
            >
              {saving ? "..." : "Let's go"}
            </button>
          )}
        </div>

        {/* Skip */}
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-[12px] text-white/15 hover:text-white/30 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
