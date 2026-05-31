import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const sb = getSupabase();
  const { data: profile } = await sb
    .from("user_profiles")
    .select("stripe_subscription_id, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ subscription: null });
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const item = subscription.items.data[0];
    const priceId = item?.price.id;
    const tier = priceId === process.env.NEXT_PUBLIC_STRIPE_DEALER_PRICE_ID ? "dealer" : "pro";

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        tier,
        currentPeriodEnd: item?.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        priceId,
      },
    });
  } catch {
    return NextResponse.json({ subscription: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, userId } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
    }

    const sb = getSupabase();
    const { data: profile } = await sb
      .from("user_profiles")
      .select("stripe_subscription_id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    const subscriptionId = profile.stripe_subscription_id;

    switch (action) {
      case "cancel": {
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
        return NextResponse.json({ success: true });
      }

      case "reactivate": {
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: false,
        });
        return NextResponse.json({ success: true });
      }

      case "upgrade": {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const currentPriceId = subscription.items.data[0]?.price.id;

        if (currentPriceId === process.env.NEXT_PUBLIC_STRIPE_DEALER_PRICE_ID) {
          return NextResponse.json({ error: "Already on Dealer plan" }, { status: 400 });
        }

        // Reactivate if cancellation is pending
        if (subscription.cancel_at_period_end) {
          await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false,
          });
        }

        // Swap to Dealer price with proration
        await stripe.subscriptions.update(subscriptionId, {
          items: [{
            id: subscription.items.data[0].id,
            price: process.env.NEXT_PUBLIC_STRIPE_DEALER_PRICE_ID,
          }],
          proration_behavior: "create_prorations",
        });

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Subscription action error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Action failed" },
      { status: 500 }
    );
  }
}
