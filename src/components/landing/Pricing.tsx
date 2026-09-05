import { Check } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "./Reveal";
import { GUTTER, INSET, MEASURE, SHELL } from "./layout";
import { PricingGrid } from "./PricingGrid";
import { getTiers, getViewerSeat } from "@/lib/plans";
import { getServerDictionary, getRootParamsLocale } from "@/i18n/getDictionary";

export async function Pricing() {
  const locale = await getRootParamsLocale();
  const TIERS = getTiers(locale);
  const viewerSeat = getViewerSeat(locale);
  const { pricing: t } = (await getServerDictionary()).landing;
  return (
    <section id="tarifs" className={`${GUTTER} py-20 sm:py-28`}>
      <div className={`${SHELL} ${INSET}`}>
        <Reveal>
          <div className="flex items-center gap-2.5 mb-3 justify-center">
            <span className="w-[22px] h-0.5 bg-accent rounded-full" />
            <Eyebrow>{t.eyebrow}</Eyebrow>
          </div>
          <h2 className="font-display text-[36px] sm:text-[46px] font-semibold tracking-[0.005em] text-ink text-center mb-4 text-balance">
            {t.title}
          </h2>
          <p className={`text-ink-soft text-[15.5px] leading-relaxed text-center ${MEASURE} mb-12`}>
            {t.subtitle}
          </p>
        </Reveal>

        {/* Le rapport n'est plus annoncé ici : la page n'en montre aucun
            exemplaire, n'y donne aucun accès et n'en fait plus la promesse à
            l'achat. Décision du fondateur, ne pas réintroduire. */}
        <Reveal delay={0.05}>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 mb-16">
            {t.sharedFeatures.map((f) => (
              <span key={f} className="flex items-center gap-1.5 text-[12.5px] text-ink-soft">
                <Check size={14} className="text-accent shrink-0" /> {f}
              </span>
            ))}
          </div>
        </Reveal>

        <PricingGrid locale={locale} tiers={TIERS} viewerSeat={viewerSeat} t={t} />
      </div>
    </section>
  );
}
