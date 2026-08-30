"use client";

import { useState } from "react";
import { AlertTriangle, FileText, Sparkles, Loader2, Calculator } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionHero } from "@/components/ui/SectionHero";
import { FieldHint } from "@/components/ui/FieldHint";
import {
  AnalysisResult, clamp, Context, DIMENSIONS, getApplicableContextQuestions, getContextSections,
  getProcessCategories, getQuickWins, getRegulationTags, getVolumeVariabilityOptions, parseActivities,
  parseAiSeededAnswers, parseAttachmentLinks, parseProcessDependencies, ProcessActivity, RoiInputs,
  serializeActivities, serializeAiSeededAnswers, serializeAttachmentLinks, serializeProcessDependencies,
} from "@/lib/scoring";
import { ActivityList } from "./ActivityList";
import { AttachmentList } from "./AttachmentList";
import { QuickWins } from "./QuickWins";
import { ToolInventory } from "./ToolInventory";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";

export function ContextSection({
  context,
  setContext,
  setAnswers,
  processName,
  processId,
  initialAnalysis = null,
  onAnalysisChange,
  onApplyRoi,
  aiQuota = null,
  aiUsedThisMonth = 0,
  readOnly = false,
  siblings = [],
}: {
  context: Context;
  setContext: (fn: (prev: Context) => Context) => void;
  setAnswers: (fn: (prev: Record<string, number>) => Record<string, number>) => void;
  processName: string;
  processId?: string;
  initialAnalysis?: AnalysisResult | null;
  onAnalysisChange?: (a: AnalysisResult | null) => void;
  onApplyRoi?: (patch: Partial<RoiInputs>) => void;
  aiQuota?: number | null;
  aiUsedThisMonth?: number;
  readOnly?: boolean;
  /** Autres processus du portefeuille (hors archivés, hors celui-ci) — pour le sélecteur de dépendances. */
  siblings?: { id: string; name: string }[];
}) {
  const locale = useLocale();
  const { contextSection: t } = useDictionary().tool;
  const aiRemaining = aiQuota != null ? Math.max(aiQuota - aiUsedThisMonth, 0) : null;
  const aiExhausted = aiRemaining === 0;
  const aiLow = aiRemaining != null && aiRemaining > 0 && aiRemaining <= 3;
  const set = (id: string, v: string) => setContext((p) => ({ ...p, [id]: v }));
  const applicableQuestions = getApplicableContextQuestions(context.category, locale);
  const filled = applicableQuestions.filter((q) => (context[q.id] || "").trim()).length;
  const selectedRegulations = (context.regulations || "").split(";").filter(Boolean);
  const toggleRegulation = (tagId: string) => {
    const next = selectedRegulations.includes(tagId)
      ? selectedRegulations.filter((id) => id !== tagId)
      : [...selectedRegulations, tagId];
    set("regulations", next.join(";"));
  };
  const selectedDependencies = parseProcessDependencies(context);
  const toggleDependency = (id: string) => {
    const next = selectedDependencies.includes(id)
      ? selectedDependencies.filter((depId) => depId !== id)
      : [...selectedDependencies, id];
    set("dependsOn", serializeProcessDependencies(next));
  };
  const contextSections = getContextSections(locale);
  const questionsBySection = contextSections.map((section) => ({
    section,
    questions: applicableQuestions.filter((q) => q.section === section),
  })).filter((g) => g.questions.length > 0);
  const activities = parseActivities(context);
  const setActivitiesList = (fn: (prev: ProcessActivity[]) => ProcessActivity[]) =>
    setContext((p) => ({ ...p, activities: serializeActivities(fn(parseActivities(p))) }));
  const attachmentLinks = parseAttachmentLinks(context);
  const setAttachmentLink = (path: string, activityId: string) =>
    setContext((p) => ({
      ...p,
      attachmentLinks: serializeAttachmentLinks({ ...parseAttachmentLinks(p), [path]: activityId }),
    }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysisState] = useState<AnalysisResult | null>(initialAnalysis);
  const [roiApplied, setRoiApplied] = useState(false);
  const setAnalysis = (a: AnalysisResult | null) => {
    setAnalysisState(a);
    onAnalysisChange?.(a);
  };

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setRoiApplied(false);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processName, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.analysisFailed);
      setAnalysis(data as AnalysisResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.analysisFailedRetry);
    } finally {
      setLoading(false);
    }
  };

  const applyRoi = () => {
    if (!analysis?.roiSuggestion || !onApplyRoi) return;
    const { volume, minutes, hourlyCost, errorRate, reworkMin } = analysis.roiSuggestion;
    onApplyRoi({ volume, minutes, hourlyCost, errorRate, reworkMin });
    setRoiApplied(true);
  };

  const applyScores = () => {
    if (!analysis?.scores) return;
    const clean: Record<string, number> = {};
    DIMENSIONS.forEach((d) =>
      d.questions.forEach((_, i) => {
        const k = `${d.id}-${i}`;
        const v = analysis.scores[k];
        if (typeof v === "number") clean[k] = clamp(Math.round(v), 0, 4);
      })
    );
    setAnswers((prev) => ({ ...prev, ...clean }));
    setContext((p) => ({
      ...p,
      aiSeededAnswers: serializeAiSeededAnswers({ ...parseAiSeededAnswers(p), ...clean }),
    }));
  };

  const leverPreview = analysis?.scores
    ? DIMENSIONS.map((d) => {
        const vals = d.questions
          .map((_, i) => analysis.scores[`${d.id}-${i}`])
          .filter((v) => typeof v === "number");
        const avg = vals.length
          ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length / 4) * 100)
          : null;
        return { id: d.id, label: d.label, avg, comment: analysis.leviers?.[d.id] };
      })
    : [];

  return (
    <>
      <SectionHero
        eyebrow={t.eyebrowStep}
        title={t.title}
        sub={t.sub}
      />
      <Card className="p-6 mb-6">
      <div className="print-header hidden mb-2.5">
        <Eyebrow>{t.printHeader}</Eyebrow>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-accent" />
          <Eyebrow>{t.detailsEyebrow}</Eyebrow>
        </div>
        <span className="font-mono text-[11px] text-ink-faint">
          {t.filledCount.replace("{filled}", String(filled)).replace("{total}", String(applicableQuestions.length))}
        </span>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <label className="block">
          <span className="text-[12.5px] text-ink-soft block mb-1.5">{t.categoryLabel}</span>
          <select
            value={context.category || ""}
            onChange={(e) => set("category", e.target.value)}
            disabled={readOnly}
            className="w-full border border-line rounded-lg px-[11px] py-2.5 font-sans text-[13.5px] text-ink outline-none bg-surface focus:border-accent transition-colors cursor-pointer disabled:text-ink-faint disabled:cursor-not-allowed"
          >
            <option value="">{t.selectPlaceholder}</option>
            {getProcessCategories(locale).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[12.5px] text-ink-soft block mb-1.5">{t.volumeVariabilityLabel}</span>
          <select
            value={context.volumeVariability || ""}
            onChange={(e) => set("volumeVariability", e.target.value)}
            disabled={readOnly}
            className="w-full border border-line rounded-lg px-[11px] py-2.5 font-sans text-[13.5px] text-ink outline-none bg-surface focus:border-accent transition-colors cursor-pointer disabled:text-ink-faint disabled:cursor-not-allowed"
          >
            <option value="">{t.selectPlaceholder}</option>
            {getVolumeVariabilityOptions(locale).map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mb-4">
        <span className="text-[12.5px] text-ink-soft block mb-1.5">{t.regulationsLabel}</span>
        <div className="flex flex-wrap gap-2">
          {getRegulationTags(locale).map((tag) => {
            const on = selectedRegulations.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => !readOnly && toggleRegulation(tag.id)}
                disabled={readOnly}
                className={
                  on
                    ? "px-3 py-1.5 rounded-full border border-accent bg-accent-soft text-accent-deep text-[12px] font-medium transition-colors disabled:cursor-not-allowed"
                    : "px-3 py-1.5 rounded-full border border-line text-ink-soft text-[12px] font-medium hover:border-accent hover:text-accent transition-colors disabled:cursor-not-allowed"
                }
              >
                {tag.label}
              </button>
            );
          })}
        </div>
        {selectedRegulations.includes("other") && (
          <input
            type="text"
            value={context.regulationsOther || ""}
            onChange={(e) => set("regulationsOther", e.target.value)}
            placeholder={t.regulationsOtherPlaceholder}
            disabled={readOnly}
            className="w-full mt-2.5 border border-line rounded-lg px-[11px] py-2.5 font-sans text-[13.5px] text-ink outline-none bg-surface focus:border-accent transition-colors disabled:text-ink-faint disabled:cursor-not-allowed"
          />
        )}
      </div>
      {siblings.length > 0 && (
        <div className="mb-4">
          <span className="flex items-center gap-1.5 text-[12.5px] text-ink-soft mb-1.5">
            {t.dependenciesLabel}
            <FieldHint text={t.dependenciesHint} />
          </span>
          <div className="flex flex-wrap gap-2">
            {siblings.map((s) => {
              const on = selectedDependencies.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => !readOnly && toggleDependency(s.id)}
                  disabled={readOnly}
                  className={
                    on
                      ? "px-3 py-1.5 rounded-full border border-accent bg-accent-soft text-accent-deep text-[12px] font-medium transition-colors disabled:cursor-not-allowed"
                      : "px-3 py-1.5 rounded-full border border-line text-ink-soft text-[12px] font-medium hover:border-accent hover:text-accent transition-colors disabled:cursor-not-allowed"
                  }
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {questionsBySection.map((group) => (
        <div key={group.section} className="mb-5 last:mb-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-faint mb-2.5">
            {group.section}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {group.questions.map((q) => (
              <label key={q.id} className={q.long ? "block sm:col-span-2" : "block"}>
                <span className="flex items-center gap-1.5 text-[12.5px] text-ink-soft mb-1.5">
                  {q.label}
                  <FieldHint text={q.hint} />
                </span>
                <textarea
                  value={context[q.id] || ""}
                  onChange={(e) => set(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  rows={q.long ? 3 : 2}
                  disabled={readOnly}
                  className="w-full border border-line rounded-lg px-[11px] py-2.5 font-sans text-[13.5px] text-ink outline-none resize-y leading-relaxed bg-surface focus:border-accent transition-colors disabled:text-ink-faint disabled:cursor-not-allowed"
                />
              </label>
            ))}
          </div>
        </div>
      ))}

      <ToolInventory context={context} setContext={setContext} readOnly={readOnly} />

      <ActivityList activities={activities} setActivities={setActivitiesList} readOnly={readOnly} onApplyRoi={onApplyRoi} />

      <QuickWins summary={getQuickWins(activities, context, locale)} />

      {processId && (
        <AttachmentList
          processId={processId}
          readOnly={readOnly}
          activities={activities}
          links={attachmentLinks}
          onLinkChange={setAttachmentLink}
        />
      )}

      {readOnly ? (
        <div className="no-print mt-4.5 pt-4.5 border-t border-line-soft text-[11.5px] text-ink-faint">
          {t.readOnlyNotice}
        </div>
      ) : (
        <>
          <div className="no-print mt-4.5 pt-4.5 border-t border-line-soft flex items-center flex-wrap gap-3">
            <button
              onClick={analyze}
              disabled={loading || filled === 0 || aiExhausted}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-sans text-[13.5px] font-semibold transition-colors disabled:cursor-not-allowed"
              style={{
                border: `1px solid ${loading || filled === 0 || aiExhausted ? "var(--color-line)" : "var(--color-accent)"}`,
                background: loading || filled === 0 || aiExhausted ? "var(--color-line-soft)" : "var(--color-accent-soft)",
                color: loading || filled === 0 || aiExhausted ? "var(--color-ink-faint)" : "var(--color-accent-deep)",
              }}
            >
              {loading ? <Loader2 size={15} className="animate-spin-slow" /> : <Sparkles size={15} />}
              {loading ? t.analyzing : t.analyzeButton}
            </button>
            {filled === 0 && !aiExhausted && <span className="text-[11.5px] text-ink-faint">{t.fillAtLeastOne}</span>}
            {aiExhausted && (
              <span className="flex items-center gap-1.5 text-[11.5px] text-coral">
                <AlertTriangle size={13} className="shrink-0" /> {t.quotaReached}
              </span>
            )}
            {aiLow && (
              <span className="text-[11.5px] text-amber">
                {(aiRemaining === 1 ? t.quotaLowSingular : t.quotaLowPlural).replace("{n}", String(aiRemaining))}
              </span>
            )}
          </div>
          {error && <div className="no-print mt-3 text-[12.5px] text-coral">{error}</div>}
        </>
      )}

      {analysis && (
        <div
          className="no-print mt-4 border border-accent/15 rounded-[10px] p-5"
          style={{ background: "linear-gradient(180deg, var(--color-accent-soft), var(--color-surface))" }}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles size={14} className="text-accent" />
            <Eyebrow>{t.aiReadingEyebrow}</Eyebrow>
            <span className="ml-auto font-mono text-[10px] text-ink-faint">{t.suggestionBadge}</span>
          </div>
          {analysis.synthese && (
            <p className="text-[13.5px] text-ink leading-relaxed mb-3.5">{analysis.synthese}</p>
          )}
          {analysis.risques.length > 0 && (
            <div className="mb-3.5">
              <div className="text-[11.5px] font-semibold text-ink-soft mb-1.5">{t.risksToWatch}</div>
              {analysis.risques.map((rk, i) => (
                <div key={i} className="flex gap-2 items-start py-0.5">
                  <span className="w-[5px] h-[5px] rounded-full bg-amber mt-1.5 shrink-0" />
                  <span className="text-[12.5px] text-ink-soft leading-snug">{rk}</span>
                </div>
              ))}
            </div>
          )}
          {leverPreview.length > 0 && (
            <div className="mb-4">
              <div className="text-[11.5px] font-semibold text-ink-soft mb-2">{t.suggestedStartScores}</div>
              {leverPreview.map((l) => (
                <div key={l.id} className="flex gap-2.5 items-baseline py-1.5 border-t border-line-soft">
                  <span className="font-mono text-xs text-accent-deep bg-surface border border-line rounded-[5px] px-1.5 py-0.5 min-w-[40px] text-center">
                    {l.avg != null ? l.avg : "-"}
                  </span>
                  <div>
                    <span className="text-[13px] font-semibold text-ink">{l.label}</span>
                    {l.comment && <span className="text-[12.5px] text-ink-soft leading-snug"> : {l.comment}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!readOnly && (
            <div className="flex items-center flex-wrap gap-3">
              <button
                onClick={applyScores}
                className="px-4 py-2.5 rounded-lg bg-accent-vivid text-ink font-sans text-[13.5px] font-semibold hover:brightness-95 transition"
              >
                {t.applyAsStartingPoint}
              </button>
              <span className="text-[11px] text-ink-faint">{t.adjustLater}</span>
            </div>
          )}

          {!readOnly && onApplyRoi && analysis.roiSuggestion && (
            <div className="mt-4 pt-4 border-t border-line-soft">
              <div className="flex items-center gap-2 mb-2">
                <Calculator size={13} className="text-accent" />
                <span className="text-[11.5px] font-semibold text-ink-soft">{t.roiSuggestionTitle}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-soft font-mono mb-2">
                <span>{t.roiVolume.replace("{n}", String(analysis.roiSuggestion.volume))}</span>
                <span>{t.roiMinutes.replace("{n}", String(analysis.roiSuggestion.minutes))}</span>
                <span>{t.roiHourlyCost.replace("{n}", String(analysis.roiSuggestion.hourlyCost))}</span>
                <span>{t.roiErrorRate.replace("{n}", String(analysis.roiSuggestion.errorRate))}</span>
                <span>{t.roiRework.replace("{n}", String(analysis.roiSuggestion.reworkMin))}</span>
              </div>
              {analysis.roiSuggestion.note && (
                <p className="text-[12px] text-ink-faint leading-relaxed mb-3">{analysis.roiSuggestion.note}</p>
              )}
              <div className="flex items-center flex-wrap gap-3">
                <button
                  onClick={applyRoi}
                  disabled={roiApplied}
                  className="px-4 py-2.5 rounded-lg border border-accent text-accent-deep bg-accent-soft font-sans text-[13px] font-semibold hover:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {roiApplied ? t.roiApplied : t.roiApply}
                </button>
                <span className="text-[11px] text-ink-faint">{t.roiEstimateNote}</span>
              </div>
            </div>
          )}
        </div>
      )}
      </Card>
    </>
  );
}
