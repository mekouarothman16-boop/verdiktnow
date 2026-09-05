---
name: VerdiktNow
description: Outil-méthode SaaS pour diagnostiquer, chiffrer et prioriser l'automatisation d'un processus métier
colors:
  accent: "#55631a"
  accent-deep: "#3d4712"
  accent-soft: "#f2ffd9"
  accent-vivid: "#d7ff53"
  bg: "#e9ecea"
  surface: "#ffffff"
  ink: "#091315"
  ink-soft: "#686464"
  ink-faint: "#656b6b"
  line: "#d7dbd8"
  line-soft: "#e2e5e2"
  gold: "#83641f"
  gold-tint: "#c9a227"
  gold-soft: "#f7efdc"
  status-coral: "#c45033"
  status-amber: "#9a6c1b"
  status-olive: "#6b7d31"
  status-teal: "#348269"
  tint-lime: "#f2ffd9"
  tint-lime-ink: "#3d4712"
  tint-sky: "#dfeaf2"
  tint-sky-ink: "#2b5a72"
  tint-sand: "#f7efdc"
  tint-sand-ink: "#7a5c1c"
  tint-clay: "#f9e5dd"
  tint-clay-ink: "#a04a30"
  tint-sage: "#dfece5"
  tint-sage-ink: "#2f6a56"
typography:
  display:
    fontFamily: "Outfit, Inter, system-ui, sans-serif"
    fontWeight: 600
    letterSpacing: "0.005em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 400
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 600
    letterSpacing: "0.03em to 0.1em"
rounded:
  pill: "9999px"
  control-inner: "6px"
  tile: "10px"
  control: "12px"
  card: "16px"
  panel: "24px"
  section: "28px mobile / 36px desktop"
  feature: "32px card / 40px container"
spacing:
  section-y-mobile: "64px"
  section-y-desktop: "112px"
components:
  button-primary:
    backgroundColor: "{colors.accent-vivid}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
  button-primary-hover:
    backgroundColor: "{colors.accent-vivid}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
  badge-accent:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-deep}"
    rounded: "{rounded.pill}"
---

# Design System: VerdiktNow

## Overview

**Creative North Star: "Le Feu Vert" (The Green Light)**

VerdiktNow dit à un décideur si un processus est prêt à automatiser — un verdict binaire dans l'esprit, même si le score est nuancé. Le système visuel emprunte donc au vocabulaire du feu vert / signal « GO » : un accent chartreuse vif et non ambigu, posé sur un fond neutre sobre et une encre presque noire. C'est délibérément l'esthétique d'un SaaS moderne et énergique plutôt que celle d'un rapport d'ingénierie — remplace le précédent système « instrument de précision » (Bricolage Grotesque + IBM Plex Mono + terracotta) sur décision explicite du fondateur, en adoptant la direction visuelle du gabarit Framer ERPSAA (erpsaas.framer.website).

Le produit reste destiné à des décideurs qui doivent défendre un dossier d'affaires, mais l'esthétique choisie privilégie maintenant l'impact marketing et la modernité perçue sur la retenue éditoriale. Rejets confirmés : police serif, mascotte/illustration ludique, plus d'une couleur de marque vive à la fois hors de l'accent chartreuse.

**Key Characteristics:**
- Fond gris-vert clair neutre, encre presque noire, un accent chartreuse vif unique (remplissage uniquement, jamais en texte)
- Titres en Outfit (grotesque géométrique), texte courant en Inter
- Coins de carte généreux (16–24px), boutons et badges en pilule complète
- Le cadran semi-circulaire reste la signature visuelle du score d'aptitude, recoloré à la nouvelle palette

## Colors

Palette à accent unique inspirée d'ERPSAA : fond neutre gris-vert clair, encre presque noire pour le texte et les surfaces sombres, chartreuse vif réservé aux remplissages (boutons, jauge, badges de statut actif) — jamais utilisé comme couleur de texte, car illisible sur fond clair. Une échelle sémantique séparée reste réservée aux cinq niveaux d'aptitude.

