import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient, getUserOrg } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type { OrganizationBillingRow } from "@/lib/supabase/types";
import { getServerLocale } from "@/i18n/serverLocale";
import { getDictionary } from "@/i18n/getDictionary";

export async function POST(request: NextRequest) {
  const locale = await getServerLocale();
  const t = getDictionary(locale).errors.api.stripePortal;

  if (!isStripeConfigured) {
    return NextResponse.json({ error: t.notConfigured }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
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

  if (!billing?.stripe_customer_id) {
    return NextResponse.json({ error: t.noActiveSubscription }, { status: 400 });
  }

  const origin = (await headers()).get("origin") ?? new URL(request.url).origin;
  const stripe = getStripe();

  const session = await stripe.billingPortal.sessions.create({
    customer: billing.stripe_customer_id,
    return_url: `${origin}/${locale}/compte`,
  });

  return NextResponse.json({ url: session.url });
}
