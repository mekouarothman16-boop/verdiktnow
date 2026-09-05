import { Sparkles, Kanban, Printer } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "./Reveal";
import { GUTTER, INSET, SHELL } from "./layout";
import { tintWash } from "./tint";
import { RoadmapPreview } from "./RoadmapPreview";
import { getServerDictionary } from "@/i18n/getDictionary";

// Trois points seulement : la double pondération est montrée par la carte des
// poids de « Comment le score est calculé », et le dossier d'affaires chiffré
// comme la méthode transparente sont déjà les réponses des paires 3 et 4 de
// « Quatre risques ». Ne restent ici que les trois choses qui n'apparaissent
// nulle part ailleurs sur la page.
const ICONS = [Sparkles, Kanban, Printer];
// Teintes décoratives en rotation : elles donnent du relief à la grille sans
// toucher à l'échelle sémantique des scores.
const TINTS = [
  "bg-tint-lime text-tint-lime-ink",
  "bg-tint-sky text-tint-sky-ink",
  "bg-tint-sand text-tint-sand-ink",
  "bg-tint-clay text-tint-clay-ink",
  "bg-tint-sage text-tint-sage-ink",
];

export async function Features() {
  const { features: t } = (await getServerDictionary()).landing;
  return (
    <section id="fonctionnalites" className={`${GUTTER} py-6 sm:py-8`}>
      <div
        className={`${SHELL} ${INSET} bg-surface border border-line rounded-[28px] sm:rounded-[36px] py-16 sm:py-24`}
        style={tintWash("sand", "section")}
      >
        {/* Aligné à gauche, comme la méthode : la grille d'icônes commence au
            bord gauche, le titre a toutes les raisons d'y commencer aussi. */}
        <Reveal>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-[22px] h-0.5 bg-accent rounded-full" />
            <Eyebrow>{t.eyebrow}</Eyebrow>
          </div>
          <h2 className="font-display text-[36px] sm:text-[46px] font-semibold tracking-[0.005em] text-ink mb-16 text-balance max-w-[680px]">
            {t.title}
          </h2>
        </Reveal>

        {/* La feuille de route réelle, avant la liste : c'était la seule
            section de la page sans aucun visuel, et elle démontre à elle seule
            plusieurs des points énumérés en dessous. */}
        <Reveal delay={0.06}>
          <div className="mb-16">
            <Eyebrow className="mb-4">{t.ganttEyebrow}</Eyebrow>
            <RoadmapPreview />
          </div>
        </Reveal>

        {/* Trois colonnes d'un coup à partir de md : à deux colonnes, trois
            points laisseraient une rangée orpheline. */}
        <div className="grid md:grid-cols-3 gap-x-10 gap-y-12">
          {t.items.map((f, i) => {
            const Icon = ICONS[i];
            return (
              <Reveal key={f.title} delay={(i % 3) * 0.08}>
                <div className="flex gap-4">
                  <div className={`w-11 h-11 shrink-0 rounded-[10px] border border-ink/10 flex items-center justify-center ${TINTS[i % TINTS.length]}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-sans text-[15.5px] font-semibold text-ink mb-1.5">{f.title}</h3>
                    <p className="text-[13.5px] text-ink-soft leading-relaxed">{f.text}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
