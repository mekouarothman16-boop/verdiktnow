"use client";

import { useEffect, useState } from "react";
import {
  listRoadmapProgress,
  toggleRoadmapStep,
  updateRoadmapStepText,
  updateRoadmapStepTitle,
  updateRoadmapStepDueDate,
  updateRoadmapStepAssignee,
  updateRoadmapStepStartDate,
  updateRoadmapStepProgress,
  updateRoadmapStepBlocking,
  updateRoadmapStepBlockingDetail,
  updateRoadmapStepBlockingResolution,
  updateRoadmapStepStatus,
  addCustomRoadmapStep,
  deleteRoadmapStep,
  type RoadmapProgressEntry,
} from "@/lib/supabase/roadmapActions";
import { RoadmapDashboardTable } from "@/components/app/RoadmapDashboardTable";
import type { Roadmap, RoadmapItem } from "@/lib/pdf/roadmap";
import { useDictionary, useLocale } from "@/i18n/LocaleProvider";
import { RoadmapGantt, type GanttRow } from "@/components/app/RoadmapGantt";
import { RoadmapActualGantt } from "@/components/app/RoadmapActualGantt";

type Dict = ReturnType<typeof useDictionary>["tool"]["roadmapChecklist"];
export type Member = { userId: string; email: string };
export type StatusColor = "green" | "yellow" | "red" | "gray";
export type DisplayItem = {
  key: string;
  title: string;
  text: string;
  done: boolean;
  isCustom: boolean;
  dueDate: string | null;
  setByLabel: string | null;
  assignedTo: string | null;
  assignedToLabel: string | null;
  startDate: string | null;
  progressPercent: number;
  isBlocking: boolean;
  statusColor: StatusColor | null;
  blockingDetail: string;
  blockingResolution: string;
};

export function mergeGenerated(items: RoadmapItem[], progress: RoadmapProgressEntry[]): DisplayItem[] {
  const byKey = new Map(progress.filter((p) => !p.is_custom).map((p) => [p.step_key, p]));
  return items.map((item) => {
    const p = byKey.get(item.key);
    return {
      key: item.key,
      title: p?.title ?? item.title,
      text: p?.text ?? item.text,
      done: p?.done ?? false,
      isCustom: false,
      dueDate: p?.due_date ?? null,
      setByLabel: p?.dueDateSetByLabel ?? null,
      assignedTo: p?.assigned_to ?? null,
      assignedToLabel: p?.assignedToLabel ?? null,
      startDate: p?.start_date ?? null,
      progressPercent: p?.progress_percent ?? 0,
      isBlocking: p?.is_blocking ?? false,
      // "red" (À faire) est la valeur par défaut d'une action jamais touchée — cohérent avec
      // le défaut au niveau de la colonne (0026), pour les lignes générées à la volée qui n'ont
      // pas encore de ligne en base du tout.
      statusColor: p?.status_color ?? "red",
      blockingDetail: p?.blocking_detail ?? "",
      blockingResolution: p?.blocking_resolution ?? "",
    };
  });
}

export function customItemsFor(phaseKey: string, progress: RoadmapProgressEntry[]): DisplayItem[] {
  return progress
    .filter((p) => p.is_custom && p.phase_key === phaseKey)
    .map((p) => ({
      key: p.step_key,
      title: p.title ?? p.text ?? "",
      text: p.text ?? "",
      done: p.done,
      isCustom: true,
      dueDate: p.due_date,
      setByLabel: p.dueDateSetByLabel,
      assignedTo: p.assigned_to,
      assignedToLabel: p.assignedToLabel,
      startDate: p.start_date,
      progressPercent: p.progress_percent,
      isBlocking: p.is_blocking,
      statusColor: p.status_color ?? "red",
      blockingDetail: p.blocking_detail ?? "",
      blockingResolution: p.blocking_resolution ?? "",
    }));
}

