// Le rail de la page vitrine est le rail commun du site. Il vit dans
// components/ui/rail.ts parce que les en-têtes de l'application s'y posent
// aussi ; ce fichier ne fait que le réexporter pour les composants de la
// vitrine, qui l'importaient déjà sous ce nom.
//
// Ne pas réintroduire de max-w-[...] intermédiaire sur un bloc de section :
// c'est ce qui rendait la largeur variable d'une section à l'autre. Les seules
// limites de largeur légitimes sont les mesures de lecture posées sur un
// paragraphe courant (MEASURE).
export { GUTTER, SHELL, INSET, MEASURE } from "@/components/ui/rail";
