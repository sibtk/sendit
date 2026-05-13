"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { createBrowserClient } from "@/lib/auth";
import { Suspense } from "react";

function PricingContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);

  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  async function handleCheckout(priceId: string) {
    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(priceId);
    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL:", data.error);
      }
    } catch (e) {
      console.error("Checkout failed:", e);
    }
    setLoading(null);
  }

  const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "";
  const dealerPriceId = process.env.NEXT_PUBLIC_STRIPE_DEALER_PRICE_ID || "";

  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      {success && (
        <div className="mb-8 rounded-xl border border-green-500/20 bg-green-500/[0.06] px-6 py-4 text-center">
          <div className="text-green-400 text-lg font-semibold mb-1">You're in.</div>
          <div className="text-green-400/60 text-sm">Your account has been upgraded. Start scanning.</div>
        </div>
      )}
      {canceled && (
        <div className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.02] px-6 py-4 text-center">
          <div className="text-[#a1a1aa] text-sm">No worries — you can upgrade anytime.</div>
        </div>
      )}

      <div className="text-center mb-12">
        <h1
          className="text-4xl font-bold text-[#fafafa] mb-3"
          style={{ fontFamily: "var(--font-grotesk)" }}
        >
          Stop guessing. Start profiting.
        </h1>
        <p className="text-[#52525b] text-lg">
          One bad buy costs more than a year of sendit scan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Pro */}
        <div className="rounded-2xl border border-[#7dd3fc]/20 bg-[#7dd3fc]/[0.03] p-8 relative">
          <div className="absolute -top-3 left-6 bg-[#7dd3fc] text-[#0a0a0b] text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
            Most Popular
          </div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#fafafa] mb-1">Pro</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold mono text-[#fafafa]">$49</span>
              <span className="text-[#52525b]">/month</span>
            </div>
          </div>

          <ul className="space-y-3 mb-8 text-[14px] text-[#a1a1aa]">
            <li className="flex items-center gap-2">
              <span className="text-[#7dd3fc]">+</span> 50 AI analyses per month
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#7dd3fc]">+</span> Photo damage assessment
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#7dd3fc]">+</span> Real auction + retail comps
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#7dd3fc]">+</span> Repair estimates with shop links
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#7dd3fc]">+</span> Bid simulator + max bid
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#7dd3fc]">+</span> My Cars tracker + P&L
            </li>
          </ul>

          <button
            onClick={() => handleCheckout(proPriceId)}
            disabled={loading === proPriceId}
            className="w-full rounded-xl bg-[#7dd3fc] py-3 text-[15px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading === proPriceId ? "..." : "Get Pro"}
          </button>
        </div>

        {/* Dealer */}
        <div className="rounded-2xl border border-[#27272a] bg-[#141414] p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#fafafa] mb-1">Dealer</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold mono text-[#fafafa]">$149</span>
              <span className="text-[#52525b]">/month</span>
            </div>
          </div>

          <ul className="space-y-3 mb-8 text-[14px] text-[#a1a1aa]">
            <li className="flex items-center gap-2">
              <span className="text-[#7dd3fc]">+</span> Unlimited analyses
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#7dd3fc]">+</span> Everything in Pro
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#7dd3fc]">+</span> Priority support
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#7dd3fc]">+</span> Fleet tracking
            </li>
          </ul>

          <button
            onClick={() => handleCheckout(dealerPriceId)}
            disabled={loading === dealerPriceId}
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] py-3 text-[15px] font-semibold text-[#fafafa] hover:bg-white/[0.08] transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading === dealerPriceId ? "..." : "Get Dealer"}
          </button>
        </div>
      </div>

      <p className="text-center text-[12px] text-[#3f3f46] mt-8">
        Cancel anytime. One avoided bad buy pays for years of sendit scan.
      </p>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}
