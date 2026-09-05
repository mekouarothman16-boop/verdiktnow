"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import clsx from "clsx";
import { mergeGenerated, customItemsFor, AddStepForm, type DisplayItem, type Member, type StatusColor } from "@/components/app/RoadmapChecklist";
import type { RoadmapProgressEntry } from "@/lib/supabase/roadmapActions";
import type { RoadmapItem } from "@/lib/pdf/roadmap";
import { useDictionary } from "@/i18n/LocaleProvider";

type Dict = ReturnType<typeof useDictionary>["tool"]["roadmapChecklist"];

/** Zone de texte qui grandit avec son contenu plutôt que de le faire défiler horizontalement —
 * le texte généré (descriptions notamment) peut être long, et l'objectif du tableau est de tout
 * lire d'un coup d'œil, pas de cacher la fin d'une phrase dans un champ à une seule ligne. */
function TextCell({ value, onCommit, disabled, placeholder, className }: { value: string; onCommit: (v: string) => void; disabled: boolean; placeholder?: string; className?: string }) {
  const [draft, setDraft] = useState(value);
  const resize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };
  return (
    <textarea
      ref={resize}
      value={draft}
      placeholder={placeholder}
      disabled={disabled}
      rows={1}
      onChange={(e) => {
        setDraft(e.target.value);
        resize(e.target);
      }}
      onBlur={() => {
        const trimmed = draft.trim();
        if (trimmed !== value) onCommit(trimmed);
      }}
      className={clsx(
        "w-full text-[12.5px] text-ink bg-transparent outline-none border border-transparent rounded-[10px] px-1.5 py-1 resize-none overflow-hidden leading-snug focus:border-accent focus:bg-surface transition-colors disabled:text-ink-faint",
        className
      )}
    />
  );
}

/** Champ à une seule ligne, sans retour à la ligne — contrairement à TextCell (description),
 * le titre de l'action doit rester lisible d'un coup d'œil dans une colonne étroite ; un texte
 * plus long que la colonne est coupé visuellement (ellipse) et reste consultable via l'infobulle
 * native (title=) ou en cliquant dans le champ. */
function TitleCell({ value, onCommit, disabled, className }: { value: string; onCommit: (v: string) => void; disabled: boolean; className?: string }) {
  const [draft, setDraft] = useState(value);
  return (
    <input
      type="text"
      value={draft}
      title={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const trimmed = draft.trim();
        if (trimmed !== value) onCommit(trimmed);
      }}
      className={clsx(
        "w-full truncate text-[12.5px] text-ink bg-transparent outline-none border border-transparent rounded-[10px] px-1.5 py-1 focus:border-accent focus:bg-surface transition-colors disabled:text-ink-faint",
        className
      )}
    />
  );
}

