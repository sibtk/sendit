import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref) return NextResponse.json({ name: null });

  const sb = getSupabase();
  const { data } = await sb
    .from("affiliates")
    .select("name")
    .eq("ref", ref)
    .eq("active", true)
    .single();

  return NextResponse.json({ name: data?.name || null });
}
