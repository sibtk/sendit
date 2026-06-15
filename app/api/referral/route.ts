import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

function generateCode(email: string): string {
  const prefix = email.replace(/[^a-z]/gi, "").slice(0, 3).toLowerCase();
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${digits}`;
}

// GET — return user's referral info, auto-generate code if needed
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const sb = getSupabase();
  const { data: profile } = await sb
    .from("user_profiles")
    .select("referral_code, referral_count, free_months_earned, free_months_used")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Auto-generate referral code if null
  let code = profile.referral_code;
  if (!code) {
    // Get email from auth
    const { data: authData } = await sb.auth.admin.getUserById(userId);
    const email = authData?.user?.email || "user";
    code = generateCode(email);

    // Try to save — if collision, regenerate
    for (let i = 0; i < 3; i++) {
      const { error } = await sb
        .from("user_profiles")
        .update({ referral_code: code })
        .eq("id", userId);
      if (!error) break;
      code = generateCode(email + i);
    }
  }

  return NextResponse.json({
    code,
    referralCount: profile.referral_count || 0,
    freeMonthsEarned: profile.free_months_earned || 0,
    freeMonthsUsed: profile.free_months_used || 0,
    freeMonthsAvailable: (profile.free_months_earned || 0) - (profile.free_months_used || 0),
    progressToNext: (profile.referral_count || 0) % 3,
  });
}

// POST — redeem a free month
export async function POST(request: NextRequest) {
  const { userId, action } = await request.json();

  if (!userId || action !== "redeem") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const sb = getSupabase();
  const { data: profile } = await sb
    .from("user_profiles")
    .select("free_months_earned, free_months_used, stripe_subscription_id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const available = (profile.free_months_earned || 0) - (profile.free_months_used || 0);
  if (available <= 0) {
    return NextResponse.json({ error: "No free months available" }, { status: 400 });
  }

  if (!profile.stripe_subscription_id) {
    return NextResponse.json({ error: "No active subscription to apply free month to" }, { status: 400 });
  }

  try {
    // Create 100% off one-month coupon
    const coupon = await stripe.coupons.create({
      percent_off: 100,
      duration: "once",
      name: "Free month — referral reward",
    });

    // Apply to subscription via discount
    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      discounts: [{ coupon: coupon.id }],
    });

    // Update counts
    await sb
      .from("user_profiles")
      .update({ free_months_used: (profile.free_months_used || 0) + 1 })
      .eq("id", userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Redeem free month error:", error);
    return NextResponse.json({ error: "Failed to apply free month" }, { status: 500 });
  }
}