function Row({
  item,
  members,
  disabled,
  onSaveTitle,
  onSaveText,
  onSaveAssignee,
  onSaveStartDate,
  onSaveDueDate,
  onSaveProgress,
  onSaveBlocking,
  onSaveBlockingDetail,
  onSaveBlockingResolution,
  onSaveStatus,
  onDelete,
  t,
}: {
  item: DisplayItem;
  members: Member[];
  disabled: boolean;
  onSaveTitle: (title: string) => void;
  onSaveText: (text: string) => void;
  onSaveAssignee: (userId: string | null) => void;
  onSaveStartDate: (date: string | null) => void;
  onSaveDueDate: (date: string | null) => void;
  onSaveProgress: (percent: number) => void;
  onSaveBlocking: (isBlocking: boolean) => void;
  onSaveBlockingDetail: (detail: string) => void;
  onSaveBlockingResolution: (resolution: string) => void;
  onSaveStatus: (color: StatusColor | null) => void;
  onDelete?: () => void;
  t: Dict;
}) {
  return (
    <tr className="border-b border-line-soft last:border-0 align-top">
      <td className="py-1.5 pr-2">
        <TitleCell value={item.title} onCommit={onSaveTitle} disabled={disabled} className="font-medium" />
      </td>
      <td className="py-1.5 pr-2">
        <TextCell value={item.text} onCommit={onSaveText} disabled={disabled} placeholder={t.descriptionPlaceholder} />
      </td>
      <td className="py-1.5 pr-2">
        <select
          value={item.assignedTo ?? ""}
          disabled={disabled}
          onChange={(e) => onSaveAssignee(e.target.value || null)}
          className="w-full truncate text-[12px] text-ink bg-transparent outline-none border border-line-soft rounded-[10px] px-1.5 py-1 focus:border-accent transition-colors disabled:text-ink-faint"
        >
          <option value="">{t.unassignedOption}</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.email}
            </option>
          ))}
        </select>
      </td>
      <td className="py-1.5 pr-2">
        <input
          type="date"
          value={item.startDate ?? ""}
          disabled={disabled}
          onChange={(e) => onSaveStartDate(e.target.value || null)}
          className="w-full text-[11.5px] text-ink bg-transparent outline-none border border-line-soft rounded-[10px] px-1.5 py-1 focus:border-accent transition-colors disabled:text-ink-faint"
        />
      </td>
      <td className="py-1.5 pr-2">
        <input
          type="date"
          value={item.dueDate ?? ""}
          disabled={disabled}
          onChange={(e) => onSaveDueDate(e.target.value || null)}
          className={clsx(
            "w-full text-[11.5px] bg-transparent outline-none border rounded-[10px] px-1.5 py-1 focus:border-accent transition-colors disabled:text-ink-faint",
            !item.done && item.dueDate && item.dueDate < new Date().toISOString().slice(0, 10)
              ? "text-coral border-coral/40"
              : "text-ink border-line-soft"
          )}
        />
      </td>
      <td className="py-1.5 pr-2">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={100}
            value={item.progressPercent}
            disabled={disabled}
            onChange={(e) => onSaveProgress(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
            className="w-10 text-[12px] text-ink bg-transparent outline-none border border-line-soft rounded-[10px] px-1.5 py-1 focus:border-accent transition-colors disabled:text-ink-faint"
          />
          <span className="text-[11px] text-ink-faint">%</span>
        </div>
      </td>
      <td className="py-1.5 pr-2 text-center">
        <input
          type="checkbox"
          checked={item.isBlocking}
          disabled={disabled}
          onChange={(e) => onSaveBlocking(e.target.checked)}
          className="w-[15px] h-[15px] accent-coral cursor-pointer disabled:cursor-not-allowed"
        />
      </td>
      <td className="py-1.5 pr-2">
        <TextCell value={item.blockingDetail} onCommit={onSaveBlockingDetail} disabled={disabled} placeholder={t.blockingDetailPlaceholder} />
      </td>
      <td className="py-1.5 pr-2">
        <TextCell value={item.blockingResolution} onCommit={onSaveBlockingResolution} disabled={disabled} placeholder={t.blockingResolutionPlaceholder} />
      </td>
      <td className="py-1.5">
        <select
          value={item.statusColor ?? "red"}
          disabled={disabled}
          onChange={(e) => onSaveStatus(e.target.value as StatusColor)}
          className="w-full truncate text-[12px] text-ink bg-transparent outline-none border border-line-soft rounded-[10px] pl-2 pr-1.5 py-1 focus:border-accent transition-colors disabled:text-ink-faint"
        >
          <option value="red">{t.statusRed}</option>
          <option value="yellow">{t.statusYellow}</option>
          <option value="green">{t.statusGreen}</option>
          <option value="gray">{t.statusGray}</option>
        </select>
      </td>
      <td className="py-1.5 pl-2">
        {onDelete && (
          <button type="button" onClick={onDelete} aria-label={t.deleteAriaLabel} className="text-ink-faint hover:text-coral transition-colors">
            <Trash2 size={13} />
          </button>
        )}
      </td>
    </tr>
  );
}

