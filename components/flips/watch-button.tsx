"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { watchAnalysis, getFlipByAnalysisId, removeFlip } from "@/lib/flips";
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getFlipByAnalysisId(user.id, analysisId).then(setFlip);
  }, [user, analysisId]);

  async function handleWatch() {
    if (!user) {
      router.push("/login");
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
