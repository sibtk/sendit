import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId, email, ref } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: "Missing price ID" }, { status: 400 });
    }

    // Check if this user already has an active subscription
    if (email) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      if (existing.data.length > 0) {
        const subs = await stripe.subscriptions.list({
          customer: existing.data[0].id,
          status: "active",
          limit: 1,
        });
        // Block checkout if user already has an active subscription
        if (subs.data.length > 0) {
          return NextResponse.json(
            { error: "active_subscription", message: "You already have an active subscription. Manage your plan in subscription settings." },
            { status: 409 }
          );
        }
      }
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${request.nextUrl.origin}/subscription?success=true`,
      cancel_url: `${request.nextUrl.origin}/pricing?canceled=true`,
      customer_email: email || undefined,
      metadata: {
        userId: userId || "",
        ref: ref || "",
      },
    };

    // Apply 25% off first month for affiliate referrals
    if (ref) {
      const coupon = await stripe.coupons.create({
        percent_off: 25,
        duration: "once",
        name: `25% off first month — ref:${ref}`,
      });
      sessionParams.discounts = [{ coupon: coupon.id }];
    } else {
      sessionParams.allow_promotion_codes = true;
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
