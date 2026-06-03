import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

// List all affiliates with their stats
export async function GET() {
  const sb = getSupabase();

  const [affiliates, users] = await Promise.all([
    sb.from("affiliates").select("*").order("created_at", { ascending: false }),
    sb.from("user_profiles").select("id, tier, referred_by, referral_date"),
  ]);

  const ADMIN_ID = "85896c4a-55a9-4758-a53c-83aa14dd20cf";
  const userList = users.data || [];

  const result = (affiliates.data || []).map((a) => {
    const referred = userList.filter((u) => u.referred_by === a.ref && u.id !== ADMIN_ID);
    const pro = referred.filter((u) => u.tier === "pro").length;
    const dealer = referred.filter((u) => u.tier === "dealer").length;
    const mrr = pro * 30 + dealer * 120;
    const payout = Math.round(mrr * (a.commission_pct / 100) * 100) / 100;

    return {
      ...a,
      signups: referred.length,
      pro,
      dealer,
      mrr,
      payout,
    };
  });

  return NextResponse.json({ affiliates: result });
}

// Create a new affiliate
export async function POST(request: NextRequest) {
  const sb = getSupabase();
  const { ref, name, contact, commission_pct } = await request.json();

  if (!ref || !name) {
    return NextResponse.json({ error: "Missing ref or name" }, { status: 400 });
  }

  const { data, error } = await sb.from("affiliates").insert({
    ref: ref.toLowerCase().replace(/[^a-z0-9-]/g, ""),
    name,
    contact: contact || null,
    commission_pct: commission_pct || 20,
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ affiliate: data });
}

// Update or delete an affiliate
export async function PATCH(request: NextRequest) {
  const sb = getSupabase();
  const { id, ...updates } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await sb.from("affiliates").update(updates).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