### Primary
- **Chartreuse vif** (`#d7ff53` / accent-vivid) : remplissage des boutons primaires, remplissage de la jauge, badges de sélection actifs. Toujours accompagné de texte `ink` (encre foncée) dessus, jamais de texte clair. Jamais utilisé comme couleur de texte sur fond clair — contraste insuffisant.
- **Mousse foncée** (`#55631a` / accent) : usage textuel de l'accent — liens, icônes actives, surlignage de titre. Même famille de teinte que le chartreuse, calibré pour ≥4.5:1 sur blanc/fond.
- **Mousse profonde** (`#3d4712` / accent-deep) : texte sur fond accent-soft, états hover appuyés.
- **Chartreuse tint** (`#f2ffd9` / accent-soft) : fond de badge, halo doux derrière un élément mis en avant.

### Secondary
- **Laiton** (`#83641f` / gold), **laiton tint** (`#c9a227`), **laiton soft** (`#f7efdc`) : réservé aux signaux de palier payant (icône cadenas, badge « Croissance »). Ne jamais l'utiliser comme accent général ni en décoration marketing.

### Decorative tints
Famille de cinq fonds sourds destinés aux **tuiles d'icônes** des pages vitrine, ajoutée pour donner du relief aux sections répétitives sans emprunter à l'échelle sémantique. Chaque teinte est appariée à une encre calibrée pour rester lisible dessus ; les deux vont toujours ensemble.

- **Lime** (`#f2ffd9` / tint-lime) avec encre `#3d4712` — reprend `accent-soft`, assure la continuité avec la marque.
- **Ciel** (`#dfeaf2` / tint-sky) avec encre `#2b5a72`.
- **Sable** (`#f7efdc` / tint-sand) avec encre `#7a5c1c`.
- **Argile** (`#f9e5dd` / tint-clay) avec encre `#a04a30`.
- **Sauge** (`#dfece5` / tint-sage) avec encre `#2f6a56`.

Employées en rotation le long d'une liste (une teinte par étape, par promesse, par fonctionnalité), la couleur sert alors de repère de position et non d'ornement. Direction visuelle inspirée de tonnect.io, transposée dans la palette VerdiktNow.

#### Le lavis de teinte
Sur les pages vitrine, une teinte décorative ne s'applique jamais en aplat sur une grande surface : elle s'applique en **lavis**, un dégradé qui monte du bas et s'éteint aux deux tiers de la hauteur (`linear-gradient(0deg, teinte, transparent)`). Le texte se lit donc toujours sur le fond clair d'origine, en haut de la surface. Le dégradé se termine sur `transparent` et non sur une couleur de fond, ce qui permet de le poser sur n'importe quelle surface sans connaître son fond.

**La montée est la même partout : 60 % de la hauteur, quelle que soit la taille de la surface.** C'est ce qui fait lire le lavis comme un dégradé et non comme un liseré au bas du bloc, et c'est la géométrie de la section témoignages. Une montée courte donne une bande de couleur collée au bord, pas un dégradé.

Seule la force varie, et elle décroît avec la taille de la surface : sur un grand cadre, une force forte cesse d'être un fond et devient un aplat.

- **section** (40 %) : le grand cadre blanc d'une section. Une seule teinte par section.
- **card** (62 %) : carte ou pilule dans une liste. Quand l'élément porte déjà une teinte (tuile d'icône), le lavis reprend la même — la couleur différencie l'élément, elle ne se contredit pas à l'intérieur.
- **feature** (100 %) : réservé à la section témoignages, seul endroit de la page à pleine force. C'est cet écart qui en fait un point d'arrêt ; le banaliser ailleurs le détruirait.

Implémentation unique dans `src/components/landing/tint.ts`. Ne pas réécrire un dégradé à la main dans un composant.

**Une seule exception au lavis : le cadre de la vitrine produit** (`ToolShowcase`), qui porte la teinte en aplat. La règle du lavis existe pour qu'un texte reste sur son fond clair d'origine ; ce cadre ne contient aucun texte, seulement le panneau blanc de l'outil, et il doit trancher franchement sur le fond de page pour que le produit se détache. Une surface qui ne porte pas de texte peut donc prendre l'aplat. Toute autre surface prend le lavis.

