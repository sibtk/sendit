import { Suspense } from "react";
import { HomeForm } from "@/components/home-form";
import { PromoBanner } from "@/components/promo-banner";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-5">
      <div className="flex h-[calc(100vh-52px)] flex-col items-center justify-center relative">
        <div className="w-full max-w-xl">
          {/* Server-rendered — visible instantly before JS */}
          <h1
            className="mb-2 text-5xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-grotesk)" }}
          >
            <span className="text-white/90">Should you </span>
            <span
              className="text-[#7dd3fc]"
              style={{
                textShadow: "0 0 40px rgba(125,211,252,0.3), 0 0 80px rgba(125,211,252,0.1)",
              }}
            >
              send it
            </span>
            <span className="text-white/90">?</span>
          </h1>
          <p className="mb-3 text-[15px] text-white/30">
            Paste an IAA or Copart URL. Get the verdict.
          </p>
          <Suspense>
            <PromoBanner />
          </Suspense>

          {/* Interactive form hydrates after JS loads */}
          <Suspense fallback={<FormSkeleton />}>
            <HomeForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <>
      <p className="mb-8 text-[12px] text-white/15">
        Try it free — no account or card required.
      </p>
      <div className="relative">
        <div className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3.5 pr-28 text-[15px] text-white/20">
          Paste IAA or Copart listing URL...
        </div>
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-[#7dd3fc] px-4 py-2 text-sm font-semibold text-[#0a0a0b] opacity-20">
          Analyze
        </div>
      </div>
    </>
  );
}
