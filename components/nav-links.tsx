"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/auth";

export function NavLinks() {
  const { user, loading } = useAuth();
  const [tier, setTier] = useState<string | null>(null);

  // Don't render anything until auth resolves — prevents flash
  if (loading) return null;

  useEffect(() => {
    if (!user) return;
    const supabase = createBrowserClient();
    supabase.from("user_profiles").select("tier").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.tier) setTier(data.tier);
      });
  }, [user]);

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
  const [tier, setTier] = useState<string | null>(null);

  if (loading) return null;

  useEffect(() => {
    if (!user) { setTier(null); return; }
    const supabase = createBrowserClient();
    supabase.from("user_profiles").select("tier").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.tier && data.tier !== "free") setTier(data.tier);
      });
  }, [user]);

  if (!user || !tier) return null;

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
