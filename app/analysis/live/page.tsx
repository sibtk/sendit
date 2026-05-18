"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FullAnalysis, ListingData, VinDecode, AuctionFees, ShippingEstimate } from "@/lib/types";
import { saveAnalysis } from "@/lib/storage";
import { useAuth } from "@/components/auth/auth-provider";
import { createBrowserClient } from "@/lib/auth";
import AnalysisResults from "@/components/analysis/analysis-results";
import { StreamingPreview } from "@/components/analysis/streaming-preview";

export default function LiveAnalysisPage() {
  return (
    <Suspense fallback={<ProgressBarUI progress={5} label="Connecting..." />}>
      <LiveAnalysis />
    </Suspense>
  );
}

function ProgressBarUI({ progress, label }: { progress: number; label: string }) {
  return (
    <div className="mx-auto max-w-6xl px-5">
      <style>{`body { overflow: hidden; height: 100vh; } footer { position: fixed; bottom: 0; left: 0; right: 0; }`}</style>
      <div className="flex h-[calc(100vh-52px)] flex-col items-center justify-center relative">
        <div className="w-full max-w-sm mx-auto text-center">
          <div className="w-full h-1 rounded-full bg-white/[0.05] mb-6 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#7dd3fc] transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-[13px] text-white/40">{label}</div>
        </div>
      </div>
    </div>
  );
}

function LiveAnalysis() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Phase: progress bar → skeleton preview → full results
  const [phase, setPhase] = useState<"progress" | "preview" | "complete" | "error">("progress");

  // Smooth progress bar — driven by a timer, not SSE events
  const [progress, setProgress] = useState(10);
  const [progressLabel, setProgressLabel] = useState("Scraping listing...");

  // Streamed data — buffered silently during progress bar phase
  const [listing, setListing] = useState<ListingData | null>(null);
  const [vinDecode, setVinDecode] = useState<VinDecode | null>(null);
  const [fees, setFees] = useState<AuctionFees | null>(null);
  const [shipping, setShipping] = useState<ShippingEstimate | null>(null);
  const [auctionComps, setAuctionComps] = useState<FullAnalysis["auctionComps"]>(null);
  const [retailComps, setRetailComps] = useState<FullAnalysis["retailComps"]>(null);
  const [fullAnalysis, setFullAnalysis] = useState<FullAnalysis | null>(null);
  const [stage, setStage] = useState<"connecting" | "listing" | "vin" | "comps" | "complete">("connecting");
  const [error, setError] = useState<string | null>(null);

  // Smooth progress bar animation — runs independently of SSE events
  useEffect(() => {
    if (phase !== "progress") return;
    const steps = [
      { pct: 15, label: "Scraping listing...", delay: 1500 },
      { pct: 25, label: "Downloading photos...", delay: 3000 },
      { pct: 35, label: "Decoding VIN...", delay: 4500 },
      { pct: 45, label: "Pulling comps...", delay: 6500 },
      { pct: 55, label: "Searching auction history...", delay: 8500 },
      { pct: 62, label: "Checking retail market...", delay: 10500 },
      { pct: 68, label: "Analyzing damage...", delay: 13000 },
      { pct: 74, label: "Crunching numbers...", delay: 16000 },
      { pct: 80, label: "Almost there...", delay: 20000 },
      { pct: 85, label: "Finalizing...", delay: 25000 },
    ];
    const timers = steps.map(s =>
      setTimeout(() => {
        setProgress(s.pct);
        setProgressLabel(s.label);
      }, s.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  // Stream SSE events — buffer data silently
  useEffect(() => {
    const url = searchParams.get("url");
    if (!url) {
      setError("No URL provided");
      setPhase("error");
      return;
    }

    const controller = new AbortController();
    const startTime = Date.now();

    async function startStream() {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        try {
          const supabase = createBrowserClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
        } catch {}

        const body = {
          url: searchParams.get("url"),
          repairProfile: searchParams.get("repairProfile") || "budget_shop",
          userLocation: searchParams.get("userLocation") || "Houston, TX",
          userZip: searchParams.get("userZip") || "77001",
          currentBid: searchParams.get("currentBid") ? parseInt(searchParams.get("currentBid")!) : undefined,
          damageNotes: searchParams.get("damageNotes") || undefined,
          fresh: searchParams.get("fresh") === "true" || undefined,
          stream: true,
        };

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 429 || data.rateLimited) {
            router.replace("/upgrade");
            return;
          }
          setError(data.error || `Analysis failed (${res.status})`);
          setPhase("error");
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) { setError("Stream not available"); setPhase("error"); return; }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const eventStr of events) {
            if (!eventStr.trim()) continue;
            const eventMatch = eventStr.match(/^event: (.+)$/m);
            const dataMatch = eventStr.match(/^data: (.+)$/m);
            if (!eventMatch || !dataMatch) continue;

            const eventName = eventMatch[1];
            const data = JSON.parse(dataMatch[1]);

            switch (eventName) {
              case "listing":
                setListing(data.listing);
                setFees(data.fees);
                setShipping(data.shipping);
                setStage("listing");
                break;
              case "vin":
                setVinDecode(data.vinDecode);
                if (data.listing) setListing(data.listing);
                setStage("vin");
                break;
              case "comps":
                setAuctionComps(data.auctionComps);
                setRetailComps(data.retailComps);
                setStage("comps");
                break;
              case "complete": {
                const fa = data as FullAnalysis;
                setFullAnalysis(fa);
                setStage("complete");
                saveAnalysis(fa);
                // Always show skeleton briefly — longer flash for fast scans
                const elapsed = Date.now() - startTime;
                const skeletonMs = elapsed < 15000 ? 3500 : elapsed < 25000 ? 2500 : 1500;
                if (skeletonMs > 0) {
                  setPhase("preview");
                  setTimeout(() => {
                    setPhase("complete");
                    router.replace(`/analysis/${fa.id}`);
                  }, skeletonMs);
                } else {
                  setPhase("complete");
                  router.replace(`/analysis/${fa.id}`);
                }
                break;
              }
              case "error":
                setError(data.error);
                setPhase("error");
                break;
            }
          }
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Connection lost");
        setPhase("error");
      }
    }

    startStream();
    return () => controller.abort();
  }, [searchParams, router]);

  if (phase === "progress") {
    return <ProgressBarUI progress={progress} label={progressLabel} />;
  }

  if (phase === "error") {
    return (
      <div className="mx-auto max-w-6xl px-5 py-16 text-center">
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-6 py-8 max-w-md mx-auto">
          <h2 className="text-lg font-bold text-[#e4e4e7] mb-2">Analysis failed</h2>
          <p className="text-[13px] text-red-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg bg-[#7dd3fc] px-5 py-2.5 text-[13px] font-semibold text-[#0a0a0b] hover:bg-[#a5e4ff] transition-all"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (phase === "complete" && fullAnalysis) {
    return (
      <div className="mx-auto max-w-[1400px] px-3 sm:px-5 py-4 sm:py-6">
        <AnalysisResults analysis={fullAnalysis} isOwner={true} />
      </div>
    );
  }

  // Preview phase — show skeleton with whatever real data we have
  return (
    <StreamingPreview
      stage={stage}
      listing={listing}
      vinDecode={vinDecode}
      fees={fees}
      shipping={shipping}
      auctionComps={auctionComps}
      retailComps={retailComps}
    />
  );
}
