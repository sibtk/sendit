import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId, email } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: "Missing price ID" }, { status: 400 });
    }

    // Check if this is the Pro plan — apply first month discount
    const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "";
    const isProPlan = priceId === proPriceId;

    // Check if this user already had a subscription (no double-dipping on intro price)
    let isNewCustomer = true;
    if (email) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      if (existing.data.length > 0) {
        const subs = await stripe.subscriptions.list({ customer: existing.data[0].id, limit: 1 });
        if (subs.data.length > 0) isNewCustomer = false;
      }
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${request.nextUrl.origin}/pricing?success=true`,
      cancel_url: `${request.nextUrl.origin}/pricing?canceled=true`,
      customer_email: email || undefined,
      metadata: {
        userId: userId || "",
      },
    };

    // Auto-apply $30 off first month for new Pro subscribers
    if (isProPlan && isNewCustomer) {
      // Create a one-time coupon for $30 off (makes first month $19)
      const coupon = await stripe.coupons.create({
        amount_off: 2500,
        currency: "usd",
        duration: "once",
        name: "Intro — $5 first month",
      });
      sessionParams.discounts = [{ coupon: coupon.id }];
      sessionParams.allow_promotion_codes = false; // can't stack with promo codes
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
