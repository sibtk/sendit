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
  if (!ref) return NextResponse.json({ name: null, type: null, discount: 0 });

  const sb = getSupabase();

  // Check affiliates table first
  const { data: affiliate } = await sb
    .from("affiliates")
    .select("name")
    .eq("ref", ref)
    .eq("active", true)
    .maybeSingle();

  if (affiliate) {
    return NextResponse.json({
      name: affiliate.name,
      type: "affiliate",
      discount: 25,
    });
  }

  // Check if it's a user referral code
  const { data: userRef } = await sb
    .from("user_profiles")
    .select("referral_code")
    .eq("referral_code", ref)
    .maybeSingle();

  if (userRef) {
    return NextResponse.json({
      name: null,
      type: "user",
      discount: 10,
    });
  }

  return NextResponse.json({ name: null, type: null, discount: 0 });
}
