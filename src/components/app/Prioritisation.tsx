"use client";

import { useMemo } from "react";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { Info, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionHero } from "@/components/ui/SectionHero";
import { Matrix } from "./Matrix";
import type { TabId } from "./AppHeader";
import { AnalysisResult, Answers, Context, CURRENCIES, Currency, RoiInputs, Weights, diagnosticResult, roiResult, prioritizationQuadrant, type PrioritizationQuadrant } from "@/lib/scoring";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";

export function Prioritisation({
  answers,
  weights,
  context = {},
  roiInputs,
  currency,
  processName,
  goTo,
  aiAnalysis = null,
  hoursPerFte,
  magnitudeRef,
  threshold = 50,
}: {
  answers: Answers;
  weights: Weights;
  context?: Context;
  roiInputs: RoiInputs;
  currency: Currency;
  processName: string;
  goTo: (t: TabId) => void;
  aiAnalysis?: AnalysisResult | null;
  hoursPerFte?: number;
  magnitudeRef?: number;
  /** Seuil de priorisation de l'organisation (0-100, défaut 50) — voir organizations.constants. */
  threshold?: number;
}) {
  const locale = useLocale();
  const tool = useDictionary().tool;
  const { prioritisation: t } = tool;
  const diag = useMemo(() => diagnosticResult(answers, weights, context, locale), [answers, weights, context, locale]);
  const roi = useMemo(() => roiResult(roiInputs, hoursPerFte, magnitudeRef), [roiInputs, hoursPerFte, magnitudeRef]);
  const c = CURRENCIES[currency];
  const money = (n: number) => new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", { maximumFractionDigits: 0 }).format(Math.round(n)) + " " + c.symbol;
  const A = diag.overall, V = roi.valueScore;
  const ready = diag.answeredCount > 0;

  const verdictByQuadrant: Record<PrioritizationQuadrant, { title: string; color: string; text: string }> = {
    automate: { title: t.verdictAutomateTitle, color: "var(--color-accent)", text: t.verdictAutomateText },
    plan: { title: t.verdictPlanTitle, color: "var(--color-olive)", text: t.verdictPlanText },
    prepare: { title: t.verdictPrepareTitle, color: "var(--color-amber)", text: t.verdictPrepareText },
    setAside: { title: t.verdictSetAsideTitle, color: "var(--color-coral)", text: t.verdictSetAsideText },
  };
  const verdict = verdictByQuadrant[prioritizationQuadrant(A, V, threshold)];

  const borderline = ready && (Math.abs(A - threshold) <= 5 || Math.abs(V - threshold) <= 5);

  const comp: { k: string; v: string; sub: string | null; onClick?: () => void }[] = [
    { k: t.compAptitude, v: `${A}/100`, sub: diag.level.label, onClick: () => goTo("diagnostic") },
    { k: t.compValue, v: `${V}/100`, sub: t.compValueSub, onClick: () => goTo("roi") },
    { k: t.compNetSavings, v: money(roi.netRecurring), sub: null },
    { k: t.compPayback, v: roi.payback ? `${roi.payback.toFixed(1)} ${tool.roi.miniPaybackUnit}` : "-", sub: null },
  ];

  return (
    <>
      <SectionHero
        eyebrow={t.eyebrow}
        title={t.title}
        sub={t.sub}
      />
      <div className="grid lg:grid-cols-[1fr_0.85fr] gap-7 items-start">
        <Card className="p-6">
          <Eyebrow className="mb-2.5">{t.matrixEyebrow}</Eyebrow>
          <Matrix
            V={V}
            A={A}
            name={processName}
            show={ready}
            labels={tool.portfolioMatrix}
            threshold={threshold}
          />
          {!ready && (
            <p className="text-[12.5px] text-ink-soft text-center mt-1">
              {t.completeToPosition}
            </p>
          )}
        </Card>

        <div className="lg:sticky lg:top-[92px] grid gap-3.5">
          <Card className="p-0 overflow-hidden">
            <div className="h-[5px]" style={{ background: verdict.color }} />
            <div className="p-5.5">
              <Eyebrow>{t.recommendationEyebrow}</Eyebrow>
              <div className="font-sans text-[22px] font-bold text-ink my-2 tracking-[-0.01em]">{verdict.title}</div>
              <p className="text-[13.5px] text-ink-soft leading-relaxed">{verdict.text}</p>
              {borderline && (
                <div className="flex gap-1.5 items-start mt-3 pt-3 border-t border-line-soft text-[11.5px] text-amber leading-snug">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5 text-amber" />
                  <span>
                    {t.borderlineWarning.replace("{threshold}", String(threshold))}
                  </span>
                </div>
              )}
              <div className="flex gap-1.5 items-start mt-3 pt-3 border-t border-line-soft text-[11px] text-ink-faint leading-snug">
                <Info size={13} className="shrink-0 mt-0.5" />
                <span>
                  {t.selfAssessmentNote}
                </span>
              </div>
              {aiAnalysis && aiAnalysis.risques.length > 0 && (
                <div className="mt-3 pt-3 border-t border-line-soft">
                  <div className="text-[11px] font-semibold text-ink-soft mb-1.5">
                    {t.aiAttentionPoints}
                  </div>
                  {aiAnalysis.risques.slice(0, 3).map((rk, i) => (
                    <div key={i} className="flex gap-2 items-start py-0.5">
                      <span className="w-[5px] h-[5px] rounded-full bg-amber mt-1.5 shrink-0" />
                      <span className="text-[12px] text-ink-soft leading-snug">{rk}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <Eyebrow className="mb-3">{t.scoreComponentsEyebrow}</Eyebrow>
            <div className="grid grid-cols-2 gap-px bg-line border border-line rounded-[10px] overflow-hidden">
              {comp.map((m) => {
                const Tag = m.onClick ? "button" : "div";
                return (
                  <Tag
                    key={m.k}
                    onClick={m.onClick}
                    className={clsx(
                      "bg-surface px-3.5 py-3.5 text-left",
                      m.onClick && "cursor-pointer hover:bg-accent-soft transition-colors"
                    )}
                  >
                    <div className="text-[11.5px] text-ink-soft">{m.k}</div>
                    <div className="font-mono text-[18px] font-semibold text-ink mt-0.5">{m.v}</div>
                    {m.sub && <div className="font-mono text-[10px] text-ink-faint mt-0.5">{m.sub}</div>}
                  </Tag>
                );
              })}
            </div>
            <div className="flex gap-1.5 items-start mt-3.5 text-[11.5px] text-ink-faint leading-relaxed">
              <Info size={13} className="shrink-0 mt-0.5" />
              <span>
                {t.comparePrefix}{" "}
                <LocaleLink href="/processus" className="text-accent font-semibold hover:underline">
                  {t.portfolioViewLink}
                </LocaleLink>
                .
              </span>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
