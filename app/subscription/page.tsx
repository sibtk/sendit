"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

interface SubscriptionData {
  id: string;
  status: string;
  tier: "pro" | "dealer";
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  priceId: string;
}

export default function SubscriptionPage() {
  const { user, tier, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/stripe/subscription?userId=${user.id}`);
      const data = await res.json();
      setSub(data.subscription);
    } catch {
      setSub(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    fetchSubscription();
  }, [user, authLoading, router, fetchSubscription]);

  async function handleAction(action: "cancel" | "reactivate" | "upgrade") {
    if (!user) return;
    setActing(action);
    try {
      const res = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: user.id }),
      });
      if (res.ok) {
        setConfirmCancel(false);
        await fetchSubscription();
      }
    } catch {
      // silent fail — user can retry
    }
    setActing(null);
  }

  function formatDate(unix: number) {
    return new Date(unix * 1000).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-xl px-5 py-10">
        <div className="h-8 w-40 rounded-lg bg-white/[0.04] animate-pulse mb-8" />
        <div className="h-48 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-[#e4e4e7]"
          style={{ fontFamily: "var(--font-grotesk)" }}
        >
          Subscription
        </h1>
        <p className="text-sm text-[#52525b]">Manage your plan and billing</p>
      </div>

      {/* Free user */}
      {!sub && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-white/20">
            Current plan
          </div>
          <div className="text-2xl font-bold text-[#e4e4e7] mb-1">Free</div>
          <p className="text-sm text-[#52525b] mb-6">3 analyses per week</p>
          <button
            onClick={() => router.push("/pricing")}
            className="rounded-xl bg-[#7dd3fc] px-6 py-3 text-[15px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all active:scale-[0.98]"
          >
            View plans
          </button>
        </div>
      )}

      {/* Active subscriber */}
      {sub && (
        <div
          className={`rounded-2xl border p-8 ${
            sub.cancelAtPeriodEnd
              ? "border-amber-500/20 bg-amber-500/[0.03]"
              : "border-[#7dd3fc]/20 bg-[#7dd3fc]/[0.03]"
          }`}
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-white/20">
            Current plan
          </div>
          <div className="text-2xl font-bold text-[#e4e4e7] mb-1 capitalize">
            {sub.tier}
          </div>

          {sub.cancelAtPeriodEnd ? (
            <p className="text-sm text-amber-400/70 mb-6">
              Cancels on {formatDate(sub.currentPeriodEnd)} — you keep access
              until then
            </p>
          ) : (
            <p className="text-sm text-[#52525b] mb-6">
              Next payment: ${sub.tier === "dealer" ? "120" : "30"} on{" "}
              {formatDate(sub.currentPeriodEnd)}
            </p>
          )}

          <div className="flex flex-col gap-3">
            {/* Upgrade — only for Pro users, not canceling */}
            {sub.tier === "pro" && !sub.cancelAtPeriodEnd && (
              <button
                onClick={() => handleAction("upgrade")}
                disabled={acting === "upgrade"}
                className="w-full rounded-xl bg-[#7dd3fc] py-3 text-[15px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {acting === "upgrade"
                  ? "Upgrading..."
                  : "Upgrade to Dealer — $120/mo"}
              </button>
            )}

            {/* Reactivate — only when cancellation is pending */}
            {sub.cancelAtPeriodEnd && (
              <button
                onClick={() => handleAction("reactivate")}
                disabled={acting === "reactivate"}
                className="w-full rounded-xl bg-[#7dd3fc] py-3 text-[15px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {acting === "reactivate"
                  ? "Reactivating..."
                  : "Keep my subscription"}
              </button>
            )}

            {/* Cancel — only when NOT already canceling */}
            {!sub.cancelAtPeriodEnd && !confirmCancel && (
              <button
                onClick={() => setConfirmCancel(true)}
                className="w-full rounded-xl border border-white/[0.06] py-3 text-[14px] text-white/40 hover:text-red-400 hover:border-red-400/20 transition-all"
              >
                Cancel subscription
              </button>
            )}

            {/* Cancel confirmation */}
            {!sub.cancelAtPeriodEnd && confirmCancel && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/[0.04] p-4">
                <p className="text-sm text-white/50 mb-3">
                  Are you sure? You'll keep access until{" "}
                  {formatDate(sub.currentPeriodEnd)}.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction("cancel")}
                    disabled={acting === "cancel"}
                    className="flex-1 rounded-lg bg-red-500/20 py-2 text-[13px] font-medium text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50"
                  >
                    {acting === "cancel" ? "Canceling..." : "Yes, cancel"}
                  </button>
                  <button
                    onClick={() => setConfirmCancel(false)}
                    className="flex-1 rounded-lg border border-white/[0.06] py-2 text-[13px] text-white/40 hover:text-white/60 transition-all"
                  >
                    Never mind
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