### Neutral
- **Gris-vert clair** (`#e9ecea` / bg) : fond de page.
- **Blanc** (`#ffffff` / surface) : cartes et surfaces élevées.
- **Encre** (`#091315` / ink) : texte principal, fond des sections sombres, texte sur remplissage chartreuse.
- **Encre douce** (`#686464` / ink-soft) : texte secondaire, libellés de champ.
- **Encre estompée** (`#656b6b` / ink-faint) : légendes, texte tertiaire, icônes inertes. Calibré pour un contraste ≥4.5:1 sur les deux fonds du système, blanc ET gris de page : 5.43:1 sur `surface`, 4.56:1 sur `bg`. La valeur précédente (`#6d7373`) passait sur blanc (4.83:1) mais échouait sur le fond de page (4.06:1), ce qui touchait toute légende posée hors carte.
- **Ligne** (`#d7dbd8` / line) et **ligne douce** (`#e2e5e2` / line-soft) : bordures de carte et séparateurs.

### Named Rules
**The Fill-Not-Text Rule.** Le chartreuse vif (`accent-vivid`) ne sert JAMAIS de couleur de texte ou de bordure fine — seulement de remplissage plein (bouton, jauge, badge actif), toujours avec du texte `ink` dessus. Pour un accent textuel (lien, icône, surlignage), utiliser `accent` (la variante mousse foncée), jamais `accent-vivid` directement.

**The Status-Is-Not-Brand Rule.** `status-coral`, `status-amber`, `status-olive` et `status-teal` forment l'échelle de progression du diagnostic (peu adapté → candidat idéal). Elles ne doivent jamais habiller un bouton, un lien ou un élément de navigation — seulement un score, un badge de niveau ou une pastille de statut.

**The Two-Scales Rule.** Deux familles colorées coexistent et ne se croisent jamais. L'échelle **sémantique** (`status-*`) dit quelque chose de vrai sur une valeur mesurée : un score, un niveau, un état. L'échelle **décorative** (`tint-*`) ne dit rien, elle ne fait que différencier des éléments de même nature dans une liste. Colorer une tuile décorative avec `status-amber` rendrait indistinguables un badge « niveau 3 » et une simple icône ; colorer un badge de niveau avec `tint-sand` lui ferait perdre son sens. Une teinte décorative n'apparaît jamais dans l'outil de diagnostic, où toute couleur doit se lire comme un signal.

## Typography

**Display Font:** Outfit (avec repli Inter, system-ui)
**Body Font:** Inter (avec repli system-ui)
**Label Font:** Inter, semi-gras, tracking large — la distinction « chiffre = police mono » de l'ancien système est abandonnée ; tout le texte, chiffres inclus, est en Inter.

### Named Rules
**The One-Voice Rule.** Tous les titres du site, vitrine et application confondues, sont en graisse **600** avec une chasse **positive de 0.005em**. Pas de 700, pas de 800, jamais de chasse négative. Le gras serré vient de l'ancien système « instrument de précision » abandonné au passage à VerdiktNow ; il faisait lire l'outil et la vitrine comme deux produits différents.

