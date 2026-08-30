"use client";

import { useMemo } from "react";
import { Compass, TrendingUp } from "lucide-react";
import clsx from "clsx";
import type { Locale } from "@/i18n/config";

export type GanttRow = {
  key: string;
  label: string;
  /** null pour la rangée "Actions immédiates", qui n'a pas d'échéance formelle affichée ailleurs. */
  timeframe: string | null;
  startWeek: number;
  durationWeeks: number;
  isImmediate: boolean;
  doneCount: number;
  totalCount: number;
  milestones: { text: string; dueDate: string; done: boolean }[];
};

type GanttDict = {
  ganttTitle: string;
  ganttSubtitle: string;
  ganttTodayLabel: string;
  ganttMonthLabel: string;
  ganttBarAriaLabel: string;
  ganttMilestoneOverdue: string;
  ganttMilestoneTooltip: string;
  ganttMilestoneBeyondRange: string;
  ganttPaybackLabel: string;
  ganttPaybackBeyondRange: string;
};

const WEEK_MS = 7 * 24 * 3600 * 1000;

/** Décalage en semaines (peut être négatif ou fractionnaire) entre une date ISO et aujourd'hui —
 * l'axe du Gantt a toujours pour origine "aujourd'hui", jamais une date de début fixée. */
function weeksFromToday(dateIso: string, todayIso: string): number {
  return (new Date(`${dateIso}T00:00:00`).getTime() - new Date(`${todayIso}T00:00:00`).getTime()) / WEEK_MS;
}