export function AddStepForm({ onAdd, disabled, t }: { onAdd: (title: string) => void; disabled: boolean; t: Dict }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  if (disabled) return null;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2.5 text-[12.5px] font-semibold text-accent hover:underline">
        {t.addActionLink}
      </button>
    );
  }

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2 mt-2.5">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") {
            setValue("");
            setOpen(false);
          }
        }}
        placeholder={t.addActionPlaceholder}
        className="flex-1 text-[13px] text-ink border border-line rounded-md px-2.5 py-1.5 outline-none bg-surface focus:border-accent transition-colors"
      />
      <button type="button" onClick={submit} className="text-[12px] font-semibold text-white bg-ink px-3 py-1.5 rounded-md whitespace-nowrap">
        {t.addActionButton}
      </button>
      <button
        type="button"
        onClick={() => {
          setValue("");
          setOpen(false);
        }}
        className="text-[12px] text-ink-faint hover:text-ink whitespace-nowrap"
      >
        {t.cancelButton}
      </button>
    </div>
  );
}

export function RoadmapChecklist({
  roadmap,
  processId,
  paybackMonths = null,
  members = [],
  readOnly = false,
}: {
  roadmap: Roadmap;
  processId?: string;
  paybackMonths?: number | null;
  members?: Member[];
  readOnly?: boolean;
}) {
  const locale = useLocale();
  const { roadmapChecklist: t } = useDictionary().tool;
  const [progress, setProgress] = useState<RoadmapProgressEntry[]>([]);
  const disabled = readOnly || !processId;

  useEffect(() => {
    if (!processId) return;
    listRoadmapProgress(processId).then(setProgress);
  }, [processId]);

  const blankEntry = (key: string, patch: Partial<RoadmapProgressEntry>): RoadmapProgressEntry => ({
    step_key: key,
    done: false,
    text: null,
    is_custom: false,
    phase_key: null,
    due_date: null,
    dueDateSetByLabel: null,
    assigned_to: null,
    assignedToLabel: null,
    title: null,
    start_date: null,
    progress_percent: 0,
    is_blocking: false,
    status_color: "red",
    blocking_detail: null,
    blocking_resolution: null,
    ...patch,
  });

  const toggle = (key: string, done: boolean) => {
    if (!processId) return;
    setProgress((prev) =>
      prev.some((p) => p.step_key === key)
        ? prev.map((p) => (p.step_key === key ? { ...p, done, progress_percent: done ? 100 : 0 } : p))
        : [...prev, blankEntry(key, { done, progress_percent: done ? 100 : 0 })]
    );
    toggleRoadmapStep(processId, key, done).then((res) => {
      if (!res.ok) {
        setProgress((prev) => prev.map((p) => (p.step_key === key ? { ...p, done: !done } : p)));
      }
    });
  };

  const saveText = (key: string, text: string, isCustom: boolean) => {
    if (!processId) return;
    setProgress((prev) =>
      prev.some((p) => p.step_key === key)
        ? prev.map((p) => (p.step_key === key ? { ...p, text } : p))
        : [...prev, blankEntry(key, { text, is_custom: isCustom })]
    );
    updateRoadmapStepText(processId, key, text);
  };

  const saveTitle = (key: string, isCustom: boolean, title: string) => {
    if (!processId) return;
    setProgress((prev) =>
      prev.some((p) => p.step_key === key)
        ? prev.map((p) => (p.step_key === key ? { ...p, title } : p))
        : [...prev, blankEntry(key, { title, is_custom: isCustom })]
    );
    updateRoadmapStepTitle(processId, key, title);
  };

  const saveDueDate = (key: string, isCustom: boolean, dueDate: string | null) => {
    if (!processId) return;
    const dueDateSetByLabel = dueDate ? t.youLabel : null;
    setProgress((prev) =>
      prev.some((p) => p.step_key === key)
        ? prev.map((p) => (p.step_key === key ? { ...p, due_date: dueDate, dueDateSetByLabel } : p))
        : [...prev, blankEntry(key, { due_date: dueDate, dueDateSetByLabel, is_custom: isCustom })]
    );
    updateRoadmapStepDueDate(processId, key, dueDate);
  };

  const saveStartDate = (key: string, isCustom: boolean, startDate: string | null) => {
    if (!processId) return;
    setProgress((prev) =>
      prev.some((p) => p.step_key === key)
        ? prev.map((p) => (p.step_key === key ? { ...p, start_date: startDate } : p))
        : [...prev, blankEntry(key, { start_date: startDate, is_custom: isCustom })]
    );
    updateRoadmapStepStartDate(processId, key, startDate);
  };

  const saveProgress = (key: string, isCustom: boolean, percent: number) => {
    if (!processId) return;
    const done = percent === 100;
    setProgress((prev) =>
      prev.some((p) => p.step_key === key)
        ? prev.map((p) => (p.step_key === key ? { ...p, progress_percent: percent, done } : p))
        : [...prev, blankEntry(key, { progress_percent: percent, done, is_custom: isCustom })]
    );
    updateRoadmapStepProgress(processId, key, percent);
  };

  const saveBlocking = (key: string, isCustom: boolean, isBlocking: boolean) => {
    if (!processId) return;
    setProgress((prev) =>
      prev.some((p) => p.step_key === key)
        ? prev.map((p) => (p.step_key === key ? { ...p, is_blocking: isBlocking } : p))
        : [...prev, blankEntry(key, { is_blocking: isBlocking, is_custom: isCustom })]
    );
    updateRoadmapStepBlocking(processId, key, isBlocking);
  };

  const saveBlockingDetail = (key: string, isCustom: boolean, detail: string) => {
    if (!processId) return;
    setProgress((prev) =>
      prev.some((p) => p.step_key === key)
        ? prev.map((p) => (p.step_key === key ? { ...p, blocking_detail: detail } : p))
        : [...prev, blankEntry(key, { blocking_detail: detail, is_custom: isCustom })]
    );
    updateRoadmapStepBlockingDetail(processId, key, detail);
  };

  const saveBlockingResolution = (key: string, isCustom: boolean, resolution: string) => {
    if (!processId) return;
    setProgress((prev) =>
      prev.some((p) => p.step_key === key)
        ? prev.map((p) => (p.step_key === key ? { ...p, blocking_resolution: resolution } : p))
        : [...prev, blankEntry(key, { blocking_resolution: resolution, is_custom: isCustom })]
    );
    updateRoadmapStepBlockingResolution(processId, key, resolution);
  };

  const saveStatus = (key: string, isCustom: boolean, color: StatusColor | null) => {
    if (!processId) return;
    setProgress((prev) =>
      prev.some((p) => p.step_key === key)
        ? prev.map((p) => (p.step_key === key ? { ...p, status_color: color } : p))
        : [...prev, blankEntry(key, { status_color: color, is_custom: isCustom })]
    );
    updateRoadmapStepStatus(processId, key, color);
  };

  const saveAssignee = (key: string, isCustom: boolean, text: string, userId: string | null) => {
    if (!processId) return;
    const assignedToLabel = userId ? members.find((m) => m.userId === userId)?.email ?? null : null;
    setProgress((prev) =>
      prev.some((p) => p.step_key === key)
        ? prev.map((p) => (p.step_key === key ? { ...p, text, assigned_to: userId, assignedToLabel } : p))
        : [...prev, blankEntry(key, { text, is_custom: isCustom, assigned_to: userId, assignedToLabel })]
    );
    updateRoadmapStepAssignee(processId, key, userId, text);
  };

  const addCustom = (phaseKey: string, title: string) => {
    if (!processId) return;
    addCustomRoadmapStep(processId, phaseKey, title).then((res) => {
      if (res.ok) {
        setProgress((prev) => [...prev, blankEntry(res.stepKey, { title, is_custom: true, phase_key: phaseKey })]);
      }
    });
  };

  const removeCustom = (key: string) => {
    if (!processId) return;
    setProgress((prev) => prev.filter((p) => p.step_key !== key));
    deleteRoadmapStep(processId, key);
  };

  const sections: { phaseKey: string; label: string; timeframe: string; items: RoadmapItem[] }[] = [
    { phaseKey: "immediate", label: t.immediateTitle, timeframe: roadmap.immediateTimeframe, items: roadmap.immediate },
    ...roadmap.phases.map((phase, i) => ({
      phaseKey: `phase-${i}`,
      label: t.phaseLabel.replace("{n}", String(i + 1)).replace("{title}", phase.title),
      timeframe: phase.timeframe,
      items: phase.items,
    })),
  ];
  const allDisplay = sections.flatMap((s) => [...mergeGenerated(s.items, progress), ...customItemsFor(s.phaseKey, progress)]);
  const totalCount = allDisplay.length;
  const doneCount = allDisplay.filter((i) => i.done).length;

  // Même fonctions de fusion que le tableau : le Gantt et le tableau ne peuvent jamais afficher
  // des comptes différents, puisqu'ils lisent exactement les mêmes données fusionnées.
  const rowStats = (phaseKey: string, items: RoadmapItem[]) => {
    const display = [...mergeGenerated(items, progress), ...customItemsFor(phaseKey, progress)];
    return {
      doneCount: display.filter((d) => d.done).length,
      totalCount: display.length,
      milestones: display.filter((d): d is typeof d & { dueDate: string } => !!d.dueDate).map((d) => ({
        text: d.text,
        dueDate: d.dueDate,
        done: d.done,
      })),
    };
  };
  const ganttRows: GanttRow[] = [
    {
      key: "immediate",
      label: t.immediateTitle,
      timeframe: null,
      startWeek: 0,
      durationWeeks: roadmap.immediateDurationWeeks,
      isImmediate: true,
      ...rowStats("immediate", roadmap.immediate),
    },
    ...roadmap.phases.map((phase, i) => ({
      key: `phase-${i}`,
      label: phase.title,
      timeframe: phase.timeframe,
      startWeek: phase.startWeek,
      durationWeeks: phase.durationWeeks,
      isImmediate: false,
      ...rowStats(`phase-${i}`, phase.items),
    })),
  ];
  const scrollToSection = (key: string) => {
    document.getElementById(`roadmap-section-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="max-w-[1440px] mx-auto">
      <p className="text-[13.5px] text-ink-soft leading-relaxed mb-1">{t.intro}</p>
      {!processId && <p className="text-[12.5px] text-gold-deep mb-5">{t.localOnlyNotice}</p>}

      <div className="flex items-center gap-3 mb-6 mt-4">
        <div className="flex-1 h-1.5 rounded-full bg-line-soft overflow-hidden">
          <div
            className="h-full w-full bg-accent rounded-full origin-left transition-transform duration-300"
            style={{ transform: `scaleX(${totalCount > 0 ? doneCount / totalCount : 0})` }}
          />
        </div>
        <span className="text-[12px] font-semibold text-ink-soft whitespace-nowrap">
          {t.progressLabel.replace("{done}", String(doneCount)).replace("{total}", String(totalCount))}
        </span>
      </div>

      {doneCount === totalCount && totalCount > 0 && (
        <div className="mb-6 px-4 py-2.5 rounded-lg bg-accent-soft text-accent-deep text-[12.5px] font-medium">
          {t.allDoneNotice}
        </div>
      )}

      <RoadmapGantt rows={ganttRows} locale={locale} onSelectRow={scrollToSection} paybackMonths={paybackMonths} t={t} />

      <RoadmapActualGantt
        items={allDisplay.map((i) => ({
          key: i.key,
          label: i.title,
          startDate: i.startDate,
          dueDate: i.dueDate,
          done: i.done,
          progressPercent: i.progressPercent,
        }))}
        locale={locale}
        t={t}
      />

      <RoadmapDashboardTable
        sections={sections}
        progress={progress}
        members={members}
        disabled={disabled}
        onSaveTitle={saveTitle}
        onSaveText={saveText}
        onSaveAssignee={saveAssignee}
        onSaveStartDate={saveStartDate}
        onSaveDueDate={saveDueDate}
        onSaveProgress={saveProgress}
        onSaveBlocking={saveBlocking}
        onSaveBlockingDetail={saveBlockingDetail}
        onSaveBlockingResolution={saveBlockingResolution}
        onSaveStatus={saveStatus}
        onAddCustom={addCustom}
        onDeleteCustom={removeCustom}
        t={t}
      />
    </div>
  );
}
