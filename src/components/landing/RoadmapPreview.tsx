"use client";

import { RoadmapGantt, type GanttRow } from "@/components/app/RoadmapGantt";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";

// Deuxième vraie vue de l'outil sur la page vitrine, après la matrice.
//
// `RoadmapGantt` est entièrement piloté par ses props : des rangées, une locale
// et des libellés. Comme `Matrix`, il se réutilise tel quel plutôt qu'en
// capture d'écran, donc il reste net et ne peut pas se périmer.
//
// Deux précautions d'honnêteté. Le sous-titre de l'outil dit « cliquez sur une
// barre pour aller à son détail », ce qui serait faux ici : il est remplacé par
// un texte propre à la vitrine. Et le bloc est neutralisé au clic, pour qu'il
// ne se présente pas comme interactif alors qu'il ne l'est pas.
//
// Les semaines correspondent aux trois phases que l'outil génère réellement
// (0-6, 6-16, 16-40), pas à des durées inventées pour faire joli.
const ROWS: Omit<GanttRow, "label" | "timeframe">[] = [
  { key: "immediate", startWeek: 0, durationWeeks: 2, isImmediate: true, doneCount: 2, totalCount: 3, milestones: [] },
  { key: "phase1", startWeek: 0, durationWeeks: 6, isImmediate: false, doneCount: 1, totalCount: 5, milestones: [] },
  { key: "phase2", startWeek: 6, durationWeeks: 10, isImmediate: false, doneCount: 0, totalCount: 6, milestones: [] },
  { key: "phase3", startWeek: 16, durationWeeks: 24, isImmediate: false, doneCount: 0, totalCount: 4, milestones: [] },
];

export function RoadmapPreview() {
  const locale = useLocale();
  const { landing, tool } = useDictionary();
  const t = landing.features;

  const labels = [
    t.ganttPhaseImmediate,
    t.ganttPhase1,
    t.ganttPhase2,
    t.ganttPhase3,
  ];
  const frames = [null, t.ganttFrame1, t.ganttFrame2, t.ganttFrame3];
  const rows: GanttRow[] = ROWS.map((r, i) => ({ ...r, label: labels[i], timeframe: frames[i] }));

  return (
    <div className="pointer-events-none select-none [&>div]:mb-0">
      <RoadmapGantt
        rows={rows}
        locale={locale}
        onSelectRow={() => {}}
        paybackMonths={7}
        t={{ ...tool.roadmapChecklist, ganttSubtitle: t.ganttSubtitle }}
      />
    </div>
  );
}
