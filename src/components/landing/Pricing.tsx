import { Check, FileText } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "./Reveal";
import { GUTTER, INSET, MEASURE, SHELL } from "./layout";
import { tintWash } from "./tint";
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
          <p className={`text-ink-soft text-[15.5px] leading-relaxed text-center ${MEASURE} mb-4`}>
            {t.subtitle}
          </p>
        </Reveal>

        {/* Le rapport est ce que l'acheteur emporte : l'énoncé garde sa place au
            moment de la décision, mais la page n'en montre aucun exemplaire et
            n'y donne aucun accès. Décision du fondateur, ne pas réintroduire de
            lien vers un PDF exemple. */}
        <Reveal delay={0.04}>
          <div
            className="flex items-start sm:items-center gap-5 bg-surface border border-line rounded-[16px] p-6 sm:p-7 mb-14 mt-2"
            style={tintWash("sand")}
          >
            <span className="w-12 h-12 shrink-0 rounded-[12px] bg-accent-soft border border-accent/20 flex items-center justify-center">
              <FileText size={20} className="text-accent-deep" />
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-[19px] font-semibold tracking-[0.005em] text-ink mb-1.5 text-balance">
                {t.reportTitle}
              </h3>
              <p className="text-[13.5px] text-ink-soft leading-relaxed">{t.reportText}</p>
            </div>
          </div>
        </Reveal>

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
