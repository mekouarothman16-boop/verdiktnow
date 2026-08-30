"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateOrgConstants } from "@/lib/supabase/orgCalibrationActions";
import { useDictionary } from "@/i18n/LocaleProvider";

export function OrgCalibration({
  hoursPerFte,
  magnitudeRef,
  priorityThreshold,
  isOwner,
}: {
  hoursPerFte: number;
  magnitudeRef: number;
  priorityThreshold: number;
  isOwner: boolean;
}) {
  const { orgCalibration: t } = useDictionary().auth;
  const [values, setValues] = useState({ hoursPerFte, magnitudeRef, priorityThreshold });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const set = <K extends keyof typeof values>(k: K, v: number) => {
    setValues((p) => ({ ...p, [k]: v }));
    setStatus("idle");
  };

  const handleSave = async () => {
    setBusy(true);
    setStatus("idle");
    const res = await updateOrgConstants(values.hoursPerFte, values.magnitudeRef, values.priorityThreshold);
    setBusy(false);
    setStatus(res.ok ? "saved" : "error");
  };

  if (!isOwner) {
    return <p className="text-[12px] text-ink-faint">{t.ownerOnly}</p>;
  }

  return (
    <div>
      <p className="text-[11.5px] text-ink-faint mb-4 leading-relaxed max-w-[560px]">{t.description}</p>
      <div className="grid sm:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-[12.5px] text-ink-soft mb-1.5 block" title={t.hoursPerFteHint}>
            {t.hoursPerFteLabel}
          </span>
          <div className="flex items-center border border-line rounded-lg overflow-hidden bg-surface transition-colors focus-within:border-accent">
            <input
              type="number"
              value={values.hoursPerFte}
              step={50}
              min={500}
              max={3000}
              onChange={(e) => set("hoursPerFte", e.target.value === "" ? 0 : parseFloat(e.target.value))}
              className="flex-1 border-none outline-none px-[11px] py-2.5 font-mono text-sm text-ink w-full bg-transparent"
            />
            <span className="px-[11px] font-mono text-xs text-ink-faint border-l border-line-soft whitespace-nowrap">h</span>
          </div>
        </label>
        <label className="block">
          <span className="text-[12.5px] text-ink-soft mb-1.5 block" title={t.magnitudeRefHint}>
            {t.magnitudeRefLabel}
          </span>
          <div className="flex items-center border border-line rounded-lg overflow-hidden bg-surface transition-colors focus-within:border-accent">
            <input
              type="number"
              value={values.magnitudeRef}
              step={1000}
              min={1000}
              max={10000000}
              onChange={(e) => set("magnitudeRef", e.target.value === "" ? 0 : parseFloat(e.target.value))}
              className="flex-1 border-none outline-none px-[11px] py-2.5 font-mono text-sm text-ink w-full bg-transparent"
            />
            <span className="px-[11px] font-mono text-xs text-ink-faint border-l border-line-soft whitespace-nowrap">$</span>
          </div>
        </label>
        <label className="block">
          <span className="text-[12.5px] text-ink-soft mb-1.5 block" title={t.priorityThresholdHint}>
            {t.priorityThresholdLabel}
          </span>
          <div className="flex items-center border border-line rounded-lg overflow-hidden bg-surface transition-colors focus-within:border-accent">
            <input
              type="number"
              value={values.priorityThreshold}
              step={5}
              min={10}
              max={90}
              onChange={(e) => set("priorityThreshold", e.target.value === "" ? 0 : parseFloat(e.target.value))}
              className="flex-1 border-none outline-none px-[11px] py-2.5 font-mono text-sm text-ink w-full bg-transparent"
            />
            <span className="px-[11px] font-mono text-xs text-ink-faint border-l border-line-soft whitespace-nowrap">/100</span>
          </div>
        </label>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleSave}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-accent-vivid text-ink text-[12.5px] font-semibold hover:brightness-95 transition disabled:opacity-60 flex items-center gap-2"
        >
          {busy && <Loader2 size={13} className="animate-spin-slow" />}
          {t.save}
        </button>
        {status === "saved" && (
          <span className="flex items-center gap-1.5 text-[12px] text-accent">
            <Check size={13} /> {t.saved}
          </span>
        )}
        {status === "error" && <span className="text-[12px] text-coral">{t.saveError}</span>}
      </div>
    </div>
  );
}
