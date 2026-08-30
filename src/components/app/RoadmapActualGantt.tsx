"use client";

import { useMemo } from "react";
import { Compass, CalendarRange } from "lucide-react";
import clsx from "clsx";
import type { Locale } from "@/i18n/config";

export type ActualGanttItem = {
  key: string;
  label: string;
  startDate: string | null;
  dueDate: string | null;
  done: boolean;
  progressPercent: number;
};

type ActualGanttDict = {
  actualGanttTitle: string;
  actualGanttSubtitle: string;
  actualGanttEmptyText: string;
  ganttTodayLabel: string;
  actualGanttBarAriaLabel: string;
};

const DAY_MS = 24 * 3600 * 1000;

function startOfDay(iso: string): number {
  return new Date(`${iso}T00:00:00`).getTime();
}

/** Premier jour de chaque mois couvert par [minMs, maxMs], bornes incluses — sert de grille et
 * d'étiquettes sur un axe en dates réelles (contrairement au Gantt recommandé, qui compte en
 * semaines depuis aujourd'hui, celui-ci doit afficher de vrais mois civils). */
function eachMonthStart(minMs: number, maxMs: number): Date[] {
  const out: Date[] = [];
  const d = new Date(minMs);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  while (d.getTime() <= maxMs) {
    out.push(new Date(d));
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

/** Deuxième aperçu du calendrier : contrairement à `RoadmapGantt` (semaines depuis aujourd'hui,
 * durées recommandées par phase), celui-ci trace une barre par action à partir des dates de début
 * et de fin réellement saisies dans le tableau de bord — un calendrier planifié, pas indicatif. */
export function RoadmapActualGantt({
  items,
  locale,
  t,
}: {
  items: ActualGanttItem[];
  locale: Locale;
  t: ActualGanttDict;
}) {
  const todayMs = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);
  const monthFormatter = useMemo(() => new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "fr-CA", { month: "short", year: "numeric" }), [locale]);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "fr-CA", { day: "numeric", month: "short" }), [locale]);

  const scheduled = items.filter((i): i is ActualGanttItem & { startDate: string; dueDate: string } => !!i.startDate && !!i.dueDate);

  return (
    <div className="rounded-xl border border-line bg-surface p-5 mb-5">
      <div className="text-[13.5px] font-semibold text-ink mb-1">{t.actualGanttTitle}</div>
      <p className="text-[12px] text-ink-faint leading-relaxed mb-4 max-w-[560px]">{t.actualGanttSubtitle}</p>

      {scheduled.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg bg-bg px-4 py-3.5">
          <CalendarRange size={16} className="text-ink-faint shrink-0" />
          <p className="text-[12.5px] text-ink-faint leading-relaxed">{t.actualGanttEmptyText}</p>
        </div>
      ) : (
        (() => {
          const starts = scheduled.map((i) => startOfDay(i.startDate));
          const ends = scheduled.map((i) => startOfDay(i.dueDate));
          const minMs = Math.min(...starts, todayMs);
          const maxMs = Math.max(...ends, todayMs);
          const totalDays = Math.max(1, (maxMs - minMs) / DAY_MS);
          const xOf = (ms: number) => ((ms - minMs) / DAY_MS / totalDays) * 100;
          const todayPct = xOf(todayMs);
          const months = eachMonthStart(minMs, maxMs);

          return (
            <>
              <div className="flex flex-col gap-2.5">
                {scheduled.map((row) => {
                  const startMs = startOfDay(row.startDate);
                  const endMs = startOfDay(row.dueDate);
                  const leftPct = xOf(startMs);
                  const widthPct = Math.max(xOf(endMs) - leftPct, 2);
                  const overdue = !row.done && endMs < todayMs;
                  const label = t.actualGanttBarAriaLabel
                    .replace("{label}", row.label)
                    .replace("{start}", dateFormatter.format(new Date(startMs)))
                    .replace("{end}", dateFormatter.format(new Date(endMs)))
                    .replace("{percent}", String(row.progressPercent));
                  return (
                    <div key={row.key} className="grid grid-cols-[104px_1fr] sm:grid-cols-[160px_1fr] gap-2.5 items-center">
                      <div className="text-[11.5px] font-medium text-ink-soft truncate" title={row.label}>
                        {row.label}
                      </div>
                      <div className="relative h-7" title={label}>
                        <div className="absolute inset-0 rounded-md bg-bg" />
                        {months.map((m, i) => (
                          <div key={i} className="absolute inset-y-0 border-l border-line-soft" style={{ left: `${xOf(m.getTime())}%` }} />
                        ))}
                        <div className="absolute inset-y-0 w-px bg-accent/60" style={{ left: `${todayPct}%` }} />
                        <div
                          className={clsx(
                            "absolute inset-y-0 rounded-md border overflow-hidden",
                            overdue ? "border-coral/40 bg-coral/10" : "border-accent/25 bg-accent-soft/60"
                          )}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        >
                          <div
                            className={clsx("h-full", row.done ? "bg-accent" : overdue ? "bg-coral/60" : "bg-accent/70")}
                            style={{ width: `${row.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-[104px_1fr] sm:grid-cols-[160px_1fr] gap-2.5 mt-1.5">
                <div />
                <div className="relative h-7">
                  <div
                    className="absolute -top-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-accent-soft border border-accent/40 text-accent-deep -translate-x-1/2"
                    style={{ left: `${todayPct}%` }}
                    title={t.ganttTodayLabel}
                  >
                    <Compass size={10} strokeWidth={2.25} />
                  </div>
                  {months.map((m, i) => (
                    <div
                      key={i}
                      className="absolute top-3.5 text-[9.5px] font-mono text-ink-faint -translate-x-1/2 whitespace-nowrap"
                      style={{ left: `${xOf(m.getTime())}%` }}
                    >
                      {monthFormatter.format(m)}
                    </div>
                  ))}
                </div>
              </div>
            </>
          );
        })()
      )}
    </div>
  );
}
