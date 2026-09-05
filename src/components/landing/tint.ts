import type { CSSProperties } from "react";

// Lavis de teinte : le dégradé qui monte du bas d'une surface et s'éteint aux
// deux tiers de sa hauteur. Repris de la section témoignages et décliné plus
// faiblement sur le reste de la page vitrine.
//
// Le dégradé se termine sur `transparent`, pas sur une couleur de fond. C'est
// délibéré : le lavis se pose donc par-dessus le fond que la surface a déjà
// (blanc, gris de page, blanc semi-transparent d'une pilule) sans qu'on ait à
// le connaître, et une seule fonction sert partout.
//
// Ce sont les teintes décoratives du système, pas l'échelle sémantique des
// scores. Un lavis ne dit rien d'une valeur mesurée : il ne fait que donner du
// relief et différencier. Voir « The Two-Scales Rule » dans DESIGN.md — aucun
// lavis ne doit apparaître dans l'outil de diagnostic.

export const TINT_NAMES = ["lime", "sky", "sand", "clay", "sage"] as const;
export type TintName = (typeof TINT_NAMES)[number];

type WashScale = "section" | "card" | "feature";

// La montée est la même partout : 60 % de la hauteur de la surface, quelle que
// soit sa taille. C'est ce qui fait lire le lavis comme un dégradé plutôt que
// comme un liseré au bas du bloc, et c'est la géométrie de la section
// témoignages. Seule la force varie, et elle décroît avec la taille de la
// surface : sur un grand cadre, une force forte cesse d'être un fond et devient
// un aplat.
//   section  grand cadre blanc d'une section, plusieurs centaines de pixels
//   card     carte ou pilule dans une liste
//   feature  témoignages seulement, le seul endroit à pleine force
const STOP = 60;
const STRENGTH: Record<WashScale, number> = {
  section: 40,
  card: 62,
  feature: 100,
};

export function tintWash(name: TintName, scale: WashScale = "card"): CSSProperties {
  return {
    backgroundImage: `linear-gradient(0deg, color-mix(in srgb, var(--color-tint-${name}) ${STRENGTH[scale]}%, transparent) 0%, transparent ${STOP}%)`,
  };
}
