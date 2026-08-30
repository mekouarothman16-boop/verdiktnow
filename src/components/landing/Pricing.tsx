import { Check, FileText } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "./Reveal";
import { PricingGrid } from "./PricingGrid";
import { getTiers, getViewerSeat } from "@/lib/plans";
import { getServerDictionary, getRootParamsLocale } from "@/i18n/getDictionary";

export async function Pricing() {
  const locale = await getRootParamsLocale();
  const TIERS = getTiers(locale);
  const viewerSeat = getViewerSeat(locale);
  const { pricing: t } = (await getServerDictionary()).landing;
  return (
    <section id="tarifs" className="max-w-[1160px] mx-auto px-5 sm:px-6 py-20 sm:py-28">
      <Reveal>
        <div className="flex items-center gap-2.5 mb-3 justify-center">
          <span className="w-[22px] h-0.5 bg-accent rounded-full" />
          <Eyebrow>{t.eyebrow}</Eyebrow>
        </div>
        <h2 className="font-display text-[36px] sm:text-[46px] font-extrabold tracking-[-0.015em] text-ink text-center mb-4 text-balance">
          {t.title}
        </h2>
        <p className="text-ink-soft text-[15.5px] leading-relaxed text-center max-w-[560px] mx-auto mb-4">
          {t.subtitle}
        </p>
        <div className="text-center mb-8">
          <a
            href={locale === "en" ? "/example-report-cadran.pdf" : "/exemple-rapport-cadran.pdf"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-accent hover:underline"
          >
            <FileText size={14} /> {t.sampleReportLink}
          </a>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 mb-16 max-w-[840px] mx-auto">
          {t.sharedFeatures.map((f) => (
            <span key={f} className="flex items-center gap-1.5 text-[12.5px] text-ink-soft">
              <Check size={14} className="text-accent shrink-0" /> {f}
            </span>
          ))}
        </div>
      </Reveal>

      <PricingGrid locale={locale} tiers={TIERS} viewerSeat={viewerSeat} t={t} />
    </section>
  );
}