export function RoadmapGantt({
  rows,
  locale,
  onSelectRow,
  paybackMonths = null,
  t,
}: {
  rows: GanttRow[];
  locale: Locale;
  onSelectRow: (key: string) => void;
  /** Délai de récupération de l'investissement, en mois (issu du calcul ROI) — null si les
   * économies nettes ne sont pas positives, auquel cas aucun repère n'est affiché. */
  paybackMonths?: number | null;
  t: GanttDict;
}) {
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "fr-CA", { day: "numeric", month: "short" }),
    [locale]
  );
  // Plancher à 40 semaines (span des 3 phases par défaut) — une échéance saisie très en avance
  // peut l'étendre, mais jamais la rétrécir : le Gantt garde toujours une vue d'ensemble lisible.
  const totalWeeks = Math.max(40, ...rows.map((r) => r.startWeek + r.durationWeeks));
  const monthCount = Math.floor(totalWeeks / 4);
  // Même convention que monthCount (1 mois = 4 semaines) pour rester sur le même axe que les barres.
  const paybackWeek = paybackMonths != null ? paybackMonths * 4 : null;
  const paybackBeyond = paybackWeek != null && paybackWeek > totalWeeks;
  const paybackPct = paybackWeek != null ? (Math.min(paybackWeek, totalWeeks) / totalWeeks) * 100 : null;

  return (
    <div className="rounded-xl border border-line bg-surface p-5 mb-5">
      <div className="text-[13.5px] font-semibold text-ink mb-1">{t.ganttTitle}</div>
      <p className="text-[12px] text-ink-faint leading-relaxed mb-4 max-w-[560px]">{t.ganttSubtitle}</p>

      <div className="flex flex-col gap-2.5">
        {rows.map((row) => {
          const leftPct = (row.startWeek / totalWeeks) * 100;
          const widthPct = Math.max((row.durationWeeks / totalWeeks) * 100, 2.5);
          const progressPct = row.totalCount > 0 ? (row.doneCount / row.totalCount) * 100 : 0;
          const complete = row.totalCount > 0 && row.doneCount === row.totalCount;
          return (
            <div key={row.key} className="grid grid-cols-[104px_1fr_38px] sm:grid-cols-[160px_1fr_42px] gap-2.5 items-center">
              <div className="text-[11.5px] font-medium text-ink-soft truncate" title={row.label}>
                {row.label}
              </div>
              <button
                type="button"
                onClick={() => onSelectRow(row.key)}
                aria-label={t.ganttBarAriaLabel
                  .replace("{label}", row.label)
                  .replace("{timeframe}", row.timeframe ?? "")
                  .replace("{done}", String(row.doneCount))
                  .replace("{total}", String(row.totalCount))}
                className="relative h-7 group cursor-pointer"
              >
                <div className="absolute inset-0 rounded-md bg-bg" />
                {Array.from({ length: monthCount + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-y-0 border-l border-line-soft"
                    style={{ left: `${((i * 4) / totalWeeks) * 100}%` }}
                  />
                ))}
                {/* Repère "aujourd'hui", identique dans chaque rangée (toujours à 0 %) — la boussole
                 * de l'axe en dessous nomme ce que cette ligne pointe, sans répéter le mot à chaque
                 * rangée. */}
                <div className="absolute inset-y-0 left-0 w-px bg-accent/60" />
                {paybackPct != null && (
                  <div
                    className="absolute inset-y-0 w-px border-l border-dashed border-teal/70"
                    style={{ left: `${paybackPct}%` }}
                  />
                )}
                <div
                  className={clsx(
                    "absolute inset-y-0 rounded-md border overflow-hidden transition-[filter] group-hover:brightness-95",
                    row.isImmediate ? "border-gold-tint bg-gold-soft" : "border-accent/25 bg-accent-soft/60"
                  )}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                >
                  <div
                    className={clsx(
                      "h-full transition-[width] duration-300",
                      complete ? "bg-accent" : row.isImmediate ? "bg-gold-tint" : "bg-accent/70"
                    )}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {row.milestones.map((m, i) => {
                  const wk = weeksFromToday(m.dueDate, todayIso);
                  const overdue = wk < 0 && !m.done;
                  const beyond = wk > totalWeeks;
                  const clampedWeek = Math.min(Math.max(wk, 0), totalWeeks);
                  const pct = (clampedWeek / totalWeeks) * 100;
                  const suffix = overdue
                    ? ` (${t.ganttMilestoneOverdue})`
                    : beyond
                      ? ` (${t.ganttMilestoneBeyondRange})`
                      : "";
                  const label = t.ganttMilestoneTooltip
                    .replace("{text}", m.text)
                    .replace("{date}", dateFormatter.format(new Date(`${m.dueDate}T00:00:00`)))
                    .replace("{overdue}", suffix);
                  return (
                    <div
                      key={i}
                      title={label}
                      className={clsx(
                        "absolute top-1/2 w-2 h-2 -mt-1 -ml-1 rotate-45 border",
                        m.done
                          ? "bg-accent border-accent-deep"
                          : overdue
                            ? "bg-coral border-coral"
                            : "bg-surface border-ink-soft"
                      )}
                      style={{ left: `${pct}%` }}
                    />
                  );
                })}
              </button>
              <div className="text-[10.5px] font-mono text-ink-faint text-right tabular-nums">
                {row.doneCount}/{row.totalCount}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-[104px_1fr_38px] sm:grid-cols-[160px_1fr_42px] gap-2.5 mt-1.5">
        <div />
        {/* Deux lignes plutôt qu'une : le repère « aujourd'hui » (toujours à 0 %) et « Mois 1 »
         * (toujours à 10 % de largeur) sont trop proches pour partager la même ligne sans se
         * chevaucher — les séparer verticalement règle ça sans jamais avoir à sacrifier le mois 1. */}
        <div className="relative h-7">
          <div
            className="absolute -left-1 -top-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-accent-soft border border-accent/40 text-accent-deep"
            title={t.ganttTodayLabel}
          >
            <Compass size={10} strokeWidth={2.25} />
          </div>
          {paybackPct != null && (
            <div
              className="absolute -top-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-teal/10 border border-teal/40 text-teal -translate-x-1/2"
              style={{ left: `${paybackPct}%` }}
              title={
                paybackBeyond
                  ? t.ganttPaybackBeyondRange.replace("{n}", String(Math.round(paybackMonths!)))
                  : t.ganttPaybackLabel.replace("{n}", String(Math.round(paybackMonths!)))
              }
            >
              <TrendingUp size={10} strokeWidth={2.25} />
            </div>
          )}
          {/* Sur mobile, la piste est trop étroite pour 10 étiquettes de mois côte à côte :
           * seuls les multiples de 6 restent visibles (les autres réapparaissent dès sm:). */}
          {Array.from({ length: monthCount }).map((_, i) => {
            const month = i + 1;
            return (
              <div
                key={i}
                className={clsx(
                  "absolute top-3.5 text-[9.5px] font-mono text-ink-faint -translate-x-1/2 whitespace-nowrap",
                  month % 6 === 0 ? "block" : "hidden sm:block"
                )}
                style={{ left: `${((month * 4) / totalWeeks) * 100}%` }}
              >
                {t.ganttMonthLabel.replace("{n}", String(month))}
              </div>
            );
          })}
        </div>
        <div />
      </div>
    </div>
  );
}
