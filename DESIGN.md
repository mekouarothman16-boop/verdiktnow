---
name: CADRAN
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
  ink-faint: "#6d7373"
  line: "#d7dbd8"
  line-soft: "#e2e5e2"
  gold: "#83641f"
  gold-tint: "#c9a227"
  gold-soft: "#f7efdc"
  status-coral: "#c45033"
  status-amber: "#9a6c1b"
  status-olive: "#6b7d31"
  status-teal: "#348269"
typography:
  display:
    fontFamily: "Outfit, Inter, system-ui, sans-serif"
    fontWeight: 600
    letterSpacing: "-0.01em to -0.02em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 400
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 600
    letterSpacing: "0.03em to 0.1em"
rounded:
  card: "16px to 24px"
  pill: "9999px"
  control: "10px to 14px"
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

# Design System: CADRAN

## Overview

**Creative North Star: "Le Feu Vert" (The Green Light)**

CADRAN dit à un décideur si un processus est prêt à automatiser — un verdict binaire dans l'esprit, même si le score est nuancé. Le système visuel emprunte donc au vocabulaire du feu vert / signal « GO » : un accent chartreuse vif et non ambigu, posé sur un fond neutre sobre et une encre presque noire. C'est délibérément l'esthétique d'un SaaS moderne et énergique plutôt que celle d'un rapport d'ingénierie — remplace le précédent système « instrument de précision » (Bricolage Grotesque + IBM Plex Mono + terracotta) sur décision explicite du fondateur, en adoptant la direction visuelle du gabarit Framer ERPSAA (erpsaas.framer.website).

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

### Neutral
- **Gris-vert clair** (`#e9ecea` / bg) : fond de page.
- **Blanc** (`#ffffff` / surface) : cartes et surfaces élevées.
- **Encre** (`#091315` / ink) : texte principal, fond des sections sombres, texte sur remplissage chartreuse.
- **Encre douce** (`#686464` / ink-soft) : texte secondaire, libellés de champ.
- **Encre estompée** (`#6d7373` / ink-faint) : légendes, texte tertiaire, icônes inertes. Calibré pour un contraste ≥4.5:1 sur blanc/fond (WCAG AA).
- **Ligne** (`#d7dbd8` / line) et **ligne douce** (`#e2e5e2` / line-soft) : bordures de carte et séparateurs.

### Named Rules
**The Fill-Not-Text Rule.** Le chartreuse vif (`accent-vivid`) ne sert JAMAIS de couleur de texte ou de bordure fine — seulement de remplissage plein (bouton, jauge, badge actif), toujours avec du texte `ink` dessus. Pour un accent textuel (lien, icône, surlignage), utiliser `accent` (la variante mousse foncée), jamais `accent-vivid` directement.

**The Status-Is-Not-Brand Rule.** `status-coral`, `status-amber`, `status-olive` et `status-teal` forment l'échelle de progression du diagnostic (peu adapté → candidat idéal). Elles ne doivent jamais habiller un bouton, un lien ou un élément de navigation — seulement un score, un badge de niveau ou une pastille de statut.

## Typography

**Display Font:** Outfit (avec repli Inter, system-ui)
**Body Font:** Inter (avec repli system-ui)
**Label Font:** Inter, semi-gras, tracking large — la distinction « chiffre = police mono » de l'ancien système est abandonnée ; tout le texte, chiffres inclus, est en Inter.

**Character:** Un grotesque géométrique moderne (Outfit, poids 600) pour les titres, posé sur un texte courant Inter très lisible — direction SaaS contemporaine, pas instrument de mesure.

### Hierarchy
- **Display** (600, 28–66px selon le contexte, tracking -0.01em à -0.02em) : titres de section, montant vedette du calculateur de ROI.
- **Headline** (600–700, 21–28px) : titres de carte, verdicts de priorisation.
- **Title** (600, 15–16px) : en-têtes de composant, noms de champ mis en valeur.
- **Body** (400, 13–15px, line-height confortable) : texte courant, descriptions, notes explicatives.
- **Label** (600, 10–12px, tracking 0.03em à 0.1em, souvent majuscules) : eyebrows, unités, libellés d'axe, badges.

## Layout

Conteneur principal à largeur maximale ~1160px (900px pour les pages de compte/formulaire), centré, avec un pad horizontal de 20–24px. Rythme vertical généreux entre sections (64px en mobile, jusqu'à 112px en desktop sur les pages vitrine). Grilles à 2 colonnes fréquentes pour les paires champ/valeur ; la matrice de priorisation et les cartes de portefeuille passent en pile unique sous le breakpoint `sm`.

## Elevation & Depth

Système à deux paliers seulement, pas de rampe d'élévation étendue. Les surfaces sont blanches sur fond gris-vert clair avec une ombre douce — la profondeur vient du contraste de fond, pas d'ombres marquées.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 1px 2px rgba(9,19,21,0.04), 0 6px 20px rgba(9,19,21,0.05)`) : cartes au repos.
- **Card Large** (`box-shadow: 0 4px 10px rgba(9,19,21,0.05), 0 18px 46px rgba(9,19,21,0.08)`) : cartes flottantes ou mises en avant (panneau de résultat ROI, popovers).

### Named Rules
**The Two-Shadow Rule.** Il n'existe que deux valeurs d'ombre dans tout le système. N'en introduisez jamais une troisième pour un besoin ponctuel — choisissez la plus proche des deux, ou retirez l'ombre.

## Shapes

Coins de carte généreux (16–24px selon la taille de la carte), contrôles et champs à 10–14px, badges et boutons pilule à rayon complet (9999px) — plus arrondi que l'ancien système, dans l'esprit SaaS ERPSAA. Bordures fines de 1px en `line`/`line-soft`, jamais de bordure épaisse ou de double contour.

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

### Don't:
- **Don't** utiliser une police serif ; le système est 100 % grotesque/sans-serif par choix confirmé.
- **Don't** appliquer une couleur de l'échelle sémantique (coral/ambre/olive/sarcelle) à un bouton, un lien ou un élément de navigation — elle est réservée aux scores et badges de niveau.
- **Don't** ajouter une troisième valeur d'ombre ou un ring de focus Tailwind par défaut ; le focus est toujours l'anneau `accent` à 2px.
- **Don't** transformer une animation en simple décoration — chaque transition doit justifier sa présence en une phrase (voir les skills d'animation installées : `review-animations`, `improve-animations`).
