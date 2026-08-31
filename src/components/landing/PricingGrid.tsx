"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { Check, ArrowRight, Eye } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { BillingPeriodToggle } from "@/components/ui/BillingPeriodToggle";
import { Reveal } from "./Reveal";
import {
  formatSeatPrice, getPerUserLabel, SELF_SERVE_TIERS, ENTERPRISE_CONTACT_EMAIL, VIEWER_SEAT_PRICE_MONTHLY,
  type BillingPeriod, type TierConfig, type ViewerSeatConfig,
} from "@/lib/plans";
import type { Plan } from "@/lib/supabase/types";
import type { Locale } from "@/i18n/config";

/** Crossfade+slide the price string when the billing period toggles, so the
 * new number reads as a rolled-in update rather than an instant swap. */
function RollingPrice({ value, className }: { value: string; className: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ display: "grid" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ gridArea: "1 / 1" }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function PricingGrid({
  locale,
  tiers,
  viewerSeat,
  t,
}: {
  locale: Locale;
  tiers: Record<Plan, TierConfig>;
  viewerSeat: ViewerSeatConfig;
  t: {
    recommended: string;
    monthlyBillingLabel: string;
    annualBillingLabel: string;
    annualSavingsBadge: string;
    allFeaturesIncluded: string;
    chooseThisTier: string;
    customPricing: string;
    enterpriseCaption: string;
    contactUs: string;
    enterpriseEmailSubject: string;
    viewerSeatBadge: string;
  };
}) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const perUserLabel = getPerUserLabel(locale);

  return (
    <>
      <Reveal delay={0.03}>
        <div className="flex justify-center mb-10">
          <BillingPeriodToggle
            period={period}
            onChange={setPeriod}
            monthlyLabel={t.monthlyBillingLabel}
            annualLabel={t.annualBillingLabel}
            savingsBadge={period === "annual" ? t.annualSavingsBadge : undefined}
          />
        </div>
      </Reveal>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1160px] mx-auto items-stretch">
        {SELF_SERVE_TIERS.map((tier, i) => {
          const tc = tiers[tier];
          const featured = tier === "croissance";
          return (
            <Reveal key={tier} delay={0.1 * (i + 1)}>
              <div
                className={
                  featured
                    ? "relative h-full bg-ink rounded-2xl p-8 flex flex-col overflow-hidden"
                    : "h-full bg-surface border border-line rounded-2xl p-8 flex flex-col"
                }
                style={featured ? { border: "1px solid rgba(201,162,39,.25)" } : undefined}
              >
                {featured && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-30"
                    style={{ background: "var(--color-accent)" }}
                  />
                )}
                <div className="flex items-center justify-between relative">
                  <span
                    className={
                      featured
                        ? "font-mono text-[11px] tracking-[0.16em] uppercase text-gold-tint font-medium"
                        : "font-mono text-[11px] tracking-[0.16em] uppercase text-ink-faint font-medium"
                    }
                  >
                    {tc.label}
                  </span>
                  {featured && (
                    <span
                      className="font-mono text-[10px] px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(201,162,39,.14)", color: "var(--color-gold-tint)" }}
                    >
                      {t.recommended}
                    </span>
                  )}
                </div>
                <RollingPrice
                  value={formatSeatPrice(tc.priceMonthly ?? 0, period, locale, perUserLabel)}
                  className={
                    featured
                      ? "font-mono text-[26px] font-semibold text-white mt-3 mb-1"
                      : "font-mono text-[26px] font-semibold text-ink mt-3 mb-1"
                  }
                />
                <p className={featured ? "text-[13px] text-white/50 mb-6 relative" : "text-[13px] text-ink-faint mb-6"}>
                  {tc.tagline}
                </p>

                <div className={featured ? "relative flex-1 pt-6 border-t border-white/15" : "flex-1 pt-6 border-t border-line"}>
                  <div className={featured ? "flex items-start gap-2 text-[13px] text-white/85 font-medium" : "flex items-start gap-2 text-[13px] text-ink font-medium"}>
                    <Check size={16} className={featured ? "text-gold-tint shrink-0 mt-0.5" : "text-accent shrink-0 mt-0.5"} />
                    {t.allFeaturesIncluded}
                  </div>
                </div>

                <LocaleLink
                  href="/inscription"
                  className={
                    featured
                      ? "group relative mt-8 flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white text-ink text-[14px] font-semibold hover:brightness-95 transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
                      : "group mt-8 flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-line text-ink text-[14px] font-semibold hover:border-accent hover:text-accent transition"
                  }
                >
                  {t.chooseThisTier} <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </LocaleLink>
              </div>
            </Reveal>
          );
        })}

        <Reveal delay={0.1 * (SELF_SERVE_TIERS.length + 1)}>
          <div className="h-full bg-surface border border-line rounded-2xl p-8 flex flex-col">
            <Eyebrow>{tiers.entreprise.label}</Eyebrow>
            <div className="font-mono text-[26px] font-semibold text-ink mt-3 mb-1">{t.customPricing}</div>
            <p className="text-[13px] text-ink-faint mb-6">{tiers.entreprise.tagline}</p>

            <div className="flex-1 pt-6 border-t border-line">
              <div className="font-mono text-[26px] font-bold text-ink">{t.customPricing}</div>
              <p className="text-[12.5px] text-ink-faint mt-2.5">{t.enterpriseCaption}</p>
            </div>

            <a
              href={`mailto:${ENTERPRISE_CONTACT_EMAIL}?subject=${encodeURIComponent(t.enterpriseEmailSubject)}`}
              className="mt-8 flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-line text-ink text-[14px] font-semibold hover:border-accent hover:text-accent transition"
            >
              {t.contactUs} <ArrowRight size={15} />
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.1 * (SELF_SERVE_TIERS.length + 2)}>
          <div className="h-full bg-surface border border-dashed border-line rounded-2xl p-8 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-ink-faint font-medium">
                {viewerSeat.label}
              </span>
              <span className="flex items-center gap-1 font-mono text-[10px] px-2.5 py-1 rounded-full bg-line-soft text-ink-faint">
                <Eye size={11} /> {t.viewerSeatBadge}
              </span>
            </div>
            <RollingPrice
              value={formatSeatPrice(VIEWER_SEAT_PRICE_MONTHLY, period, locale, viewerSeat.unitLabel)}
              className="font-mono text-[26px] font-semibold text-ink mt-3 mb-1"
            />
            <p className="text-[13px] text-ink-faint mb-6">{viewerSeat.tagline}</p>

            <div className="flex-1 pt-6 border-t border-line">
              <p className="text-[12.5px] text-ink-soft leading-relaxed">{viewerSeat.addOnNote}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </>
  );
}
