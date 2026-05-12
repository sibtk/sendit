import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const sb = getSupabase();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (userId) {
        // Get subscription to determine tier
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const tier = priceId === process.env.NEXT_PUBLIC_STRIPE_DEALER_PRICE_ID ? "dealer" : "pro";

        await sb.from("user_profiles").update({
          tier,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
        }).eq("id", userId);

        console.log(`User ${userId} upgraded to ${tier}`);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status;

      if (status === "active") {
        const priceId = subscription.items.data[0]?.price.id;
        const tier = priceId === process.env.NEXT_PUBLIC_STRIPE_DEALER_PRICE_ID ? "dealer" : "pro";
        await sb.from("user_profiles").update({ tier }).eq("stripe_customer_id", customerId);
      } else if (status === "canceled" || status === "unpaid" || status === "past_due") {
        await sb.from("user_profiles").update({ tier: "free" }).eq("stripe_customer_id", customerId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      await sb.from("user_profiles").update({
        tier: "free",
        stripe_subscription_id: null,
      }).eq("stripe_customer_id", customerId);
      console.log(`Customer ${customerId} subscription canceled`);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