export function RoadmapDashboardTable({
  sections,
  progress,
  members,
  disabled,
  onSaveTitle,
  onSaveText,
  onSaveAssignee,
  onSaveStartDate,
  onSaveDueDate,
  onSaveProgress,
  onSaveBlocking,
  onSaveBlockingDetail,
  onSaveBlockingResolution,
  onSaveStatus,
  onAddCustom,
  onDeleteCustom,
  t,
}: {
  sections: { phaseKey: string; label: string; timeframe: string; items: RoadmapItem[] }[];
  progress: RoadmapProgressEntry[];
  members: Member[];
  disabled: boolean;
  onSaveTitle: (key: string, isCustom: boolean, title: string) => void;
  onSaveText: (key: string, text: string, isCustom: boolean) => void;
  onSaveAssignee: (key: string, isCustom: boolean, text: string, userId: string | null) => void;
  onSaveStartDate: (key: string, isCustom: boolean, date: string | null) => void;
  onSaveDueDate: (key: string, isCustom: boolean, date: string | null) => void;
  onSaveProgress: (key: string, isCustom: boolean, percent: number) => void;
  onSaveBlocking: (key: string, isCustom: boolean, isBlocking: boolean) => void;
  onSaveBlockingDetail: (key: string, isCustom: boolean, detail: string) => void;
  onSaveBlockingResolution: (key: string, isCustom: boolean, resolution: string) => void;
  onSaveStatus: (key: string, isCustom: boolean, color: StatusColor | null) => void;
  onAddCustom: (phaseKey: string, title: string) => void;
  onDeleteCustom: (key: string) => void;
  t: Dict;
}) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {sections.map((section) => {
        const items = [...mergeGenerated(section.items, progress), ...customItemsFor(section.phaseKey, progress)];
        return (
          <div
            key={section.phaseKey}
            id={`roadmap-section-${section.phaseKey}`}
            className="rounded-[16px] border border-line bg-surface p-4 scroll-mt-4"
          >
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <div className="text-[12.5px] font-semibold text-ink">{section.label}</div>
              <div className="text-[11px] text-ink-faint whitespace-nowrap">{section.timeframe}</div>
            </div>
            {items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed">
                  <colgroup>
                    <col style={{ width: 210 }} />
                    <col style={{ width: 150 }} />
                    <col style={{ width: 105 }} />
                    <col style={{ width: 104 }} />
                    <col style={{ width: 104 }} />
                    <col style={{ width: 96 }} />
                    <col style={{ width: 68 }} />
                    <col style={{ width: 190 }} />
                    <col style={{ width: 190 }} />
                    <col style={{ width: 100 }} />
                    <col style={{ width: 26 }} />
                  </colgroup>
                  <thead>
                    <tr className="text-left border-b border-line">
                      <th className="pb-2 pr-2 overflow-hidden text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">{t.colAction}</th>
                      <th className="pb-2 pr-2 overflow-hidden text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">{t.colDescription}</th>
                      <th className="pb-2 pr-2 overflow-hidden text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">{t.colResponsible}</th>
                      <th className="pb-2 pr-2 overflow-hidden text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">{t.colStartDate}</th>
                      <th className="pb-2 pr-2 overflow-hidden text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">{t.colEndDate}</th>
                      <th className="pb-2 pr-2 overflow-hidden text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">{t.colProgress}</th>
                      <th className="pb-2 pr-2 overflow-hidden text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">{t.colBlocking}</th>
                      <th className="pb-2 pr-2 overflow-hidden text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">{t.colBlockingDetail}</th>
                      <th className="pb-2 pr-2 overflow-hidden text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">{t.colBlockingResolution}</th>
                      <th className="pb-2 pr-2 overflow-hidden text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">{t.colStatus}</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <Row
                        key={item.key}
                        item={item}
                        members={members}
                        disabled={disabled}
                        onSaveTitle={(title) => onSaveTitle(item.key, item.isCustom, title)}
                        onSaveText={(text) => onSaveText(item.key, text, item.isCustom)}
                        onSaveAssignee={(userId) => onSaveAssignee(item.key, item.isCustom, item.text, userId)}
                        onSaveStartDate={(date) => onSaveStartDate(item.key, item.isCustom, date)}
                        onSaveDueDate={(date) => onSaveDueDate(item.key, item.isCustom, date)}
                        onSaveProgress={(percent) => onSaveProgress(item.key, item.isCustom, percent)}
                        onSaveBlocking={(isBlocking) => onSaveBlocking(item.key, item.isCustom, isBlocking)}
                        onSaveBlockingDetail={(detail) => onSaveBlockingDetail(item.key, item.isCustom, detail)}
                        onSaveBlockingResolution={(resolution) => onSaveBlockingResolution(item.key, item.isCustom, resolution)}
                        onSaveStatus={(color) => onSaveStatus(item.key, item.isCustom, color)}
                        onDelete={item.isCustom ? () => onDeleteCustom(item.key) : undefined}
                        t={t}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!disabled && <AddStepForm onAdd={(title) => onAddCustom(section.phaseKey, title)} disabled={disabled} t={t} />}
          </div>
        );
      })}
    </div>
  );
}
