"use client";

import { useMemo, useRef, useState } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
} from "recharts";
import {
  Info, SlidersHorizontal, Wrench, Bot, FileSearch, Sparkles, Shuffle, AlertTriangle,
  Check, ChevronDown, History, Users, type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionHero } from "@/components/ui/SectionHero";
import { GaugeArc } from "@/components/ui/GaugeArc";
import { AssessmentHistory, type HistoryPoint } from "./AssessmentHistory";
import { WeightProfiles } from "./WeightProfiles";
import { SecondOpinion } from "./SecondOpinion";
import {
  Answers, ApproachId, Context, Currency, DEFAULT_WEIGHTS, DIMENSIONS,
  Weights, adoptionEase, adoptionLabelDisplay, contextDiff, diagnosticResult, getDimensions, getLevels, getLikert,
  parseActivities, parseAiSeededAnswers, recommendApproach,
} from "@/lib/scoring";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";

const APPROACH_ICONS: Record<ApproachId, LucideIcon> = {
  process_first: Wrench,
  rpa: Bot,
  idp: FileSearch,
  agentic: Sparkles,
  hybrid: Shuffle,
};

export function Diagnostic({
  answers,
  setAnswers,
  weights,
  setWeights,
  context,
  initialContext,
  history = [],
  currency = "CAD",
  readOnly = false,
  loggedIn = false,
  onGoToContext,
  processId,
}: {
  answers: Answers;
  setAnswers: React.Dispatch<React.SetStateAction<Answers>>;
  weights: Weights;
  setWeights: React.Dispatch<React.SetStateAction<Weights>>;
  context: Context;
  initialContext?: Context;
  history?: HistoryPoint[];
  currency?: Currency;
  readOnly?: boolean;
  loggedIn?: boolean;
  onGoToContext?: () => void;
  processId?: string;
}) {
  const locale = useLocale();
  const { diagnostic: t } = useDictionary().tool;
  const dimensions = useMemo(() => getDimensions(locale), [locale]);
  const levels = useMemo(() => getLevels(locale), [locale]);
  const likert = useMemo(() => getLikert(locale), [locale]);
  const diag = useMemo(() => diagnosticResult(answers, weights, context, locale), [answers, weights, context, locale]);
  const { dimScores, overall, level, answeredCount, totalW } = diag;
  const approach = useMemo(() => recommendApproach(diag, context, locale), [diag, context, locale]);
  const adoption = useMemo(() => adoptionEase(diag, context, approach, locale), [diag, context, approach, locale]);
  const ADOPTION_COLOR: Record<string, string> = { Faible: "text-coral", Modérée: "text-amber", Élevée: "text-accent" };
  const totalQ = DIMENSIONS.reduce((s, d) => s + d.questions.length, 0);
  const driftedFields = useMemo(
    () => (initialContext && answeredCount > 0 ? contextDiff(context, initialContext, locale) : []),
    [context, initialContext, answeredCount, locale]
  );
  const stepsDocumented = useMemo(() => parseActivities(context).some((a) => a.label.trim()), [context]);
  const aiSeeded = useMemo(() => parseAiSeededAnswers(context), [context]);
  const isAiSeeded = (qid: string) => aiSeeded[qid] !== undefined && aiSeeded[qid] === answers[qid];

  const [openId, setOpenId] = useState<string>(() => {
    const firstIncomplete = DIMENSIONS.find((d) => {
      const n = d.questions.filter((_, i) => answers[`${d.id}-${i}`] !== undefined).length;
      return n < d.questions.length;
    });
    return firstIncomplete?.id ?? DIMENSIONS[0].id;
  });
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const openLever = (id: string) => {
    setOpenId(id);
    cardRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const weakest = useMemo(
    () => [...dimScores].filter((d) => d.answered > 0).sort((a, b) => a.score - b.score).slice(0, 3),
    [dimScores]
  );
  const complete = answeredCount === totalQ;
  const setVal = (qid: string, v: number) => setAnswers((p) => ({ ...p, [qid]: v }));
  const pct = (id: string) => Math.round((weights[id] / totalW) * 100);
  const radarData = dimScores.map((d) => ({ dimension: d.short, score: d.score }));

  return (
    <>
      <SectionHero
        eyebrow={t.eyebrow}
        title={t.title}
        sub={t.sub}
      />

      <AssessmentHistory history={history} currency={currency} />

      {driftedFields.length > 0 && (
        <div className="no-print mb-6 flex items-start gap-2.5 px-4.5 py-3.5 rounded-lg border border-amber/25 bg-amber/10 text-[12.5px] text-ink-soft leading-relaxed">
          <History size={15} className="text-amber shrink-0 mt-0.5" />
          <span>{t.driftNotice.replace("{fields}", driftedFields.join(", "))}</span>
        </div>
      )}

      {!readOnly && !stepsDocumented && (
        <div className="no-print mb-6 flex items-start gap-2.5 px-4.5 py-3.5 rounded-lg border border-line bg-bg text-[12.5px] text-ink-soft leading-relaxed">
          <AlertTriangle size={15} className="text-ink-faint shrink-0 mt-0.5" />
          <span>
            {t.lowConfidenceNotice}
            {onGoToContext && (
              <>
                {" "}
                <button onClick={onGoToContext} className="font-semibold text-accent hover:underline">
                  {t.goToContext}
                </button>
              </>
            )}
          </span>
        </div>
      )}

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-7 items-start">
        <div className="no-print">
          <Card className="lg:sticky lg:top-[92px] z-10 px-4.5 py-3.5 mb-4">
            <div className="flex items-start gap-2 mb-2.5">
              <Info size={13} className="text-ink-faint shrink-0 mt-[3px]" />
              <span className="text-[12px] text-ink-soft leading-relaxed">
                {t.scale}{" "}
                {likert.map((o, i) => (
                  <span key={o.v}>
                    <span className="font-mono text-accent font-semibold">{o.v}</span> {o.label}
                    {i < likert.length - 1 && <span className="text-ink-faint"> · </span>}
                  </span>
                ))}
              </span>
              <span className="ml-auto font-mono text-[11px] text-ink-faint whitespace-nowrap shrink-0">
                {answeredCount}/{totalQ}
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {dimensions.map((d, di) => {
                const ds = dimScores[di];
                const isComplete = ds.answered === d.questions.length;
                return (
                  <button
                    key={d.id}
                    onClick={() => openLever(d.id)}
                    className={clsx(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-[11.5px] font-medium border transition-colors",
                      openId === d.id
                        ? "border-accent bg-accent-soft text-accent-deep"
                        : "border-line text-ink-soft hover:border-accent hover:text-accent"
                    )}
                  >
                    <span
                      className={clsx(
                        "w-[7px] h-[7px] rounded-full shrink-0",
                        isComplete ? "bg-accent" : ds.answered > 0 ? "bg-amber-tint" : "bg-line"
                      )}
                    />
                    {d.short}
                  </button>
                );
              })}
            </div>
          </Card>

          {dimensions.map((d, di) => {
            const ds = dimScores[di];
            const isOpen = openId === d.id;
            const isComplete = ds.answered === d.questions.length;
            const aiSeededCount = d.questions.filter((_, i) => isAiSeeded(`${d.id}-${i}`)).length;
            return (
              <div key={d.id} ref={(el) => { cardRefs.current[d.id] = el; }} className="scroll-mt-[220px]">
                <Card className="mb-3.5 overflow-hidden">
                  <button
                    onClick={() => setOpenId(isOpen ? "" : d.id)}
                    className="w-full flex items-center gap-2.5 px-5.5 py-5 text-left"
                  >
                    <span className="font-mono text-xs text-accent font-semibold">
                      {String(di + 1).padStart(2, "0")}
                    </span>
                    <span className="font-sans text-[16px] font-semibold text-ink">{d.label}</span>
                    <span className="ml-auto flex items-center gap-2">
                      {isComplete ? (
                        <Check size={14} className="text-accent" />
                      ) : ds.answered > 0 ? (
                        <span className="font-mono text-[10px] text-ink-faint whitespace-nowrap">
                          {ds.answered}/{d.questions.length}
                        </span>
                      ) : null}
                      <span className="font-mono text-[10.5px] text-accent-deep bg-accent-soft px-1.5 py-0.5 rounded">
                        {t.weightBadge.replace("{n}", String(pct(d.id)))}
                      </span>
                      {ds.adjustment && (
                        <span
                          title={t.capTooltip.replace("{reason}", ds.adjustment.reason).replace("{score}", String(ds.score)).replace("{raw}", String(ds.rawScore))}
                          className="flex items-center gap-1 font-mono text-[10px] text-amber bg-amber/10 px-1.5 py-0.5 rounded whitespace-nowrap"
                        >
                          <AlertTriangle size={10} /> {t.adjustedByContext}
                        </span>
                      )}
                      {aiSeededCount > 0 && (
                        <span
                          title={t.aiSuggestedLeverTooltip.replace("{n}", String(aiSeededCount)).replace("{total}", String(ds.answered))}
                          className="flex items-center gap-1 font-mono text-[10px] text-accent-deep bg-accent-soft px-1.5 py-0.5 rounded whitespace-nowrap"
                        >
                          <Sparkles size={10} /> {(aiSeededCount > 1 ? t.aiSuggestedBadgePlural : t.aiSuggestedBadgeSingular).replace("{n}", String(aiSeededCount))}
                        </span>
                      )}
                      <span className="font-mono text-xs text-ink-faint">{ds.score || 0}</span>
                      <ChevronDown
                        size={16}
                        className={clsx("text-ink-faint transition-transform", isOpen && "rotate-180")}
                      />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5.5 pb-5">
                      {d.questions.map((q, i) => {
                        const qid = `${d.id}-${i}`;
                        const cur = answers[qid];
                        return (
                          <div key={qid} className="py-3 pb-1.5 border-t border-line-soft">
                            <div className="flex items-baseline gap-2.5 mb-2">
                              <span className="text-sm text-ink leading-snug flex-1">{q.text}</span>
                              {isAiSeeded(qid) && (
                                <span
                                  title={t.aiSuggestedAnswerTooltip}
                                  className="flex items-center gap-1 font-mono text-[9.5px] text-accent-deep bg-accent-soft px-1.5 py-0.5 rounded whitespace-nowrap"
                                >
                                  <Sparkles size={9} /> {t.aiSuggestedAnswerBadge}
                                </span>
                              )}
                              <span
                                title={t.questionWeightTooltip}
                                className="font-mono text-[10.5px] text-ink-faint whitespace-nowrap"
                              >
                                ×{q.w.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex gap-1.5">
                              {likert.map((o) => {
                                const on = cur === o.v;
                                return (
                                  <button
                                    key={o.v}
                                    onClick={() => !readOnly && setVal(qid, o.v)}
                                    disabled={readOnly}
                                    title={o.label}
                                    className={clsx(
                                      "flex-1 py-2 px-1 rounded-[7px] font-mono text-xs font-medium border transition",
                                      on
                                        ? "border-accent-deep bg-accent-vivid text-ink"
                                        : "border-line bg-surface text-ink-soft hover:border-accent hover:text-accent",
                                      readOnly && "cursor-not-allowed opacity-70 hover:border-line hover:text-ink-soft"
                                    )}
                                  >
                                    {o.v}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      {isComplete && di < dimensions.length - 1 && (
                        <button
                          onClick={() => openLever(dimensions[di + 1].id)}
                          className="mt-3 text-[12px] font-semibold text-accent hover:underline"
                        >
                          {t.continueWith.replace("{next}", dimensions[di + 1].label)}
                        </button>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>

        <div className="lg:sticky lg:top-[92px] grid gap-3.5">
          <Card className="p-6">
            <div className="print-header hidden mb-3.5">
              <Eyebrow>{t.printHeader}</Eyebrow>
            </div>
            <div className="flex justify-between items-center mb-1.5">
              <Eyebrow>{t.aptitudeEyebrow}</Eyebrow>
              <span
                className="px-2.5 py-1 rounded-full text-white font-mono text-xs font-semibold"
                style={{ background: level.color }}
              >
                {t.levelBadge.replace("{n}", String(level.n)).replace("{label}", level.label)}
              </span>
            </div>
            <GaugeArc score={overall} level={level} caption={t.gaugeCaption} />
            <div className="flex gap-1 mt-1">
              {levels.map((l) => (
                <div key={l.n} className="flex-1">
                  <div
                    className="h-[5px] rounded-full transition-colors duration-300"
                    style={{ background: l.n <= level.n ? l.color : "var(--color-line-soft)" }}
                  />
                  <div
                    className={clsx(
                      "font-mono text-[8.5px] text-center mt-1",
                      l.n === level.n ? "text-ink font-semibold" : "text-ink-faint"
                    )}
                  >
                    {l.n}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[12.5px] text-ink-soft mt-3 leading-snug text-center">{level.note}</p>
          </Card>

          {approach && (
            <Card className="p-5.5">
              <Eyebrow className="mb-3">{t.recommendedApproachEyebrow}</Eyebrow>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 shrink-0 rounded-[9px] bg-accent-soft flex items-center justify-center">
                  {(() => {
                    const Icon = APPROACH_ICONS[approach.id];
                    return <Icon size={19} className="text-accent-deep" />;
                  })()}
                </div>
                <div>
                  <div className="font-sans text-[15.5px] font-semibold text-ink">{approach.label}</div>
                </div>
              </div>
              <p className="text-[12.5px] text-ink-soft leading-relaxed mb-3">{approach.description}</p>
              <ul className="space-y-1 mb-1">
                {approach.rationale.map((r, i) => (
                  <li key={i} className="text-[11.5px] text-ink-faint leading-snug flex gap-1.5">
                    <span className="text-accent">·</span> {r}
                  </li>
                ))}
              </ul>
              {approach.caution && (
                <div className="flex gap-1.5 items-start mt-3 pt-3 border-t border-line-soft text-[11.5px] text-coral leading-snug">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  <span>{approach.caution}</span>
                </div>
              )}
              {answeredCount > 0 && (
                <div className="flex gap-1.5 items-start mt-3 pt-3 border-t border-line-soft text-[11.5px] leading-snug">
                  <Users size={13} className={clsx("shrink-0 mt-0.5", ADOPTION_COLOR[adoption.label])} />
                  <span className="text-ink-soft">
                    {t.adoptionEaseLabel}{" "}
                    <span className={clsx("font-semibold", ADOPTION_COLOR[adoption.label])}>{adoptionLabelDisplay(adoption.label, locale)}</span>
                    {". "}
                    {adoption.reasons[0]}
                  </span>
                </div>
              )}
            </Card>
          )}

          <Card className="p-5.5">
            <div className="flex items-center gap-2 mb-1">
              <SlidersHorizontal size={14} className="text-accent" />
              <Eyebrow>{t.weightingEyebrow}</Eyebrow>
            </div>
            <p className="text-xs text-ink-soft mt-1.5 mb-3.5 leading-relaxed">
              {t.weightingSub}
            </p>
            {dimensions.map((d) => (
              <div key={d.id} className="mb-3.5">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[12.5px] text-ink-soft">{d.label}</span>
                  <span className="font-mono text-[12.5px] text-accent-deep font-semibold">{pct(d.id)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={weights[d.id]}
                  disabled={readOnly}
                  onChange={(e) => setWeights((p) => ({ ...p, [d.id]: parseFloat(e.target.value) }))}
                  className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            ))}
            {!readOnly && (
              <button
                onClick={() => setWeights({ ...DEFAULT_WEIGHTS })}
                className="mt-1 font-mono text-[12px] text-ink-soft bg-transparent border border-line rounded-lg px-2.5 py-1.5 hover:border-accent hover:text-accent transition-colors"
              >
                {t.resetWeights}
              </button>
            )}
            {!readOnly && (
              <WeightProfiles
                weights={weights}
                setWeights={(w) => setWeights(w)}
                category={context.category}
                loggedIn={loggedIn}
              />
            )}
          </Card>

          <Card className="p-5.5">
            <Eyebrow className="mb-1.5">{t.leverProfileEyebrow}</Eyebrow>
            <div className="h-[200px] -mx-2.5 mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="74%">
                  <PolarGrid stroke="var(--color-line)" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fill: "var(--color-ink-soft)", fontSize: 10.5, fontFamily: "var(--font-mono)" }}
                  />
                  <Radar dataKey="score" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.16} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {dimScores.map((d) => (
              <div key={d.id} className="flex items-center gap-3 py-1.5">
                <span className="w-[150px] text-xs text-ink-soft">
                  {d.label} <span className="font-mono text-[10px] text-ink-faint">{pct(d.id)}%</span>
                </span>
                <div className="flex-1 h-1.5 bg-line-soft rounded-full overflow-hidden">
                  <div
                    className="h-full w-full bg-accent rounded-full origin-left transition-transform duration-500"
                    style={{ transform: `scaleX(${d.score / 100})` }}
                  />
                </div>
                {d.adjustment && (
                  <span
                    title={t.capTooltip.replace("{reason}", d.adjustment.reason).replace("{score}", String(d.score)).replace("{raw}", String(d.rawScore))}
                    className="shrink-0"
                  >
                    <AlertTriangle size={11} className="text-amber" />
                  </span>
                )}
                <span className="w-[26px] text-right font-mono text-[12.5px] text-ink">{d.score}</span>
              </div>
            ))}
          </Card>

          <Card className="p-5.5">
            <Eyebrow>{t.priorityBlockersEyebrow}</Eyebrow>
            {weakest.length === 0 ? (
              <p className="text-[13px] text-ink-soft mt-2.5">
                {t.priorityBlockersEmpty}
              </p>
            ) : (
              <div className="mt-3">
                {weakest.map((d, i) => (
                  <div key={d.id} className={clsx("flex gap-3 py-3", i && "border-t border-line-soft")}>
                    <span className="font-mono text-xs text-accent-deep bg-accent-soft rounded-md px-2 py-0.5 h-fit font-semibold">
                      {d.score}
                    </span>
                    <div>
                      <div className="text-[13.5px] font-semibold text-ink mb-0.5">{d.label}</div>
                      <div className="text-[12.5px] text-ink-soft leading-snug">{d.reco}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!complete && (
              <div className="text-[11px] text-ink-faint text-center mt-2">
                {t.questionsCompleted.replace("{n}", String(answeredCount)).replace("{total}", String(totalQ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {processId && (
        <div className="no-print mt-7">
          <SecondOpinion
            processId={processId}
            primaryOverall={overall}
            primaryDimScores={Object.fromEntries(dimScores.map((d) => [d.id, d.score]))}
            weights={weights}
            context={context}
            readOnly={readOnly}
          />
        </div>
      )}
    </>
  );
}

