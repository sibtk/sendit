"use client";

import { useAuth } from "./auth-provider";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="rounded-lg bg-white/[0.06] border border-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white/50 hover:text-white/70 hover:bg-white/[0.08] transition-all"
      >
        Sign in
      </button>
    );
  }

  const initial = (user.email?.[0] || "?").toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7dd3fc]/15 text-[12px] font-bold text-[#7dd3fc] hover:bg-[#7dd3fc]/25 transition-all"
      >
        {initial}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border border-white/[0.08] bg-[#141416] p-1.5 shadow-xl shadow-black/50">
            <div className="px-3 py-2 text-[11px] text-white/30 truncate border-b border-white/[0.06] mb-1">
              {user.email}
            </div>
            <button
              onClick={() => { router.push("/settings"); setOpen(false); }}
              className="w-full rounded-lg px-3 py-2 text-left text-[13px] text-white/60 hover:bg-white/[0.04] hover:text-white/80 transition-all"
            >
              Settings
            </button>
            <button
              onClick={() => { router.push("/analyses"); setOpen(false); }}
              className="w-full rounded-lg px-3 py-2 text-left text-[13px] text-white/60 hover:bg-white/[0.04] hover:text-white/80 transition-all"
            >
              History
            </button>
            <button
              onClick={async () => { await signOut(); setOpen(false); }}
              className="w-full rounded-lg px-3 py-2 text-left text-[13px] text-white/40 hover:bg-white/[0.04] hover:text-red-400 transition-all"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
