import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured, tierForPriceId } from "@/lib/stripe";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { Plan } from "@/lib/supabase/types";
import type { BillingPeriod } from "@/lib/plans";

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

function baseTierItem(subscription: Stripe.Subscription) {
  // Cherche parmi TOUS les items, pas seulement le premier : depuis l'ajout de la
  // facturation par siège Spectateur, un abonnement peut avoir un second item (prix des
  // sièges viewer) dont l'ordre n'est pas garanti — se fier à data[0] détecterait le
  // mauvais palier si Stripe le place en premier.
  for (const item of subscription.items.data) {
    if (item.price?.id && tierForPriceId(item.price.id)) return item;
  }
  return null;
}

function planForSubscription(subscription: Stripe.Subscription): Plan {
  if (!ACTIVE_STATUSES.has(subscription.status)) return "free";
  const item = baseTierItem(subscription);
  return (item?.price?.id && tierForPriceId(item.price.id)) || "free";
}

/** Déduite du prix Stripe réel de l'item de base (mensuel ou annuel), jamais supposée — c'est
 * l'organisation qui a choisi ce prix au moment du paiement (voir checkout/route.ts). */
function billingPeriodForSubscription(subscription: Stripe.Subscription): BillingPeriod {
  const interval = baseTierItem(subscription)?.price?.recurring?.interval;
  return interval === "year" ? "annual" : "monthly";
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const admin = createAdminClient();
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const orgId = subscription.metadata?.organization_id;
  const plan = planForSubscription(subscription);

  const patch = {
    plan,
    billing_period: billingPeriodForSubscription(subscription),
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
  };

  if (orgId) {
    const { data } = await admin
      .from("organization_billing")
      .update(patch)
      .eq("organization_id", orgId)
      .select("organization_id");
    if (data && data.length > 0) return;
  }

  const { data: byCustomer } = await admin
    .from("organization_billing")
    .update(patch)
    .eq("stripe_customer_id", customerId)
    .select("organization_id");

  if (!byCustomer || byCustomer.length === 0) {
    console.error("stripe webhook: no organization matched", { customerId, orgId, subscriptionId: subscription.id });
  }
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured || !isSupabaseAdminConfigured) {
    return NextResponse.json({ error: "Webhook non configuré." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
  } catch (err) {
    console.error("stripe webhook signature error", err);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.client_reference_id;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;
        if (organizationId && customerId) {
          const admin = createAdminClient();
          await admin
            .from("organization_billing")
            .update({ stripe_customer_id: customerId })
            .eq("organization_id", organizationId);
        }
        if (typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await syncSubscription(subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("stripe webhook handling error", err);
    return NextResponse.json({ error: "Erreur de traitement." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
