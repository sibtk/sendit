"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { getRef } from "@/lib/referral";
import { Suspense } from "react";

function UpgradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const ref = searchParams.get("ref") || getRef();
  const pricingUrl = ref ? `/pricing?ref=${ref}` : "/pricing";
  const hasDiscount = !!ref;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      {/* Hook */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#7dd3fc]/20 bg-[#7dd3fc]/[0.05] px-4 py-1.5 mb-6">
          <span className="h-2 w-2 rounded-full bg-[#7dd3fc] animate-pulse" />
          <span className="text-[13px] text-[#7dd3fc]">You've used your free scan</span>
        </div>
        <h1
          className="text-3xl sm:text-4xl font-bold text-[#fafafa] mb-3"
          style={{ fontFamily: "var(--font-grotesk)" }}
        >
          You ran the numbers.{" "}
          <span className="text-[#7dd3fc]">Keep going.</span>
        </h1>
        <p className="text-[15px] text-[#52525b] max-w-md mx-auto">
          One bad buy at auction costs more than a year of sendit scan. Don't go back to guessing.
        </p>
      </div>

      {/* Free tier — sign up CTA (only for logged-out users) */}
      {!user && (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.03] p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-bold text-[#fafafa] mb-1">Free Account</h3>
              <p className="text-[13px] text-[#52525b]">3 scans per week. No card required.</p>
            </div>
            <button
              onClick={() => router.push("/login?mode=signup")}
              className="rounded-xl bg-green-500/20 border border-green-500/30 px-6 py-2.5 text-[14px] font-semibold text-green-400 hover:bg-green-500/30 transition-all"
            >
              Sign up free
            </button>
          </div>
        </div>
      )}

      {/* Logged-in free user — nudge to upgrade */}
      {user && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-bold text-[#fafafa] mb-1">You're on Free</h3>
              <p className="text-[13px] text-[#52525b]">You've used your 3 scans this week. Resets Monday.</p>
            </div>
          </div>
        </div>
      )}

      {/* Pro */}
      <div className="rounded-2xl border border-[#7dd3fc]/20 bg-[#7dd3fc]/[0.03] p-6 mb-4 relative">
        <div className="absolute -top-3 left-6 bg-[#7dd3fc] text-[#0a0a0b] text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
          Most Popular
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-bold text-[#fafafa] mb-1">
              Pro — {hasDiscount ? (
                <><span className="mono">$22</span><span className="text-[#52525b] text-[13px] font-normal line-through ml-1">$30</span><span className="text-[#52525b] text-[13px] font-normal"> first month</span></>
              ) : (
                <><span className="mono">$30</span><span className="text-[#52525b] text-[13px] font-normal">/mo</span></>
              )}
            </h3>
            <p className="text-[13px] text-[#52525b]">50 scans/month. Cancel anytime.</p>
          </div>
          <button
            onClick={() => router.push(pricingUrl)}
            className="rounded-xl bg-[#7dd3fc] px-6 py-2.5 text-[14px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all shrink-0"
          >
            Get Pro
          </button>
        </div>
      </div>

      {/* Dealer */}
      <div className="rounded-2xl border border-[#27272a] bg-[#141414] p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-bold text-[#fafafa] mb-1">
              Dealer — {hasDiscount ? (
                <><span className="mono">$90</span><span className="text-[#52525b] text-[13px] font-normal line-through ml-1">$120</span><span className="text-[#52525b] text-[13px] font-normal"> first month</span></>
              ) : (
                <><span className="mono">$120</span><span className="text-[#52525b] text-[13px] font-normal">/mo</span></>
              )}
            </h3>
            <p className="text-[13px] text-[#52525b]">Unlimited scans. Early access to features + priority support.</p>
          </div>
          <button
            onClick={() => router.push(pricingUrl)}
            className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-6 py-2.5 text-[14px] font-semibold text-[#fafafa] hover:bg-white/[0.08] transition-all shrink-0"
          >
            Get Dealer
          </button>
        </div>
      </div>

      {/* Social proof / math */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="mono text-2xl font-bold text-[#e4e4e7]">30s</div>
            <div className="text-[11px] text-[#3f3f46] mt-1">Per scan</div>
          </div>
          <div>
            <div className="mono text-2xl font-bold text-[#e4e4e7]">$0.60</div>
            <div className="text-[11px] text-[#3f3f46] mt-1">Per scan on Pro</div>
          </div>
          <div>
            <div className="mono text-2xl font-bold text-[#f87171]">$5K+</div>
            <div className="text-[11px] text-[#3f3f46] mt-1">Avg bad buy loss</div>
          </div>
        </div>
      </div>

      <p className="text-center text-[12px] text-[#3f3f46]">
        Cancel anytime. One avoided bad buy pays for years of sendit scan.
      </p>

      {/* Back link */}
      <div className="text-center mt-6">
        <button
          onClick={() => router.push("/")}
          className="text-[12px] text-[#3f3f46] hover:text-[#52525b] transition-colors"
        >
          Back to scanner
        </button>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradeContent />
    </Suspense>
  );
}
