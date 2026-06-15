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

        const updateData: Record<string, unknown> = {
          tier,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
        };

        // Track referral — affiliate or user
        const ref = session.metadata?.ref;
        if (ref) {
          updateData.referred_by = ref;
          updateData.referral_date = new Date().toISOString();

          // Check if this is an affiliate or a user referral
          const { data: affiliate } = await sb
            .from("affiliates")
            .select("id")
            .eq("ref", ref)
            .maybeSingle();

          if (!affiliate) {
            // User referral — increment referrer's count
            const { data: referrer } = await sb
              .from("user_profiles")
              .select("id, referral_count, free_months_earned")
              .eq("referral_code", ref)
              .maybeSingle();

            if (referrer) {
              const newCount = (referrer.referral_count || 0) + 1;
              const newFreeMonths = Math.floor(newCount / 3);
              await sb.from("user_profiles").update({
                referral_count: newCount,
                free_months_earned: newFreeMonths,
              }).eq("id", referrer.id);
              console.log(`User referral: ${ref} now has ${newCount} referrals (${newFreeMonths} free months)`);
            }
          }
        }

        await sb.from("user_profiles").update(updateData).eq("id", userId);

        console.log(`User ${userId} upgraded to ${tier}${ref ? ` (ref: ${ref})` : ""}`);
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
