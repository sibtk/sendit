import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function POST(request: NextRequest) {
  const { ref } = await request.json();
  if (!ref) return NextResponse.json({ ok: true });

  const sb = getSupabase();

  const { data } = await sb
    .from("affiliates")
    .select("clicks")
    .eq("ref", ref)
    .single();

  if (data) {
    await sb
      .from("affiliates")
      .update({ clicks: (data.clicks || 0) + 1 })
      .eq("ref", ref);
  }

  return NextResponse.json({ ok: true });
}
