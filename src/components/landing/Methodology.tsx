import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "./Reveal";
import { getDimensions } from "@/lib/scoring";
import { getServerDictionary, getRootParamsLocale } from "@/i18n/getDictionary";

export async function Methodology() {
  const { methodology: t } = (await getServerDictionary()).landing;
  const DIMENSIONS = getDimensions(await getRootParamsLocale());
  const totalWeight = DIMENSIONS.reduce((s, d) => s + d.weight, 0);
  return (
    <section id="methode" className="bg-surface border-y border-line">
      <div className="max-w-[1160px] mx-auto px-5 sm:px-6 py-20 sm:py-28">
        <Reveal>
          <div className="flex items-center gap-2.5 mb-3 justify-center">
            <span className="w-[22px] h-0.5 bg-accent rounded-full" />
            <Eyebrow>{t.eyebrow}</Eyebrow>
          </div>
          <h2 className="font-display text-[36px] sm:text-[46px] font-extrabold tracking-[-0.015em] text-ink text-center mb-4 text-balance">
            {t.title}
          </h2>
          <p className="text-ink-soft text-[15.5px] leading-relaxed text-center max-w-[640px] mx-auto mb-14">
            {t.subtitle}
          </p>
        </Reveal>

        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-12 items-center max-w-[980px] mx-auto">
          <Reveal delay={0.05}>
            <div className="bg-bg border border-line rounded-2xl p-7 shadow-card">
              <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint mb-5">
                {t.weightsCardLabel}
              </div>
              <div className="space-y-4">
                {DIMENSIONS.map((d) => (
                  <div key={d.id}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[13px] text-ink-soft">{d.label}</span>
                      <span className="font-mono text-[12.5px] text-accent-deep font-semibold">{d.weight}%</span>
                    </div>
                    <div className="h-1.5 bg-line-soft rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${(d.weight / totalWeight) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="grid gap-6">
              {t.steps.map((s) => (
                <div key={s.n} className="flex gap-4">
                  <span className="font-mono text-xs text-accent font-semibold shrink-0 mt-0.5">{s.n}</span>
                  <div>
                    <h3 className="font-sans text-[15px] font-semibold text-ink mb-1">{s.title}</h3>
                    <p className="text-[13.5px] text-ink-soft leading-relaxed">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
