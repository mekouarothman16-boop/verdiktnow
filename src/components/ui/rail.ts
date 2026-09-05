// Rail commun à tout le site.
//
// Trois constantes, toujours utilisées ensemble :
//   GUTTER  marge entre le bord de l'écran et le bord visible d'un bloc
//   SHELL   largeur maximale du bloc
//   INSET   rembourrage intérieur qui définit la colonne de contenu
//
// Une section encadrée met SHELL et INSET sur la carte. Une section sans cadre
// met les deux sur un simple div. Dans les deux cas la colonne de texte tombe
// au même endroit, à toutes les largeurs d'écran.
//
// Les barres d'en-tête de TOUTES les pages, vitrine comme application, posent
// leur contenu sur ce rail. C'est ce qui empêche le logo de sauter
// horizontalement quand on passe de la page d'accueil à l'outil. Le contenu
// sous l'en-tête, lui, garde la mesure qui convient à sa nature : une page
// légale se lit sur 760 px, un formulaire de compte sur 900 px, un tableau de
// bord sur toute la largeur. Chrome aligné, contenu mesuré.
export const GUTTER = "px-4 sm:px-8";
export const SHELL = "max-w-[1320px] mx-auto";
export const INSET = "px-5 sm:px-10 lg:px-14";

// Longueur de ligne confortable pour un paragraphe d'introduction centré.
export const MEASURE = "max-w-[620px] mx-auto";
