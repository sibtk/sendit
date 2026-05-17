"use client";

import { useAuth } from "@/components/auth/auth-provider";

export function NavLinks() {
  const { user, loading, tier } = useAuth();

  // Don't render anything until auth resolves — prevents flash
  if (loading) return null;

  const isPaid = tier === "pro" || tier === "dealer";

  if (user) {
    return (
      <>
        <a href="/" className="hidden sm:inline hover:text-[#7dd3fc] transition-colors">
          New Scan
        </a>
        <a href="/flips" className="hidden sm:inline hover:text-[#a1a1aa] transition-colors">
          My Cars
        </a>
        <a href="/analyses" className="hidden sm:inline hover:text-[#a1a1aa] transition-colors">
          History
        </a>
        {!isPaid && (
          <a href="/pricing" className="hidden sm:inline text-[#7dd3fc]/60 hover:text-[#7dd3fc] transition-colors">
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
  const { user, loading, tier } = useAuth();

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
