"use client";

import { useState } from "react";
import { Gauge, Calculator, LayoutGrid, FileText, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import { Diagnostic } from "./Diagnostic";
import { ContextSection } from "./ContextSection";
import { Roi } from "./Roi";
import { Prioritisation } from "./Prioritisation";
import type { TabId } from "./AppHeader";
import { AnalysisResult, Answers, Context, Currency, RoiInputs, Weights, diagnosticResult } from "@/lib/scoring";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";

export function PublicToolView({
  processName,
  currency,
  context,
  answers,
  weights,
  roiInputs,
  aiAnalysis,
}: {
  processName: string;
  currency: Currency;
  context: Context;
  answers: Answers;
  weights: Weights;
  roiInputs: RoiInputs;
  aiAnalysis: AnalysisResult | null;
}) {
  const locale = useLocale();
  const { publicToolView: t } = useDictionary().tool;
  const [tab, setTab] = useState<TabId>("contexte");
  const diag = diagnosticResult(answers, weights, context, locale);

  const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
    { id: "contexte", label: t.tabContext, icon: FileText },
    { id: "diagnostic", label: t.tabAptitude, icon: Gauge },
    { id: "roi", label: t.tabRoi, icon: Calculator },
    { id: "prio", label: t.tabPrio, icon: LayoutGrid },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur-md backdrop-saturate-150">
        <div className="max-w-[1160px] mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-md bg-ink flex items-center justify-center shrink-0">
              <Gauge size={16} color="var(--color-accent-soft)" />
            </div>
            <div>
              <div className="font-display text-[16px] font-extrabold tracking-[0.01em] text-ink">VerdiktNow</div>
              <div className="text-[10.5px] text-ink-faint tracking-[0.03em]">{t.sharedReadOnlyTag}</div>
            </div>
          </div>
          <nav className="flex gap-0.5 sm:gap-1 bg-bg p-1 rounded-[10px] border border-line overflow-x-auto">
            {TABS.map((T) => {
              const on = tab === T.id;
              const Icon = T.icon;
              return (
                <button
                  key={T.id}
                  onClick={() => setTab(T.id)}
                  className={clsx(
                    "flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-[7px] text-[12.5px] sm:text-[13.5px] whitespace-nowrap transition",
                    on ? "bg-surface shadow-card text-ink font-semibold" : "text-ink-soft font-medium hover:text-ink"
                  )}
                >
                  <Icon size={15} className="shrink-0" />
                  <span>{T.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-[1160px] mx-auto w-full px-5 sm:px-6 py-9 pb-16 flex-1">
        <div className="mb-6 px-4 py-2.5 rounded-lg bg-accent-soft border border-accent/15 text-[12.5px] text-accent-deep">
          {(() => {
            const [before, after] = t.readOnlyBanner.split("{name}");
            return (
              <>
                {before}
                <b>{processName}</b>
                {after}
              </>
            );
          })()}
        </div>
        {tab === "contexte" && (
          <ContextSection
            context={context}
            setContext={() => {}}
            setAnswers={() => {}}
            processName={processName}
            initialAnalysis={aiAnalysis}
            readOnly
          />
        )}
        {tab === "diagnostic" && (
          <Diagnostic
            answers={answers}
            setAnswers={() => {}}
            weights={weights}
            setWeights={() => {}}
            context={context}
            readOnly
            loggedIn={false}
          />
        )}
        {tab === "roi" && (
          <Roi
            inputs={roiInputs}
            setInputs={() => {}}
            currency={currency}
            setCurrency={() => {}}
            processName={processName}
            aptitudeOverall={diag.overall}
            aptitudeAnswered={diag.answeredCount > 0}
            readOnly
          />
        )}
        {tab === "prio" && (
          <Prioritisation
            answers={answers}
            weights={weights}
            context={context}
            roiInputs={roiInputs}
            currency={currency}
            processName={processName}
            goTo={setTab}
            aiAnalysis={aiAnalysis}
          />
        )}
      </main>
    </div>
  );
}
