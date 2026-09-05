import { LayoutGrid } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Matrix } from "@/components/app/Matrix";
import { getLevels } from "@/lib/scoring";
import { Reveal } from "./Reveal";
import { GUTTER, INSET, SHELL } from "./layout";
import { getServerDictionary, getRootParamsLocale } from "@/i18n/getDictionary";

// Vitrine produit, composition reprise de tonnect.io : un cadre teinté, le
// produit posé dedans, et une carte qui flotte par-dessus son coin en portant
// le résultat marquant.
//
// La matrice affichée n'est pas une capture d'écran mais le composant `Matrix`
// de l'outil, rendu en direct. C'est volontaire : une capture se périme dès la
// première retouche du produit et se pixellise sur écran dense, alors que le
// composant reste net, suit le thème et ne peut pas mentir sur ce que l'outil
// affiche vraiment. `Matrix` n'a ni état ni requête, il se rend donc côté
// serveur sans rien tirer avec lui.
//
// Les valeurs sont un exemple, signalé comme tel dans le cadre. Ne jamais les
// présenter comme des données d'un client : voir PRODUCT.md.
const DEMO = { value: 72, aptitude: 78 };

// Mêmes couleurs que les quadrants de la matrice, dans le même ordre de
// lecture : la légende ne réinvente rien, elle nomme ce que le graphique
// montre déjà.
const QUADRANTS = [
  { key: "quadrantAutomate", color: "var(--color-accent)" },
  { key: "quadrantPlan", color: "var(--color-olive-tint)" },
  { key: "quadrantPrepare", color: "var(--color-amber-tint)" },
  { key: "quadrantSetAside", color: "var(--color-coral-tint)" },
] as const;

export async function ToolShowcase() {
  const locale = await getRootParamsLocale();
  const dict = await getServerDictionary();
  const t = dict.landing.showcase;
  const matrixLabels = dict.tool.portfolioMatrix;
  const level = getLevels(locale)[3];

  return (
    <section className={`${GUTTER} py-20 sm:py-28`}>
      <div className={`${SHELL} ${INSET}`}>
        <Reveal>
          <div className="max-w-[680px] mx-auto text-center mb-12">
            <div className="flex items-center gap-2.5 mb-3 justify-center">
              <span className="w-[22px] h-0.5 bg-accent rounded-full" />
              <Eyebrow>{t.eyebrow}</Eyebrow>
            </div>
            <h2 className="font-display text-[36px] sm:text-[46px] font-semibold tracking-[0.005em] text-ink mb-4 text-balance">
              {t.title}
            </h2>
            <p className="text-ink-soft text-[15.5px] leading-relaxed">{t.subtitle}</p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          {/* Le cadre s'arrête avant le bord de la colonne : la carte flottante
              déborde dans l'espace restant, comme sur la référence. Un cadre
              pleine largeur laisserait une zone teintée vide à droite. */}
          {/* Teinte en aplat et non en lavis, seul endroit du site où c'est le
              cas. Le lavis est fait pour une surface qui porte du texte, qui
              doit rester sur son fond clair ; ce cadre ne porte que le panneau
              blanc, et il a besoin de trancher franchement sur le fond de page
              pour que le produit se détache. */}
          <div className="relative lg:max-w-[980px] lg:mx-auto rounded-[28px] sm:rounded-[36px] bg-tint-sky p-5 sm:p-10">
            <div className="bg-surface border border-line rounded-[24px] shadow-card-lg overflow-hidden">
              {/* En pile sous sm : à 375 px, le badge écrasait le libellé et le
                  nom du processus tombait à deux caractères. */}
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 px-6 py-4 border-b border-line-soft">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 shrink-0 rounded-[10px] bg-accent-soft border border-accent/20 flex items-center justify-center">
                    <LayoutGrid size={17} className="text-accent-deep" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-faint">
                      {t.panelLabel}
                    </div>
                    <div className="font-sans text-[14px] font-semibold text-ink truncate">
                      {t.processName}
                    </div>
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-faint px-2.5 py-1 rounded-full border border-line">
                  {t.exampleNote}
                </span>
              </div>
              <div className="p-6 sm:p-8 grid lg:grid-cols-[1fr_240px] gap-8 lg:gap-10 items-start">
                <Matrix
                  V={DEMO.value}
                  A={DEMO.aptitude}
                  name={t.processName}
                  show
                  labels={matrixLabels}
                />
                {/* Légende des quadrants, reprise des mêmes libellés que la
                    matrice : elle occupe la colonne de droite et explique le
                    graphique au lieu de laisser du vide. */}
                <div className="lg:pt-2">
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-faint mb-4">
                    {t.legendLabel}
                  </div>
                  <ul className="grid gap-2.5">
                    {QUADRANTS.map((q) => {
                      const active = q.key === "quadrantAutomate";
                      return (
                        <li
                          key={q.key}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[12.5px] ${
                            active
                              ? "bg-accent-soft border border-accent/20 text-ink font-semibold"
                              : "text-ink-soft"
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 shrink-0 rounded-[3px]"
                            style={{ background: q.color, opacity: active ? 1 : 0.45 }}
                          />
                          {matrixLabels[q.key]}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>

            {/* Carte flottante : elle ne chevauche le coin du panneau qu'à
                partir de xl. En dessous, le panneau est trop court et la carte
                recouvrait le dernier quadrant de la légende ; elle repasse donc
                simplement sous le cadre. */}
            <div className="mt-5 xl:mt-0 xl:absolute xl:bottom-12 xl:-right-10 xl:w-[340px]">
              <div className="bg-surface rounded-[24px] shadow-card-lg border border-line p-7">
                <div className="flex items-center gap-4 mb-6">
                  <span className="w-14 h-14 shrink-0 rounded-[16px] bg-accent-soft border border-accent/20 flex items-center justify-center">
                    <LayoutGrid size={24} className="text-accent-deep" />
                  </span>
                  <span
                    className="px-3 py-1.5 rounded-full text-white font-display text-[12.5px] font-semibold"
                    style={{ background: level.color }}
                  >
                    {level.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-[56px] font-extrabold tracking-[-0.02em] text-ink leading-none tabular-nums">
                    {DEMO.aptitude}
                  </span>
                  <span className="font-display text-[20px] font-semibold text-ink-faint">/100</span>
                </div>
                <p className="text-[12.5px] text-ink-faint mt-2">{t.scoreCaption}</p>
                <div className="mt-5 pt-5 border-t border-line-soft">
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-faint mb-1.5">
                    {t.verdictIntro}
                  </div>
                  <div className="font-display text-[19px] font-semibold tracking-[0.005em] text-ink leading-tight">
                    {matrixLabels.quadrantAutomate}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
