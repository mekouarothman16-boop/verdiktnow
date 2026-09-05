import { FileText, Gauge, Calculator, LayoutGrid, ListChecks } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "./Reveal";
import { GUTTER, INSET, MEASURE, SHELL } from "./layout";
import { TINT_NAMES, tintWash } from "./tint";
import { JourneyDemo } from "./JourneyDemo";
import { getServerDictionary } from "@/i18n/getDictionary";

const ICONS = [FileText, Gauge, Calculator, LayoutGrid, ListChecks];
// Une teinte par étape : la couleur devient un repère de position dans le
// parcours, pas une décoration. L'échelle sémantique des scores reste intacte.
const TINTS = [
  "bg-tint-lime text-tint-lime-ink",
  "bg-tint-sky text-tint-sky-ink",
  "bg-tint-sand text-tint-sand-ink",
  "bg-tint-clay text-tint-clay-ink",
  "bg-tint-sage text-tint-sage-ink",
];

export async function HowItWorks() {
  const { howItWorks: t } = (await getServerDictionary()).landing;
  return (
    <section id="comment-ca-marche" className={`${GUTTER} py-20 sm:py-28`}>
      <div className={`${SHELL} ${INSET}`}>
        <Reveal>
          <div className="flex items-center gap-2.5 mb-3 justify-center">
            <span className="w-[22px] h-0.5 bg-accent rounded-full" />
            <Eyebrow>{t.eyebrow}</Eyebrow>
          </div>
          <h2 className="font-display text-[36px] sm:text-[46px] font-semibold tracking-[0.005em] text-ink text-center mb-4 text-balance">
            {t.title}
          </h2>
          <p className={`text-ink-soft text-[15.5px] leading-relaxed text-center ${MEASURE} mb-14`}>
            {t.subtitle}
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mb-16">
            <JourneyDemo />
          </div>
        </Reveal>

        {/* En-tête d'étape en pilule échancrée : la tuile d'icône déborde sur le
            contour, et l'anneau de fond découpe l'encoche. Le texte descriptif
            reste hors de la pilule, ce qui allège la lecture par rapport à une
            carte pleine. */}
        {/* Cinq étapes sur trois colonnes laissent la dernière rangée bancale,
            calée à gauche avec un vide à droite. La grille compte donc le double
            de colonnes et chaque étape en occupe deux : la largeur et l'écart
            des étapes ne changent pas d'un pixel, mais la rangée incomplète peut
            se décaler d'une demi-colonne et se centrer. Même correction sur deux
            colonnes, où la cinquième étape se retrouve seule. */}
        <div className="grid sm:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-10">
          {t.steps.map((s, i) => {
            const Icon = ICONS[i];
            const centering =
              i === 3 ? "lg:col-start-2" : i === 4 ? "sm:col-start-2 lg:col-start-auto" : "";
            return (
              <Reveal key={s.n} delay={(i % 3) * 0.08} className={`sm:col-span-2 ${centering}`}>
                <div
                  className="flex items-center gap-4 h-[68px] pl-7 pr-6 rounded-[16px] border border-ink/15 bg-surface/40"
                  style={tintWash(TINT_NAMES[i])}
                >
                  <span
                    className={`w-12 h-12 -ml-11 shrink-0 rounded-[12px] border border-ink/10 flex items-center justify-center shadow-[0_0_0_7px_var(--color-bg)] ${TINTS[i]}`}
                  >
                    <Icon size={20} />
                  </span>
                  <h3 className="font-display text-[19px] font-semibold text-ink flex-1 leading-tight">
                    {s.title}
                  </h3>
                  <span className="font-display text-[22px] font-semibold text-accent/35 tabular-nums shrink-0">
                    {s.n}
                  </span>
                </div>
                <p className="text-[13.5px] text-ink-soft leading-relaxed mt-4 pr-4">{s.text}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
