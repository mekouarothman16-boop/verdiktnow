"use client";

import { useState } from "react";
import { ChevronDown, ListTree, Plus, Trash2, Calculator } from "lucide-react";
import { totalActivityMinutes, type ProcessActivity, type RoiInputs } from "@/lib/scoring";
import { useDictionary } from "@/i18n/LocaleProvider";

let seq = 0;
const newId = () => `act-${Date.now()}-${seq++}`;

export function ActivityList({
  activities,
  setActivities,
  readOnly = false,
  onApplyRoi,
}: {
  activities: ProcessActivity[];
  setActivities: (fn: (prev: ProcessActivity[]) => ProcessActivity[]) => void;
  readOnly?: boolean;
  onApplyRoi?: (patch: Partial<RoiInputs>) => void;
}) {
  const { activityList: t } = useDictionary().tool;
  const [open, setOpen] = useState(activities.length > 0);
  const [applied, setApplied] = useState(false);

  const update = (id: string, patch: Partial<ProcessActivity>) => {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    setApplied(false);
  };
  const addRow = () => {
    setActivities((prev) => [
      ...prev,
      {
        id: newId(), label: "", actor: "", system: "", minutes: 0, friction: "",
        rulesBased: false, digitalData: false, frequentExceptions: false,
      },
    ]);
    setOpen(true);
  };
  const removeRow = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    setApplied(false);
  };

  const total = totalActivityMinutes(activities);

  const applyToRoi = () => {
    if (!onApplyRoi || total <= 0) return;
    onApplyRoi({ minutes: total });
    setApplied(true);
  };

  return (
    <div className="mt-4.5 pt-4.5 border-t border-line-soft">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-soft hover:text-ink transition-colors"
      >
        <ListTree size={14} className="text-accent" />
        {t.toggleLabel}
        <ChevronDown size={14} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>
      <p className="text-[11.5px] text-ink-faint mt-1.5 leading-relaxed max-w-[640px]">
        {t.description}
      </p>

      {open && (
        <div className="mt-3.5">
          {activities.length > 0 && (
            <div className="grid gap-3 mb-3">
              {activities.map((a) => {
                const filled = a.label.trim().length > 0;
                const coreReady = a.rulesBased && a.digitalData;
                const automatable = coreReady && !a.frequentExceptions;
                const cautious = coreReady && a.frequentExceptions;
                const partial = !coreReady && (a.rulesBased || a.digitalData);
                const caption = cautious
                  ? t.exceptionsCaution
                  : partial
                  ? (a.rulesBased ? t.partialCaptionNeedData : t.partialCaptionNeedRule)
                  : !coreReady
                  ? t.notReadyCaption
                  : null;
                return (
                  <div key={a.id} className="grid gap-1.5">
                    <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr_70px_1.2fr_auto] gap-1.5 items-center">
                      <input
                        value={a.label}
                        onChange={(e) => update(a.id, { label: e.target.value })}
                        placeholder={t.placeholderStep}
                        disabled={readOnly}
                        className="border border-line rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink outline-none bg-surface focus:border-accent transition-colors disabled:text-ink-faint"
                      />
                      <input
                        value={a.actor}
                        onChange={(e) => update(a.id, { actor: e.target.value })}
                        placeholder={t.placeholderActor}
                        disabled={readOnly}
                        className="border border-line rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink outline-none bg-surface focus:border-accent transition-colors disabled:text-ink-faint"
                      />
                      <input
                        value={a.system}
                        onChange={(e) => update(a.id, { system: e.target.value })}
                        placeholder={t.placeholderSystem}
                        disabled={readOnly}
                        className="border border-line rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink outline-none bg-surface focus:border-accent transition-colors disabled:text-ink-faint"
                      />
                      <input
                        type="number"
                        min={0}
                        value={a.minutes || ""}
                        onChange={(e) => update(a.id, { minutes: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                        placeholder={t.placeholderMinutes}
                        disabled={readOnly}
                        className="border border-line rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink outline-none bg-surface focus:border-accent transition-colors disabled:text-ink-faint"
                      />
                      <input
                        value={a.friction}
                        onChange={(e) => update(a.id, { friction: e.target.value })}
                        placeholder={t.placeholderFriction}
                        disabled={readOnly}
                        className="border border-line rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink outline-none bg-surface focus:border-accent transition-colors disabled:text-ink-faint"
                      />
                      {!readOnly && (
                        <button
                          onClick={() => removeRow(a.id)}
                          aria-label={t.removeStepAriaLabel}
                          className="text-ink-faint hover:text-coral transition-colors p-1 justify-self-end w-fit"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 pl-1">
                      <label className="flex items-center gap-1.5 text-[11px] text-ink-soft cursor-pointer">
                        <input
                          type="checkbox"
                          checked={a.rulesBased}
                          onChange={(e) => update(a.id, { rulesBased: e.target.checked })}
                          disabled={readOnly}
                        />
                        {t.ruleBasedLabel}
                      </label>
                      <label className="flex items-center gap-1.5 text-[11px] text-ink-soft cursor-pointer">
                        <input
                          type="checkbox"
                          checked={a.digitalData}
                          onChange={(e) => update(a.id, { digitalData: e.target.checked })}
                          disabled={readOnly}
                        />
                        {t.digitalDataLabel}
                      </label>
                      <label className="flex items-center gap-1.5 text-[11px] text-ink-soft cursor-pointer">
                        <input
                          type="checkbox"
                          checked={a.frequentExceptions}
                          onChange={(e) => update(a.id, { frequentExceptions: e.target.checked })}
                          disabled={readOnly}
                        />
                        {t.frequentExceptionsLabel}
                      </label>
                      {filled && (
                        <span
                          className={
                            automatable || cautious
                              ? "font-mono text-[10px] px-1.5 py-0.5 rounded bg-accent-soft text-accent-deep"
                              : partial
                              ? "font-mono text-[10px] px-1.5 py-0.5 rounded bg-gold-soft text-gold"
                              : "font-mono text-[10px] px-1.5 py-0.5 rounded bg-line-soft text-ink-faint"
                          }
                        >
                          {automatable || cautious ? t.automatableTag : partial ? t.partialTag : t.manualTag}
                        </span>
                      )}
                    </div>
                    {filled && caption && (
                      <p className="text-[11px] text-ink-faint leading-relaxed pl-1 max-w-[620px]">{caption}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {!readOnly && (
            <button
              onClick={addRow}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-accent hover:underline"
            >
              <Plus size={13} /> {t.addStepButton}
            </button>
          )}
          {total > 0 && (
            <div className="flex items-center flex-wrap gap-3 mt-3.5 pt-3.5 border-t border-line-soft">
              <span className="text-[12px] text-ink-soft font-mono">
                {t.totalLabel} <b className="text-ink">{total} min</b> {t.perOccurrence}
              </span>
              {onApplyRoi && !readOnly && (
                <button
                  onClick={applyToRoi}
                  disabled={applied}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent text-accent-deep bg-accent-soft text-[11.5px] font-semibold hover:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Calculator size={12} />
                  {applied ? t.appliedToRoi : t.applyToRoiButton}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
