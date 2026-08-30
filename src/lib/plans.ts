import type { Plan } from "@/lib/supabase/types";
import type { Locale } from "@/i18n/config";
import { plans as plansFr, viewerSeat as viewerSeatFr, perUserLabel as perUserLabelFr } from "@/i18n/dictionaries/fr/plans";
import { plans as plansEn, viewerSeat as viewerSeatEn, perUserLabel as perUserLabelEn } from "@/i18n/dictionaries/en/plans";

export type SelfServeTier = "essentiel" | "croissance";
export type BillingPeriod = "monthly" | "annual";

/** 2 mois offerts à l'année plutôt qu'un pourcentage — plus simple à vérifier de tête et à
 * annoncer ("payez 10 mois, l'année est incluse") que "17 % de rabais". */
export const ANNUAL_FREE_MONTHS = 2;

export type TierConfig = {
  id: Plan;
  label: string;
  /** Prix mensuel brut, par utilisateur — null pour Entreprise (prix sur mesure, jamais affiché
   * comme un nombre). Le prix annuel se déduit toujours de celui-ci via annualPriceFor(), jamais
   * saisi séparément : les deux doivent toujours rester cohérents entre eux. */
  priceMonthly: number | null;
  tagline: string;
  /** Plafond interne de coût, jamais affiché dans les forfaits (décision produit : la
   * tarification publique ne mentionne plus de quota IA) — sert uniquement à protéger
   * contre une facture Anthropic imprévisible. null = pas de plafond (Entreprise). */
  aiQuota: number | null;
  stripeEnvVar?: string;
  stripeEnvVarAnnual?: string;
  selfServe: boolean;
};

export const TIERS: Record<Plan, TierConfig> = {
  free: {
    id: "free",
    label: "Gratuit",
    priceMonthly: 0,
    tagline: "Aucun abonnement actif",
    aiQuota: 0,
    selfServe: false,
  },
  essentiel: {
    id: "essentiel",
    label: "Essentiel",
    priceMonthly: 50,
    tagline: "Pour démarrer un programme d'automatisation (recommandé pour 1 à 5 utilisateurs)",
    aiQuota: 50,
    stripeEnvVar: "STRIPE_PRICE_ESSENTIEL",
    stripeEnvVarAnnual: "STRIPE_PRICE_ESSENTIEL_ANNUEL",
    selfServe: true,
  },
  croissance: {
    id: "croissance",
    label: "Croissance",
    priceMonthly: 40,
    tagline: "Pour une équipe qui évalue en continu (recommandé pour 6 à 20 utilisateurs)",
    aiQuota: 250,
    stripeEnvVar: "STRIPE_PRICE_CROISSANCE",
    stripeEnvVarAnnual: "STRIPE_PRICE_CROISSANCE_ANNUEL",
    selfServe: true,
  },
  entreprise: {
    id: "entreprise",
    label: "Entreprise",
    priceMonthly: null,
    tagline: "Prix par utilisateur négocié, support prioritaire",
    aiQuota: null,
    selfServe: false,
  },
};

/** Variante consciente de la langue de TIERS — mêmes id/prix/quota/stripeEnvVar/selfServe, texte localisé. */
export function getTiers(locale: Locale = "fr"): Record<Plan, TierConfig> {
  const dict = locale === "en" ? plansEn : plansFr;
  return Object.fromEntries(
    Object.entries(TIERS).map(([id, tier]) => {
      const t = dict[id as Plan];
      return [id, { ...tier, label: t.label, tagline: t.tagline }];
    })
  ) as Record<Plan, TierConfig>;
}

export const SELF_SERVE_TIERS: SelfServeTier[] = ["essentiel", "croissance"];

export function isSelfServeTier(value: string): value is SelfServeTier {
  return value === "essentiel" || value === "croissance";
}

export function isBillingPeriod(value: string): value is BillingPeriod {
  return value === "monthly" || value === "annual";
}

/** null = quota illimité (Entreprise sans override explicite). */
export function aiQuotaFor(plan: Plan, override: number | null): number | null {
  if (override != null) return override;
  return TIERS[plan].aiQuota;
}

export const ENTERPRISE_CONTACT_EMAIL = "mekouarothman16@gmail.com";

/** Prix annuel total dérivé du prix mensuel — jamais saisi séparément, pour que les deux
 * ne puissent pas diverger accidentellement. */
export function annualPriceFor(monthly: number): number {
  return monthly * (12 - ANNUAL_FREE_MONTHS);
}

/** Formate un prix de siège (forfait de base ou Spectateur) selon la période choisie.
 * `unitLabel` ("utilisateur"/"personne", déjà localisé) est fourni par l'appelant plutôt que
 * stocké ici, pour rester le seul endroit qui connaît la distinction entre les deux types de siège. */
export function formatSeatPrice(priceMonthly: number, period: BillingPeriod, locale: Locale, unitLabel: string): string {
  const amount = period === "annual" ? annualPriceFor(priceMonthly) : priceMonthly;
  const periodWord = period === "annual" ? (locale === "en" ? "year" : "an") : locale === "en" ? "month" : "mois";
  return locale === "en" ? `$${amount} CAD / ${periodWord} / ${unitLabel}` : `${amount} $ CAD / ${periodWord} / ${unitLabel}`;
}

/** Noms des variables d'environnement Stripe pour le siège "Spectateur" (rôle viewer) — les
 * valeurs elles-mêmes ne sont lues que côté serveur, dans stripe.ts (jamais ici : ce module est
 * aussi importé par des Client Components comme PricingCards.tsx). */
export const VIEWER_SEAT_STRIPE_ENV_VAR = "STRIPE_PRICE_VIEWER_SEAT";
export const VIEWER_SEAT_STRIPE_ENV_VAR_ANNUAL = "STRIPE_PRICE_VIEWER_SEAT_ANNUEL";
export const VIEWER_SEAT_PRICE_MONTHLY = 20;

export type ViewerSeatConfig = { label: string; tagline: string; addOnNote: string; inviteHint: string; unitLabel: string };

/** Variante consciente de la langue du siège Spectateur — même contenu que getTiers(). */
export function getViewerSeat(locale: Locale = "fr"): ViewerSeatConfig {
  return locale === "en" ? viewerSeatEn : viewerSeatFr;
}

/** Libellé d'unité pour les forfaits de base (Essentiel/Croissance) — "utilisateur"/"user". */
export function getPerUserLabel(locale: Locale = "fr"): string {
  return locale === "en" ? perUserLabelEn : perUserLabelFr;
}
