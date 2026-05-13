"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { watchAnalysis, getFlipByAnalysisId, removeFlip } from "@/lib/flips";
import { createBrowserClient } from "@/lib/auth";
import { FullAnalysis, Flip } from "@/lib/types";

export default function WatchButton({
  analysisId,
  analysis,
}: {
  analysisId: string;
  analysis: FullAnalysis;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [flip, setFlip] = useState<Flip | null>(null);
  const [tier, setTier] = useState<string>("free");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getFlipByAnalysisId(user.id, analysisId).then(setFlip);
    const supabase = createBrowserClient();
    supabase.from("user_profiles").select("tier").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.tier) setTier(data.tier); });
  }, [user, analysisId]);

  const isPaid = tier === "pro" || tier === "dealer";

  async function handleWatch() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!isPaid) {
      router.push("/pricing");
      return;
    }
    setLoading(true);
    if (flip) {
      await removeFlip(flip.id);
      setFlip(null);
    } else {
      const newFlip = await watchAnalysis(user.id, analysis);
      setFlip(newFlip);
    }
    setLoading(false);
  }

  // Already watching
  if (flip) {
    return (
      <button
        onClick={handleWatch}
        disabled={loading}
        className="rounded-lg border border-[#7dd3fc]/20 bg-[#7dd3fc]/[0.06] px-3 py-1.5 text-xs font-medium text-[#7dd3fc] hover:bg-[#7dd3fc]/[0.12] transition-all disabled:opacity-50"
      >
        Watching
      </button>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-[#a1a1aa] hover:border-[#7dd3fc]/20 hover:text-[#7dd3fc] transition-all"
      >
        Watch
      </button>
    );
  }

  // Free user — nudge to upgrade
  if (!isPaid) {
    return (
      <button
        onClick={() => router.push("/pricing")}
        className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-[#a1a1aa] hover:border-[#7dd3fc]/20 hover:text-[#7dd3fc] transition-all group relative"
      >
        Watch
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#141416] border border-white/[0.08] px-2 py-1 text-[10px] text-[#7dd3fc] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Upgrade to watch cars
        </span>
      </button>
    );
  }

  // Paid user — normal watch
  return (
    <button
      onClick={handleWatch}
      disabled={loading}
      className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-[#a1a1aa] hover:border-[#7dd3fc]/20 hover:text-[#7dd3fc] transition-all disabled:opacity-50"
    >
      {loading ? "..." : "Watch"}
    </button>
  );
}
