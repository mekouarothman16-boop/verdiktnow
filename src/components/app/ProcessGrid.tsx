"use client";

import { useMemo, useState } from "react";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { Archive, ArchiveRestore, ArrowRight, Columns3, Copy, Download, Link2, Search, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { archiveProcess, deleteProcess, duplicateProcess, unarchiveProcess } from "@/lib/supabase/processActions";
import { LEVELS } from "@/lib/scoring";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";
import type { Locale } from "@/i18n/config";

const MAX_COMPARE = 4;

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function statusLabel(p: ProcessCardData, t: ReturnType<typeof useDictionary>["tool"]["processGrid"]): string {
  return p.answeredCount >= p.totalQuestions
    ? t.statusComplete
    : p.answeredCount > 0
    ? t.statusIncomplete
    : t.statusNotStarted;
}

function downloadCsv(rows: ProcessCardData[], t: ReturnType<typeof useDictionary>["tool"]["processGrid"], locale: Locale) {
  const header = [
    t.csvHeaderName,
    t.csvHeaderCategory,
    t.csvHeaderTags,
    t.csvHeaderCurrency,
    t.csvHeaderStatus,
    t.csvHeaderAptitudeScore,
    t.csvHeaderValueScore,
    t.csvHeaderUpdatedAt,
  ];
  const dateLocale = locale === "en" ? "en-CA" : "fr-CA";
  const lines = rows.map((p) => {
    const status = statusLabel(p, t);
    return [
      csvCell(p.name),
      csvCell(p.categoryLabel ?? ""),
      csvCell(p.tags.join("; ")),
      csvCell(p.currency),
      csvCell(status),
      csvCell(p.score ?? ""),
      csvCell(p.valueScore ?? ""),
      csvCell(new Date(p.updatedAt).toLocaleDateString(dateLocale)),
    ].join(",");
  });
  const csv = "﻿" + [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cadran-portefeuille-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type ProcessCardData = {
  id: string;
  name: string;
  currency: string;
  updatedAt: string;
  archivedAt: string | null;
  tags: string[];
  score: number | null;
  valueScore: number | null;
  categoryLabel: string | null;
  answeredCount: number;
  totalQuestions: number;
  similar: string[];
};

type SortKey = "recent" | "score" | "name";

export function ProcessGrid({ processes, readOnly = false }: { processes: ProcessCardData[]; readOnly?: boolean }) {
  const locale = useLocale();
  const { processGrid: t } = useDictionary().tool;
  const dateLocale = locale === "en" ? "en-CA" : "fr-CA";
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const archivedCount = processes.filter((p) => p.archivedAt).length;

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < MAX_COMPARE ? [...prev, id] : prev
    );
  };

  const compared = compareIds.map((id) => processes.find((p) => p.id === id)).filter((p): p is ProcessCardData => !!p);

  const categories = useMemo(
    () => Array.from(new Set(processes.map((p) => p.categoryLabel).filter((c): c is string => !!c))).sort((a, b) => a.localeCompare(b, locale)),
    [processes, locale]
  );

  const filtered = useMemo(() => {
    let list = processes.filter((p) => (showArchived ? true : !p.archivedAt));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.tags.some((tag) => tag.toLowerCase().includes(q)));
    }
    if (categoryFilter) list = list.filter((p) => p.categoryLabel === categoryFilter);

    const sorted = [...list];
    if (sortBy === "recent") sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    else if (sortBy === "score") sorted.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    else sorted.sort((a, b) => a.name.localeCompare(b.name, locale));
    return sorted;
  }, [processes, query, categoryFilter, sortBy, showArchived, locale]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-line text-[13.5px] text-ink outline-none bg-surface focus:border-accent transition-colors"
          />
        </div>
        {categories.length > 1 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-line text-[13px] text-ink-soft outline-none bg-surface focus:border-accent transition-colors cursor-pointer"
          >
            <option value="">{t.allCategories}</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="px-3 py-2.5 rounded-lg border border-line text-[13px] text-ink-soft outline-none bg-surface focus:border-accent transition-colors cursor-pointer"
        >
          <option value="recent">{t.sortRecent}</option>
          <option value="score">{t.sortScore}</option>
          <option value="name">{t.sortName}</option>
        </select>
        <button
          onClick={() => downloadCsv(filtered, t, locale)}
          title={t.csvExportTooltip}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-line text-[13px] text-ink-soft hover:border-accent hover:text-accent transition-colors"
        >
          <Download size={14} /> {t.csvButtonLabel}
        </button>
        <button
          onClick={() => {
            setCompareMode((v) => !v);
            if (compareMode) setCompareIds([]);
          }}
          title={t.compareTooltip}
          className={
            compareMode
              ? "flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-accent bg-accent-soft text-[13px] text-accent-deep font-semibold transition-colors"
              : "flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-line text-[13px] text-ink-soft hover:border-accent hover:text-accent transition-colors"
          }
        >
          <Columns3 size={14} /> {t.compareButtonLabel}
        </button>
        {archivedCount > 0 && (
          <button
            onClick={() => setShowArchived((v) => !v)}
            title={t.archivesTooltip}
            className={
              showArchived
                ? "flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-accent bg-accent-soft text-[13px] text-accent-deep font-semibold transition-colors"
                : "flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-line text-[13px] text-ink-soft hover:border-accent hover:text-accent transition-colors"
            }
          >
            <Archive size={14} /> {t.archivesButtonLabel.replace("{n}", String(archivedCount))}
          </button>
        )}
      </div>

      {compareMode && compared.length >= 2 && (
        <Card className="p-5 mb-5 overflow-x-auto">
          <Eyebrow className="mb-3">{t.compareHeader.replace("{n}", String(compared.length)).replace("{max}", String(MAX_COMPARE))}</Eyebrow>
          <table className="w-full text-[12.5px] border-collapse">
            <tbody>
              <tr>
                <td className="pr-4 py-2 text-ink-faint align-bottom w-[140px]">&nbsp;</td>
                {compared.map((p) => (
                  <td key={p.id} className="px-3 py-2 align-bottom min-w-[160px]">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-sans font-semibold text-ink leading-snug">{p.name}</span>
                      <button onClick={() => toggleCompare(p.id)} aria-label={t.removeFromCompareAriaLabel} className="text-ink-faint hover:text-coral shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                ))}
              </tr>
              {([
                [t.compareRowStatus, (p: ProcessCardData) => (p.answeredCount >= p.totalQuestions ? t.statusComplete : p.answeredCount > 0 ? t.statusIncompleteWithCount.replace("{answered}", String(p.answeredCount)).replace("{total}", String(p.totalQuestions)) : t.statusNotStarted)],
                [t.compareRowAptitude, (p: ProcessCardData) => (p.score != null && p.answeredCount >= p.totalQuestions ? `${p.score}/100` : t.emptyValue)],
                [t.compareRowValue, (p: ProcessCardData) => (p.valueScore != null ? `${p.valueScore}/100` : t.emptyValue)],
                [t.compareRowCategory, (p: ProcessCardData) => p.categoryLabel ?? t.emptyValue],
                [t.compareRowTags, (p: ProcessCardData) => (p.tags.length > 0 ? p.tags.join(", ") : t.emptyValue)],
                [t.compareRowCurrency, (p: ProcessCardData) => p.currency],
                [t.compareRowUpdatedAt, (p: ProcessCardData) => new Date(p.updatedAt).toLocaleDateString(dateLocale)],
              ] as [string, (p: ProcessCardData) => string][]).map(([label, get]) => (
                <tr key={label} className="border-t border-line-soft">
                  <td className="pr-4 py-2.5 text-ink-faint">{label}</td>
                  {compared.map((p) => (
                    <td key={p.id} className="px-3 py-2.5 font-mono text-ink">{get(p)}</td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-line-soft">
                <td className="pr-4 py-2.5">&nbsp;</td>
                {compared.map((p) => (
                  <td key={p.id} className="px-3 py-2.5">
                    <LocaleLink href={`/outil/${p.id}`} className="text-[12px] font-semibold text-accent hover:underline">
                      {t.openArrow}
                    </LocaleLink>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </Card>
      )}
      {compareMode && compared.length < 2 && (
        <div className="mb-5 text-[12.5px] text-ink-faint">{t.compareMinHint.replace("{max}", String(MAX_COMPARE))}</div>
      )}

      {filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-ink-soft text-[13.5px]">{t.noResults}</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const isComplete = p.answeredCount >= p.totalQuestions;
            const isStarted = p.answeredCount > 0;
            const level = isComplete && p.score != null ? LEVELS[Math.min(4, Math.floor(p.score / 20))] : null;
            const isChecked = compareIds.includes(p.id);
            const isArchived = !!p.archivedAt;
            return (
              <Card key={p.id} className={compareMode && isChecked ? "p-5 flex flex-col ring-2 ring-accent" : isArchived ? "p-5 flex flex-col opacity-70" : "p-5 flex flex-col"}>
                {compareMode && (
                  <label className="flex items-center gap-2 mb-3 text-[12px] text-ink-soft cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={!isChecked && compareIds.length >= MAX_COMPARE}
                      onChange={() => toggleCompare(p.id)}
                      className="cursor-pointer"
                    />
                    {t.compareCheckboxLabel}
                  </label>
                )}
                <LocaleLink href={`/outil/${p.id}`} className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h2 className="font-sans text-[15.5px] font-semibold text-ink leading-snug">{p.name}</h2>
                    {isArchived ? (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-line-soft text-ink-faint font-mono text-[10px] font-semibold">
                        {t.archivedBadge}
                      </span>
                    ) : level ? (
                      <span
                        className="shrink-0 px-2 py-0.5 rounded-full text-white font-mono text-[10px] font-semibold"
                        style={{ background: level.color }}
                      >
                        {p.score}
                      </span>
                    ) : isStarted ? (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber/10 text-amber font-mono text-[10px] font-semibold">
                        {t.statusIncompleteWithCount.replace("{answered}", String(p.answeredCount)).replace("{total}", String(p.totalQuestions))}
                      </span>
                    ) : (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-line-soft text-ink-faint font-mono text-[10px] font-semibold">
                        {t.statusNotStarted}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11.5px] text-ink-faint font-mono">
                    <span>{p.currency}</span>
                    {p.valueScore != null && <span>{t.valueScoreLabel.replace("{n}", String(p.valueScore))}</span>}
                  </div>
                  {p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {p.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-accent-soft text-accent-deep text-[10.5px] font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {p.similar.length > 0 && (
                    <div className="flex items-start gap-1.5 mt-2.5 text-[11px] text-ink-faint leading-snug">
                      <Link2 size={12} className="shrink-0 mt-0.5 text-accent" />
                      <span>{t.similarTo.replace("{names}", p.similar.join(", "))}</span>
                    </div>
                  )}
                </LocaleLink>
                <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-line-soft">
                  <LocaleLink
                    href={`/outil/${p.id}`}
                    className="flex items-center gap-1 text-[12.5px] font-semibold text-accent hover:underline"
                  >
                    {isComplete ? t.openButton : isStarted ? t.continueButton : t.startButton} <ArrowRight size={13} />
                  </LocaleLink>
                  {!readOnly && (
                    <div className="flex items-center gap-1">
                      <form action={duplicateProcess.bind(null, p.id)}>
                        <button
                          type="submit"
                          aria-label={t.duplicateAriaLabel}
                          title={t.duplicateTooltip}
                          className="text-ink-faint hover:text-accent transition-colors p-1"
                        >
                          <Copy size={15} />
                        </button>
                      </form>
                      {isArchived ? (
                        <>
                          <form action={unarchiveProcess.bind(null, p.id)}>
                            <button
                              type="submit"
                              aria-label={t.unarchiveAriaLabel}
                              title={t.unarchiveTooltip}
                              className="text-ink-faint hover:text-accent transition-colors p-1"
                            >
                              <ArchiveRestore size={15} />
                            </button>
                          </form>
                          <form action={deleteProcess.bind(null, p.id)}>
                            <button
                              type="submit"
                              aria-label={t.deleteAriaLabel}
                              title={t.deleteTooltip}
                              className="text-ink-faint hover:text-coral transition-colors p-1"
                            >
                              <Trash2 size={15} />
                            </button>
                          </form>
                        </>
                      ) : (
                        <form action={archiveProcess.bind(null, p.id)}>
                          <button
                            type="submit"
                            aria-label={t.archiveAriaLabel}
                            title={t.archiveTooltip}
                            className="text-ink-faint hover:text-coral transition-colors p-1"
                          >
                            <Archive size={15} />
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
