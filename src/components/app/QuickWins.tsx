"use client";

import { Zap } from "lucide-react";
import type { QuickWinsSummary } from "@/lib/scoring";
import { useDictionary } from "@/i18n/LocaleProvider";

export function QuickWins({ summary }: { summary: QuickWinsSummary }) {
  const { quickWins: t } = useDictionary().tool;
  if (summary.items.length === 0) return null;
  const selfServe = summary.platformTools.length > 0;

  return (
    <div className="mt-4.5 pt-4.5 border-t border-line-soft">
      <div className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-soft mb-1.5">
        <Zap size={14} className="text-accent" />
        {t.title}
      </div>
      <p className="text-[11.5px] text-ink-faint leading-relaxed max-w-[640px] mb-3">
        {selfServe
          ? t.introSelfServe
              .replace("{n}", String(summary.items.length))
              .replace("{tools}", summary.platformTools.join(", "))
          : t.introBasic.replace("{n}", String(summary.items.length))}
      </p>
      <div className="grid gap-1.5">
        {summary.items.map((item) => (
          <div
            key={item.activityId}
            className="flex items-center justify-between gap-3 px-3 py-2 rounded-[12px] border border-line bg-surface"
          >
            <span className="text-[12.5px] text-ink font-medium">{item.label}</span>
            <div className="flex items-center gap-2 shrink-0">
              {item.minutes > 0 && (
                <span className="font-mono text-[11px] text-ink-faint">{item.minutes} min</span>
              )}
              {item.hasFrequentExceptions && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-gold-soft text-gold">
                  {t.exceptionsCaveat}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
