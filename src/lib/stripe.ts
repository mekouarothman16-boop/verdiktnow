import Stripe from "stripe";
import {
  BillingPeriod, SELF_SERVE_TIERS, SelfServeTier, TIERS,
  VIEWER_SEAT_STRIPE_ENV_VAR, VIEWER_SEAT_STRIPE_ENV_VAR_ANNUAL,
} from "@/lib/plans";

export const isStripeConfigured =
  !!process.env.STRIPE_SECRET_KEY &&
  !!process.env.STRIPE_PRICE_ESSENTIEL &&
  !!process.env.STRIPE_PRICE_CROISSANCE;

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY manquante.");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

export function priceIdForTier(tier: SelfServeTier, period: BillingPeriod = "monthly"): string {
  const envVar = period === "annual" ? TIERS[tier].stripeEnvVarAnnual : TIERS[tier].stripeEnvVar;
  return (envVar && process.env[envVar]) || "";
}

/** Cherche parmi les prix mensuels ET annuels : la période elle-même est déduite séparément
 * (voir billingPeriodForSubscription dans le webhook), pas ici. */
export function tierForPriceId(priceId: string): SelfServeTier | null {
  return (
    SELF_SERVE_TIERS.find((tier) => priceIdForTier(tier, "monthly") === priceId) ??
    SELF_SERVE_TIERS.find((tier) => priceIdForTier(tier, "annual") === priceId) ??
    null
  );
}

export function viewerSeatPriceId(period: BillingPeriod = "monthly"): string {
  const envVar = period === "annual" ? VIEWER_SEAT_STRIPE_ENV_VAR_ANNUAL : VIEWER_SEAT_STRIPE_ENV_VAR;
  return process.env[envVar] || "";
}

export const isViewerSeatBillingConfigured = (period: BillingPeriod = "monthly") => !!viewerSeatPriceId(period);
