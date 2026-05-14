"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/auth";

const TIER_HINT_KEY = "sendit_tier";

function useCachedTier() {
  const { user, loading } = useAuth();
  const [tier, setTier] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TIER_HINT_KEY);
  });

  useEffect(() => {
    // Don't clear cache while auth is still loading — user is null temporarily
    if (loading) return;
    if (!user) {
      setTier(null);
      localStorage.removeItem(TIER_HINT_KEY);
      return;
    }
    const supabase = createBrowserClient();
    supabase.from("user_profiles").select("tier").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        const t = data?.tier || "free";
        setTier(t);
        localStorage.setItem(TIER_HINT_KEY, t);
      });
  }, [user, loading]);

  return tier;
}

export function NavLinks() {
  const { user, loading } = useAuth();
  const tier = useCachedTier();

  // Don't render anything until auth resolves — prevents flash
  if (loading) return null;

  const isPaid = tier === "pro" || tier === "dealer";

  if (user) {
    return (
      <>
        <a href="/" className="hover:text-[#7dd3fc] transition-colors">
          New Scan
        </a>
        <a href="/flips" className="hover:text-[#a1a1aa] transition-colors">
          My Cars
        </a>
        <a href="/analyses" className="hover:text-[#a1a1aa] transition-colors">
          History
        </a>
        {!isPaid && (
          <a href="/pricing" className="text-[#7dd3fc]/60 hover:text-[#7dd3fc] transition-colors">
            Upgrade
          </a>
        )}
      </>
    );
  }

  return (
    <>
      <a href="/pricing" className="hover:text-[#a1a1aa] transition-colors">
        Pricing
      </a>
    </>
  );
}

export function TierBadge() {
  const { user, loading } = useAuth();
  const tier = useCachedTier();

  if (loading) return null;

  if (!user || !tier || tier === "free") return null;

  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
      tier === "dealer"
        ? "bg-[#7dd3fc]/15 text-[#7dd3fc]"
        : "bg-[#7dd3fc]/10 text-[#7dd3fc]/80"
    }`}>
      {tier}
    </span>
  );
}