Deux exceptions, et seulement deux, parce que ce ne sont pas des titres :
- le **logotype** « VerdiktNow », en 800 avec +0.01em, parce que c'est une marque ;
- les **chiffres vedettes** (les statistiques de la page d'accueil, les montants comparés), en 800 avec une chasse négative, parce qu'un grand nombre se lit mieux dense et que l'affaiblir le ferait passer pour du texte courant.

**Character:** Un grotesque géométrique moderne (Outfit, poids 600) pour les titres, posé sur un texte courant Inter très lisible — direction SaaS contemporaine, pas instrument de mesure.

### Hierarchy
- **Display** (600, 28–66px selon le contexte, tracking -0.01em à -0.02em) : titres de section, montant vedette du calculateur de ROI.
- **Headline** (600–700, 21–28px) : titres de carte, verdicts de priorisation.
- **Title** (600, 15–16px) : en-têtes de composant, noms de champ mis en valeur.
- **Body** (400, 13–15px, line-height confortable) : texte courant, descriptions, notes explicatives.
- **Label** (600, 10–12px, tracking 0.03em à 0.1em, souvent majuscules) : eyebrows, unités, libellés d'axe, badges.

## Layout

Rail unique, défini une seule fois dans `src/components/ui/rail.ts` : gouttière `px-4 sm:px-8`, coque `max-w-[1320px]`, rembourrage intérieur `px-5 sm:px-10 lg:px-14`. Colonne de contenu résultante : 1208px sur grand écran.

**Chrome aligné, contenu mesuré.** Les barres d'en-tête de toutes les pages, vitrine comme application, posent leur contenu sur ce rail : c'est ce qui empêche le logo de sauter horizontalement quand on passe de la page d'accueil à l'outil. Le contenu sous l'en-tête garde en revanche la mesure qui convient à sa nature : 760px pour une page légale, 900px pour un formulaire de compte, 1160px pour l'outil, 1500px pour la feuille de route.

Rythme vertical généreux entre sections (64px en mobile, jusqu'à 112px en desktop sur les pages vitrine). Grilles à 2 colonnes fréquentes pour les paires champ/valeur ; la matrice de priorisation et les cartes de portefeuille passent en pile unique sous le breakpoint `sm`.

### Named Rules
**The One-Rail Rule.** Une seule largeur de coque pour tout le chrome du site, importée de `rail.ts`. Ne jamais réintroduire un `max-w-[...]` en dur sur une barre d'en-tête ou un bloc de section : c'est ainsi que sept largeurs différentes se sont installées et que les pages ont cessé de s'aligner entre elles.

## Elevation & Depth

Système à deux paliers seulement, pas de rampe d'élévation étendue. Les surfaces sont blanches sur fond gris-vert clair avec une ombre douce — la profondeur vient du contraste de fond, pas d'ombres marquées.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 1px 2px rgba(9,19,21,0.04), 0 6px 20px rgba(9,19,21,0.05)`) : cartes au repos.
- **Card Large** (`box-shadow: 0 4px 10px rgba(9,19,21,0.05), 0 18px 46px rgba(9,19,21,0.08)`) : cartes flottantes ou mises en avant (panneau de résultat ROI, popovers).

### Named Rules
**The Two-Shadow Rule.** Il n'existe que deux valeurs d'ombre dans tout le système. N'en introduisez jamais une troisième pour un besoin ponctuel — choisissez la plus proche des deux, ou retirez l'ombre.

## Shapes

Jeu de rayons **fermé**. Chaque valeur a un emploi et un seul ; aucune autre valeur n'existe dans le code.

| Rayon | Emploi |
|---|---|
| pilule | boutons, badges, pastilles, barres de progression |
| 6px | contrôle imbriqué dans un conteneur à 10px (onglets segmentés) |
| 10px | tuiles d'icône, tuile du logo, petits champs en ligne, barres de Gantt |
| 12px | champs, sélecteurs, encarts d'information |
| 16px | carte dans une liste, panneau |
| 24px | panneau autonome (carte du hero, cartes de forfait, bloc noir) |
| 28 / 36px | cadre de section, mobile / desktop |
| 32 / 40px | bloc témoignages seulement, carte / conteneur |

Bordures fines de 1px en `line`/`line-soft`, jamais de bordure épaisse ou de double contour.

### Named Rules
**The One-Pill Rule.** Tout ce sur quoi on clique pour déclencher une action est une pilule à rayon complet, à toutes les tailles et sur toutes les pages : bouton primaire, bouton secondaire, bouton fantôme, badge, pastille. Un bouton à coin arrondi est un champ de saisie déguisé ; l'utilisateur qui passe de la vitrine à l'outil doit retrouver le même objet. Les champs, eux, gardent un coin doux : c'est la seule chose qui les distingue d'un bouton.

## Components

### Buttons
- **Shape:** boutons primaires en pilule (rayon complet) ; contrôles de formulaire en coin doux (10–14px).
- **Primary:** fond `accent-vivid` (chartreuse), texte `ink`, `hover:brightness-95`.
- **Secondary / Ghost:** bordure `line`, fond `surface`, texte `ink-soft`, hover vers `accent-soft` + bordure `accent/25`.
- **Focus:** `outline: 2px solid var(--color-accent)` avec 2px d'offset sur tout élément focusable — jamais de ring Tailwind par défaut.

### Chips / Badges
- **Style:** fond `accent-soft`, texte `accent-deep`, bordure `accent` si sélectionné ; fond neutre `line-soft`/`ink-faint` sinon. Rayon complet.
- **State:** sélectionné vs non sélectionné (contexte : réglementations, dépendances de processus) ; jamais plus de deux états visuels sur un même chip.

### Cards / Containers
- **Corner Style:** 16–24px.
- **Background:** `surface` sur fond `bg`.
- **Shadow Strategy:** `--shadow-card` au repos, `--shadow-card-lg` pour les panneaux mis en avant.
- **Border:** 1px `line`, optionnel selon le contexte.
- **Internal Padding:** 20–24px (p-5/p-6).

### Inputs / Fields
- **Style:** bordure 1px `line`, fond `surface`, coin ~12px.
- **Focus:** bordure `accent` (`focus-within:border-accent`), pas de glow.
- **Hint:** icône `ⓘ` (Info/AlertCircle) cliquable ou survolable ouvrant une bulle sombre (`bg-ink`, texte blanc) — jamais de tooltip natif `title` seul, pour rester accessible au tactile.

### Navigation
- Onglets horizontaux, libellé + icône, actif en `ink`/`accent`, inactif en `ink-soft`. Défilement horizontal sous breakpoint mobile plutôt que d'empiler.

### Le Cadran (Signature Component)
Jauge semi-circulaire (`GaugeArc`) affichant le score d'aptitude 0–100, arc coloré selon le niveau (coral → ambre → olive → sarcelle → chartreuse pour le niveau le plus élevé), chiffre central en Inter à forte chasse. Élément le plus identifiable du produit — sa géométrie ne doit jamais être réutilisée pour autre chose qu'un score d'aptitude.

## Do's and Don'ts

### Do:
- **Do** réserver `accent-vivid` (chartreuse) au remplissage plein avec texte `ink` dessus — jamais en texte ou bordure fine.
- **Do** utiliser `accent` (mousse foncée) pour tout accent textuel — liens, icônes actives, surlignage.
- **Do** utiliser l'une des deux ombres définies (`--shadow-card`, `--shadow-card-lg`), jamais une valeur ad hoc.
- **Do** garder les coins de carte généreux (16–24px) et les contrôles à 10–14px pour une cohérence géométrique.
- **Do** utiliser des bulles d'aide cliquables/survolables (pas de `title` natif seul) pour rester utilisable au tactile.
- **Do** apparier chaque teinte décorative à son encre (`tint-sand` avec `tint-sand-ink`) — les deux forment une paire, jamais une couleur seule.
- **Do** poser une teinte décorative sur une grande surface en lavis (`tintWash`), jamais en aplat : le texte doit rester sur le fond clair d'origine.
- **Do** importer le rail depuis `components/ui/rail.ts` pour toute barre d'en-tête, vitrine comme application.
- **Do** prendre le rayon dans le tableau ci-dessus ; si aucune ligne ne convient, c'est le composant qu'il faut revoir, pas le tableau qu'il faut allonger.

### Don't:
- **Don't** utiliser une police serif ; le système est 100 % grotesque/sans-serif par choix confirmé.
- **Don't** appliquer une couleur de l'échelle sémantique (coral/ambre/olive/sarcelle) à un bouton, un lien ou un élément de navigation — elle est réservée aux scores et badges de niveau.
- **Don't** employer une teinte décorative (`tint-*`) dans l'outil de diagnostic, ni une couleur sémantique (`status-*`) en décoration — les deux échelles ne se croisent jamais.
- **Don't** ajouter une troisième valeur d'ombre ou un ring de focus Tailwind par défaut ; le focus est toujours l'anneau `accent` à 2px.
- **Don't** employer l'intensité `feature` du lavis ailleurs que dans les témoignages ; elle ne vaut que parce qu'elle est seule de son intensité sur la page.
- **Don't** écrire un titre en 700 ou 800, ni avec une chasse négative : le logotype est la seule exception.
- **Don't** donner à un bouton un rayon autre que la pilule, quelle que soit sa taille ou sa page.
- **Don't** transformer une animation en simple décoration — chaque transition doit justifier sa présence en une phrase (voir les skills d'animation installées : `review-animations`, `improve-animations`).
