"use client";

import { useState } from "react";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useDictionary } from "@/i18n/LocaleProvider";

type Point = { id: string; name: string; A: number; V: number };

export function PortfolioRanking({ points }: { points: Point[] }) {
  const { portfolioRanking: t } = useDictionary().tool;
  const [weightV, setWeightV] = useState(50);

  const ranked = points
    .map((p) => ({ ...p, score: Math.round(((100 - weightV) * p.A + weightV * p.V) / 100) }))
    .sort((a, b) => b.score - a.score);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <div className="flex items-center gap-3 text-[11.5px] text-ink-faint">
          <span className={weightV <= 50 ? "text-ink font-semibold" : ""}>{t.aptitudeLabel}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={weightV}
            onChange={(e) => setWeightV(Number(e.target.value))}
            className="w-[120px] accent-accent"
            aria-label={t.weightAriaLabel}
          />
          <span className={weightV >= 50 ? "text-ink font-semibold" : ""}>{t.valueLabel}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-ink-faint text-[11px] uppercase tracking-wide">
              <th className="py-2 pr-3 font-medium">{t.colRank}</th>
              <th className="py-2 pr-3 font-medium">{t.colProcess}</th>
              <th className="py-2 pr-3 font-medium text-right">{t.colAptitude}</th>
              <th className="py-2 pr-3 font-medium text-right">{t.colValue}</th>
              <th className="py-2 pl-3 font-medium text-right">{t.colComposite}</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((p, i) => (
              <tr key={p.id} className="border-b border-line/60 last:border-0">
                <td className="py-2 pr-3 font-mono text-ink-faint">{i + 1}</td>
                <td className="py-2 pr-3">
                  <LocaleLink href={`/outil/${p.id}`} className="text-ink font-medium hover:text-accent transition-colors">
                    {p.name}
                  </LocaleLink>
                </td>
                <td className="py-2 pr-3 text-right font-mono text-ink-soft">{p.A}</td>
                <td className="py-2 pr-3 text-right font-mono text-ink-soft">{p.V}</td>
                <td className="py-2 pl-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-line overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${p.score}%` }} />
                    </div>
                    <span className="font-mono font-semibold text-ink w-7 text-right">{p.score}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
