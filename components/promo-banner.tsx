"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { useSearchParams } from "next/navigation";
import { saveRef, getRef } from "@/lib/referral";

export function PromoBanner() {
  const { tier } = useAuth();
  const searchParams = useSearchParams();
  const isPaid = tier === "pro" || tier === "dealer";
  const urlRef = searchParams.get("ref");

  if (urlRef) saveRef(urlRef);
  const ref = urlRef || getRef();

  if (isPaid) return null;

  return (
    <a
      href={ref ? `/pricing?ref=${ref}` : "/pricing"}
      className="inline-flex items-center gap-2 rounded-full border border-[#7dd3fc]/15 bg-[#7dd3fc]/[0.04] px-3.5 py-1.5 mb-4 hover:bg-[#7dd3fc]/[0.08] transition-all group"
    >
      <span className="text-[12px] text-[#7dd3fc]/70 group-hover:text-[#7dd3fc] transition-colors">
        {ref ? "Get Pro — 25% off your first month" : "Get Pro — $30/mo"}
      </span>
      <span className="text-[11px] text-[#7dd3fc]/40">→</span>
    </a>
  );
}
