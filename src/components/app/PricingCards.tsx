"use client";

import { useState } from "react";
import { Check, Eye, Loader2 } from "lucide-react";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { BillingPeriodToggle } from "@/components/ui/BillingPeriodToggle";
import {
  formatSeatPrice, getPerUserLabel, getTiers, getViewerSeat, SELF_SERVE_TIERS, ENTERPRISE_CONTACT_EMAIL,
  VIEWER_SEAT_PRICE_MONTHLY, type BillingPeriod, type SelfServeTier,
} from "@/lib/plans";
import type { Plan } from "@/lib/supabase/types";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";

export function PricingCards({ currentPlan, isOwner }: { currentPlan: Plan; isOwner: boolean }) {
  const locale = useLocale();
  const TIERS = getTiers(locale);
  const viewerSeat = getViewerSeat(locale);
  const perUserLabel = getPerUserLabel(locale);
  const { pricingCards: t } = useDictionary().auth;
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [loadingTier, setLoadingTier] = useState<SelfServeTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (tier: SelfServeTier) => {
    setLoadingTier(tier);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, annual: period === "annual" }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || t.genericError);
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : t.genericError);
      setLoadingTier(null);
    }
  };

  return (
    <div>
      <div className="flex justify-center mb-5">
        <BillingPeriodToggle
          period={period}
          onChange={setPeriod}
          monthlyLabel={t.monthlyBillingLabel}
          annualLabel={t.annualBillingLabel}
          savingsBadge={period === "annual" ? t.annualSavingsBadge : undefined}
        />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SELF_SERVE_TIERS.map((tier) => {
          const tc = TIERS[tier];
          const isCurrent = currentPlan === tier;
          return (
            <Card key={tier} className={clsx("p-5 flex flex-col", isCurrent && "ring-2 ring-accent")}>
              <div className="text-[13.5px] font-semibold text-ink">{tc.label}</div>
              <div className="font-mono text-[19px] font-bold text-accent-deep mt-1.5">
                {formatSeatPrice(tc.priceMonthly ?? 0, period, locale, perUserLabel)}
              </div>
              <div className="text-[11.5px] text-ink-faint mt-1">{tc.tagline}</div>
              <div className="flex items-center gap-1.5 text-[12px] text-ink font-medium mt-3">
                <Check size={13} className="text-accent shrink-0" /> {t.allFeaturesIncluded}
              </div>
              <div className="mt-auto pt-4">
                {isCurrent ? (
                  <div className="text-[12.5px] font-semibold text-accent text-center py-2.5">{t.currentTier}</div>
                ) : isOwner ? (
                  <button
                    onClick={() => choose(tier)}
                    disabled={loadingTier !== null}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-accent-vivid text-ink text-[13.5px] font-semibold hover:brightness-95 transition disabled:opacity-60"
                  >
                    {loadingTier === tier && <Loader2 size={14} className="animate-spin-slow" />}
                    {t.chooseThisTier}
                  </button>
                ) : (
                  <div className="text-[11.5px] text-ink-faint text-center py-2.5">{t.ownerOnlyChange}</div>
                )}
              </div>
            </Card>
          );
        })}

        <Card className="p-5 flex flex-col">
          <div className="text-[13.5px] font-semibold text-ink">{TIERS.entreprise.label}</div>
          <div className="font-mono text-[19px] font-bold text-ink mt-1.5">{t.customPricing}</div>
          <div className="text-[11.5px] text-ink-faint mt-1">{TIERS.entreprise.tagline}</div>
          <div className="text-[12px] text-ink-soft mt-3">{t.negotiatedVolume}</div>
          <div className="mt-auto pt-4">
            <a
              href={`mailto:${ENTERPRISE_CONTACT_EMAIL}?subject=${encodeURIComponent(t.enterpriseEmailSubject)}`}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-line text-ink text-[13.5px] font-semibold hover:bg-accent-soft transition"
            >
              {t.contactUs}
            </a>
          </div>
        </Card>

        <Card className="p-5 flex flex-col border-dashed">
          <div className="flex items-center justify-between">
            <div className="text-[13.5px] font-semibold text-ink">{viewerSeat.label}</div>
            <span className="flex items-center gap-1 font-mono text-[10px] px-2 py-1 rounded-full bg-line-soft text-ink-faint">
              <Eye size={11} /> {t.viewerSeatBadge}
            </span>
          </div>
          <div className="font-mono text-[19px] font-bold text-ink mt-1.5">
            {formatSeatPrice(VIEWER_SEAT_PRICE_MONTHLY, period, locale, viewerSeat.unitLabel)}
          </div>
          <div className="text-[11.5px] text-ink-faint mt-1">{viewerSeat.tagline}</div>
          <div className="mt-auto pt-4">
            <p className="text-[11.5px] text-ink-faint leading-relaxed">{viewerSeat.addOnNote}</p>
          </div>
        </Card>
      </div>
      {error && <div className="text-[12.5px] text-coral mt-3">{error}</div>}

      <div className="grid gap-2.5 mt-6">
        {t.features.map((f) => (
          <div key={f} className="flex items-start gap-2.5">
            <Check size={15} className="text-teal shrink-0 mt-0.5" />
            <span className="text-[13.5px] text-ink-soft">{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
