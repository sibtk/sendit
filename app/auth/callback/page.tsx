"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const supabase = createBrowserClient();

    // Supabase puts the token in the URL hash — exchange it for a session
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setStatus("success");
        setTimeout(() => router.push("/onboarding"), 1500);
      }
    });

    // Also try to get session from URL params (some flows use query params)
    const hash = window.location.hash;
    if (hash) {
      // Supabase handles this automatically via the auth listener
    } else {
      // No hash — might be an error or expired link
      setTimeout(() => {
        if (status === "loading") setStatus("error");
      }, 5000);
    }
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-52px)] items-center justify-center px-5">
      <div className="text-center">
        {status === "loading" && (
          <>
            <div className="text-[#a1a1aa] text-lg mb-2">Confirming your email...</div>
            <div className="text-[#52525b] text-sm">Hang tight.</div>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-[#7dd3fc] text-lg font-semibold mb-2">You're in.</div>
            <div className="text-[#52525b] text-sm">Redirecting...</div>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-red-400 text-lg mb-2">Something went wrong.</div>
            <div className="text-[#52525b] text-sm mb-4">The link may have expired.</div>
            <button
              onClick={() => router.push("/login")}
              className="rounded-lg bg-[#7dd3fc] px-4 py-2 text-sm font-semibold text-[#0a0a0b]"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
