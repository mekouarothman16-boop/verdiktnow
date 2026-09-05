import { TriangleAlert, Gauge, LayoutGrid, Calculator, SlidersHorizontal } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "./Reveal";
import { GUTTER, INSET, SHELL } from "./layout";
import { TINT_NAMES, tintWash } from "./tint";
import { getServerDictionary } from "@/i18n/getDictionary";

// Fusion des anciennes sections « Les promesses » et « Pourquoi diagnostiquer ».
//
// Les deux disaient sept arguments dont deux paires étaient des doublons exacts
// (le dossier d'affaires chiffré, et la matrice qui priorise), parce qu'elles
// répondaient à deux questions voisines : pourquoi diagnostiquer, et pourquoi
// nous faire confiance. Les fusionner en gardant simplement quatre items sur
// sept aurait perdu cette distinction.
//
// La structure en paires règle le problème par la forme : un argument ne peut
// plus apparaître deux fois sous deux angles, puisque le risque et sa réponse
// sont sur la même ligne. Pas de numérotation : ce ne sont pas des étapes, rien
// n'impose de les lire dans l'ordre.
const ANSWER_ICONS = [Gauge, LayoutGrid, Calculator, SlidersHorizontal];

export async function Risks() {
  const { risks: t } = (await getServerDictionary()).landing;
  return (
    <section className={`${GUTTER} py-6 sm:py-8`}>
      <div
        className={`${SHELL} ${INSET} bg-surface border border-line rounded-[28px] sm:rounded-[36px] py-16 sm:py-24`}
        style={tintWash("sage", "section")}
      >
        <Reveal>
          <div className="flex items-center gap-2.5 mb-3 justify-center">
            <span className="w-[22px] h-0.5 bg-accent rounded-full" />
            <Eyebrow>{t.eyebrow}</Eyebrow>
          </div>
          <h2 className="font-display text-[36px] sm:text-[46px] font-semibold tracking-[0.005em] text-ink text-center mb-14 text-balance">
            {t.title}
          </h2>
        </Reveal>

        <div className="grid gap-5">
          {t.pairs.map((p, i) => {
            const AnswerIcon = ANSWER_ICONS[i];
            return (
              <Reveal key={p.risk} delay={i * 0.06}>
                {/* Une carte par paire, coupée en deux. La moitié gauche est en
                    creux sur le fond de page, la droite est la surface élevée
                    avec le lavis : le problème s'enfonce, la réponse ressort. */}
                <div className="grid lg:grid-cols-2 rounded-[16px] border border-line overflow-hidden">
                  <div className="bg-bg p-6 sm:p-7 flex items-start gap-4">
                    <span className="w-9 h-9 shrink-0 rounded-[10px] bg-surface border border-line flex items-center justify-center">
                      <TriangleAlert size={17} className="text-ink-faint" />
                    </span>
                    <div>
                      <h3 className="font-display text-[17px] font-semibold tracking-[0.005em] text-ink-soft mb-2 leading-tight">
                        {p.risk}
                      </h3>
                      <p className="text-[13.5px] text-ink-faint leading-relaxed">{p.riskText}</p>
                    </div>
                  </div>

                  <div
                    className="bg-surface border-t lg:border-t-0 lg:border-l border-line p-6 sm:p-7 flex items-start gap-4"
                    style={tintWash(TINT_NAMES[i])}
                  >
                    <span className="w-9 h-9 shrink-0 rounded-[10px] bg-accent-soft border border-accent/20 flex items-center justify-center">
                      <AnswerIcon size={17} className="text-accent-deep" />
                    </span>
                    <div>
                      <h3 className="font-display text-[17px] font-semibold tracking-[0.005em] text-ink mb-2 leading-tight">
                        {p.answer}
                      </h3>
                      <p className="text-[13.5px] text-ink-soft leading-relaxed">{p.answerText}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Les six signaux sont le détail concret de la première paire : ce que
            le score d'aptitude repère réellement. */}
        <Reveal delay={0.2}>
          <div className="mt-14 text-center">
            <Eyebrow className="mb-4">{t.signalsLabel}</Eyebrow>
            <div className="flex flex-wrap justify-center gap-2.5">
              {t.signals.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-bg border border-line text-[12.5px] text-ink-soft font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  {s}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* La comparaison de coût ferme la section : c'est le seul argument
            qu'aucune paire ne porte, et il vaut mieux en dernier. */}
        <Reveal delay={0.26}>
          <div className="mt-14 pt-10 border-t border-line text-center">
            <p className="text-[13px] text-ink-soft leading-relaxed max-w-[560px] mx-auto mb-8">
              {t.costIntro}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
              <div>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-faint mb-2">
                  {t.costVendorLabel}
                </div>
                <div className="font-display text-[26px] sm:text-[30px] font-extrabold text-ink-faint line-through decoration-line">
                  {t.costVendorValue}
                </div>
              </div>
              <div className="font-display text-[15px] font-semibold text-accent shrink-0">vs</div>
              <div>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-accent mb-2">
                  {t.costVerdiktNowLabel}
                </div>
                <div className="font-display text-[26px] sm:text-[30px] font-extrabold text-ink">
                  {t.costVerdiktNowValue}
                </div>
              </div>
            </div>
            <p className="text-[10.5px] text-ink-faint mt-6 leading-relaxed">{t.costSource}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
