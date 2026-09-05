import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "./Reveal";
import { GUTTER, INSET, SHELL } from "./layout";
import { tintWash } from "./tint";
import { FillBar } from "./FillBar";
import { getDimensions } from "@/lib/scoring";
import { getServerDictionary, getRootParamsLocale } from "@/i18n/getDictionary";

export async function Methodology() {
  const { methodology: t } = (await getServerDictionary()).landing;
  const DIMENSIONS = getDimensions(await getRootParamsLocale());
  const totalWeight = DIMENSIONS.reduce((s, d) => s + d.weight, 0);
  return (
    <section id="methode" className={`${GUTTER} py-6 sm:py-8`}>
      <div
        className={`${SHELL} ${INSET} bg-surface border border-line rounded-[28px] sm:rounded-[36px] py-16 sm:py-24`}
        style={tintWash("sky", "section")}
      >
        {/* En-tête aligné à gauche : la page alternait huit titres centrés
            d'affilée, ce qui effaçait la frontière entre les sections. */}
        <Reveal>
          <div className="max-w-[680px] mb-14">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-[22px] h-0.5 bg-accent rounded-full" />
              <Eyebrow>{t.eyebrow}</Eyebrow>
            </div>
            <h2 className="font-display text-[36px] sm:text-[46px] font-semibold tracking-[0.005em] text-ink mb-4 text-balance">
              {t.title}
            </h2>
            <p className="text-ink-soft text-[15.5px] leading-relaxed">{t.subtitle}</p>
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-12 lg:gap-20 items-center">
          <Reveal delay={0.05}>
            <div className="bg-bg border border-line rounded-[24px] p-7 shadow-card">
              <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint mb-5">
                {t.weightsCardLabel}
              </div>
              <div className="space-y-4">
                {DIMENSIONS.map((d, i) => (
                  <button
                    key={d.id}
                    type="button"
                    className="group block w-full text-left rounded-[10px] -mx-1 px-1 py-0.5"
                  >
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[13px] text-ink-soft group-hover:text-ink transition-colors">{d.label}</span>
                      <span className="font-mono text-[12.5px] text-accent-deep font-semibold">{d.weight}%</span>
                    </div>
                    <FillBar
                      percent={(d.weight / totalWeight) * 100}
                      fillClassName="bg-accent"
                      delay={0.1 + i * 0.06}
                    />
                    <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
                      <p className="overflow-hidden text-[12px] text-ink-faint leading-relaxed pt-2">{d.reco}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Même pilule échancrée que « Comment ça marche ». Ici la carte est
              posée sur bg-surface, donc l'anneau qui découpe l'encoche prend la
              couleur de la surface et non celle du fond de page. */}
          <Reveal delay={0.12}>
            <div className="grid gap-7">
              {t.steps.map((s) => (
                <div key={s.n}>
                  <div className="flex items-center gap-3.5 h-[56px] pl-6 pr-5 rounded-[16px] border border-ink/15">
                    <span className="w-10 h-10 -ml-9 shrink-0 rounded-[12px] bg-accent-soft border border-accent/20 flex items-center justify-center font-display text-[13px] font-semibold text-accent-deep shadow-[0_0_0_6px_var(--color-surface)]">
                      {s.n}
                    </span>
                    <h3 className="font-display text-[16px] font-semibold text-ink leading-tight">{s.title}</h3>
                  </div>
                  <p className="text-[13.5px] text-ink-soft leading-relaxed mt-3">{s.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
