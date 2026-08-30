import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient, getUserOrg } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured, priceIdForTier } from "@/lib/stripe";
import { isSelfServeTier, type BillingPeriod } from "@/lib/plans";
import type { OrganizationBillingRow } from "@/lib/supabase/types";
import { getServerLocale } from "@/i18n/serverLocale";
import { getDictionary } from "@/i18n/getDictionary";

export async function POST(request: NextRequest) {
  const locale = await getServerLocale();
  const t = getDictionary(locale).errors.api.stripeCheckout;

  if (!isStripeConfigured) {
    return NextResponse.json({ error: t.notConfigured }, { status: 503 });
  }

  let body: { tier?: string; annual?: boolean };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const tier = body.tier;
  if (!tier || !isSelfServeTier(tier)) {
    return NextResponse.json({ error: t.invalidTier }, { status: 400 });
  }
  const period: BillingPeriod = body.annual === true ? "annual" : "monthly";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: t.loginRequired }, { status: 401 });
  }

  const org = await getUserOrg(supabase, user.id);
  if (!org) {
    return NextResponse.json({ error: t.orgNotFound }, { status: 404 });
  }
  if (org.role !== "owner") {
    return NextResponse.json({ error: t.ownerOnly }, { status: 403 });
  }

  const { data: billing } = await supabase
    .from("organization_billing")
    .select("stripe_customer_id")
    .eq("organization_id", org.organizationId)
    .single<Pick<OrganizationBillingRow, "stripe_customer_id">>();

  const priceId = priceIdForTier(tier, period);
  if (!priceId) {
    return NextResponse.json({ error: t.tierNotConfigured }, { status: 503 });
  }

  // Tous les forfaits sont facturés à la personne : la quantité de départ reflète le nombre
  // réel d'éditeurs (owner + member) déjà dans l'organisation, pas 1 par défaut — une
  // organisation qui a invité des membres avant de passer au payant ne doit pas être
  // sous-facturée dès le premier cycle.
  const { count: editorCount } = await supabase
    .from("organization_members")
    .select("user_id", { count: "exact", head: true })
    .eq("organization_id", org.organizationId)
    .in("role", ["owner", "member"]);

  const origin = (await headers()).get("origin") ?? new URL(request.url).origin;
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: Math.max(editorCount ?? 1, 1) }],
    ...(billing?.stripe_customer_id
      ? { customer: billing.stripe_customer_id }
      : { customer_email: user.email }),
    client_reference_id: org.organizationId,
    subscription_data: { metadata: { organization_id: org.organizationId } },
    success_url: `${origin}/${locale}/compte?checkout=success`,
    cancel_url: `${origin}/${locale}/compte?checkout=cancelled`,
  });

  if (!session.url) {
    return NextResponse.json({ error: t.sessionFailed }, { status: 502 });
  }

  return NextResponse.json({ url: session.url });
}
