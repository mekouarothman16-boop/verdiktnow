"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";
import { localizePath } from "@/i18n/localizePath";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Check, Cloud, CloudOff, Download, FileText, Loader2, Lock } from "lucide-react";
import { AppHeader, TabId } from "@/components/app/AppHeader";
import { ProcessBar } from "@/components/app/ProcessBar";
import { Diagnostic } from "@/components/app/Diagnostic";
import { ContextSection } from "@/components/app/ContextSection";
import { Roi } from "@/components/app/Roi";
import { Prioritisation } from "@/components/app/Prioritisation";
import { ShareLinkPanel } from "@/components/app/ShareLinkPanel";
import { RoadmapChecklist } from "@/components/app/RoadmapChecklist";
import type { HistoryPoint } from "@/components/app/AssessmentHistory";
import { saveProcess, updateProcessTags } from "@/lib/supabase/processActions";
import { buildRoadmap } from "@/lib/pdf/roadmap";
import {
  AnalysisResult,
  Answers,
  Context,
  Currency,
  DEFAULT_ROI_INPUTS,
  DEFAULT_WEIGHTS,
  RoiInputs,
  Weights,
  diagnosticResult,
  recommendApproach,
  roiResult,
} from "@/lib/scoring";
import type { OrgRole, Plan } from "@/lib/supabase/types";

export function ToolShell({
  processId,
  loggedIn = false,
  plan = "free",
  role,
  initialName = "Traitement des demandes",
  initialCurrency = "CAD",
  initialAnswers = {},
  initialContext = {},
  initialWeights = DEFAULT_WEIGHTS,
  initialRoi = DEFAULT_ROI_INPUTS,
  initialAiAnalysis = null,
  initialUpdatedAt = null,
  initialHistory = [],
  initialTags = [],
  aiQuota = null,
  aiUsedThisMonth = 0,
  hoursPerFte,
  magnitudeRef,
  priorityThreshold = 50,
  siblings = [],
  members = [],
}: {
  processId?: string;
  loggedIn?: boolean;
  plan?: Plan;
  role?: OrgRole;
  initialName?: string;
  initialCurrency?: Currency;
  initialAnswers?: Answers;
  initialContext?: Context;
  initialWeights?: Weights;
  initialRoi?: RoiInputs;
  initialAiAnalysis?: AnalysisResult | null;
  initialUpdatedAt?: string | null;
  initialHistory?: HistoryPoint[];
  initialTags?: string[];
  aiQuota?: number | null;
  aiUsedThisMonth?: number;
  /** Constantes calibrables par organisation (organizations.constants) — voir OrgCalibration.tsx. */
  hoursPerFte?: number;
  magnitudeRef?: number;
  priorityThreshold?: number;
  siblings?: { id: string; name: string }[];
  /** Membres de l'organisation (id + courriel), pour le sélecteur d'assignation de la feuille de
   * route — vide dans les contextes sans organisation (lien de partage en lecture seule). */
  members?: { userId: string; email: string }[];
}) {
  const router = useRouter();
  const locale = useLocale();
  const dict = useDictionary();
  const { toolShell: t } = dict.tool;
  const { appHeader } = dict.common;
  const isPaid = plan !== "free";
  const readOnly = role === "viewer";
  const [tab, setTab] = useState<TabId>("contexte");
  const TAB_IDS: TabId[] = ["contexte", "diagnostic", "roi", "prio", "roadmap"];
  const changeTab = (next: TabId) => {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.pushState(null, "", url);
    window.scrollTo(0, 0);
  };
  useEffect(() => {
    const readTabFromUrl = () => {
      const t = new URLSearchParams(window.location.search).get("tab") as TabId | null;
      setTab(t && TAB_IDS.includes(t) ? t : "contexte");
    };
    readTabFromUrl();
    window.addEventListener("popstate", readTabFromUrl);
    return () => window.removeEventListener("popstate", readTabFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [processName, setProcessName] = useState(initialName);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [context, setContext] = useState<Context>(initialContext);
  const [weights, setWeights] = useState<Weights>(initialWeights);
  const [currency, setCurrency] = useState<Currency>(initialCurrency);
  const [roi, setRoi] = useState<RoiInputs>(initialRoi);
  const [aiAnalysis, setAiAnalysis] = useState<AnalysisResult | null>(initialAiAnalysis);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(initialUpdatedAt);
  const [history, setHistory] = useState<HistoryPoint[]>(initialHistory);
  const [tags, setTags] = useState<string[]>(initialTags);

  const TAB_ORDER: TabId[] = ["contexte", "diagnostic", "roi", "prio", "roadmap"];
  const TAB_LABELS: Record<TabId, string> = {
    contexte: appHeader.tabContext,
    diagnostic: appHeader.tabAptitude,
    roi: appHeader.tabRoi,
    prio: appHeader.tabPrio,
    roadmap: appHeader.tabRoadmap,
  };
  const nextTab = TAB_ORDER[TAB_ORDER.indexOf(tab) + 1];

  const diag = useMemo(() => diagnosticResult(answers, weights, context, locale), [answers, weights, context, locale]);
  const approach = useMemo(() => recommendApproach(diag, context, locale), [diag, context, locale]);
  const roiCalc = useMemo(() => roiResult(roi, hoursPerFte, magnitudeRef), [roi, hoursPerFte, magnitudeRef]);
  const roadmap = useMemo(
    () => buildRoadmap(diag, approach, roiCalc, currency, context, locale),
    [diag, approach, roiCalc, currency, context, locale]
  );

  const [saveState, setSaveState] = useState<"idle" | "saved" | "error" | "conflict">("idle");
  const [isSaving, startSaving] = useTransition();
  const [reportState, setReportState] = useState<"idle" | "error">("idle");
  const [isExporting, startExporting] = useTransition();

  const skipDirty = useRef(true);
  useEffect(() => {
    if (skipDirty.current) {
      skipDirty.current = false;
      return;
    }
    setSaveState("idle");
  }, [processName, answers, context, weights, currency, roi, aiAnalysis]);

  const handleSave = (force = false) => {
    if (!processId) return;
    startSaving(async () => {
      const r = roiCalc;
      const res = await saveProcess(processId, {
        name: processName,
        currency,
        context,
        answers,
        weights,
        aptitudeScore: diag.overall,
        roiInputs: roi,
        valueScore: r.valueScore,
        netRecurring: r.netRecurring,
        aiAnalysis,
        expectedUpdatedAt: lastUpdatedAt,
        force,
      });
      if (res.ok) {
        setSaveState("saved");
        setLastUpdatedAt(res.updatedAt);
        setHistory((h) => [
          { id: `local-${Date.now()}`, aptitude_score: diag.overall, value_score: r.valueScore, net_recurring: r.netRecurring, saved_at: new Date().toISOString() },
          ...h,
        ]);
      } else {
        setSaveState(res.conflict ? "conflict" : "error");
      }
    });
  };

  const [exportKind, setExportKind] = useState<"full" | "summary" | null>(null);

  const exportPdf = (endpoint: string, filenamePrefix: string, kind: "full" | "summary") => {
    if (!isPaid) {
      router.push(localizePath("/compte", locale));
      return;
    }
    setExportKind(kind);
    startExporting(async () => {
      setReportState("idle");
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            processId,
            processName,
            currency,
            context,
            answers,
            weights,
            roiInputs: roi,
            aiAnalysis,
            locale,
          }),
        });
        if (!res.ok) throw new Error("export failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filenamePrefix}-${processName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "rapport"}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        setReportState("error");
      }
    });
  };

  const handleExport = () => exportPdf("/api/report", "cadran", "full");
  const handleExportSummary = () => exportPdf("/api/report/summary", "cadran-resume", "summary");

  const handleAddTag = (tag: string) => {
    if (!processId || tags.includes(tag)) return;
    const next = [...tags, tag];
    setTags(next);
    updateProcessTags(processId, next);
  };
  const handleRemoveTag = (tag: string) => {
    if (!processId) return;
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    updateProcessTags(processId, next);
  };

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader tab={tab} setTab={changeTab} loggedIn={loggedIn} />
      <ProcessBar
        processName={processName}
        setProcessName={setProcessName}
        tags={tags}
        onAddTag={processId && !readOnly ? handleAddTag : undefined}
        onRemoveTag={processId && !readOnly ? handleRemoveTag : undefined}
        readOnly={readOnly}
      />

      {!processId && (
        <div className="no-print bg-accent-soft border-b border-accent/15">
          <div className="max-w-[1160px] mx-auto px-5 sm:px-6 py-2.5 text-[12.5px] text-accent-deep flex items-center gap-2 flex-wrap">
            <span>{t.notSavedNotice}</span>
            <LocaleLink href="/inscription" className="font-semibold hover:underline">
              {t.createAccount}
            </LocaleLink>
            <span>{t.toRetrieveLater}</span>
          </div>
        </div>
      )}

      <main className={`${tab === "roadmap" ? "max-w-[1500px]" : "max-w-[1160px]"} mx-auto w-full px-5 sm:px-6 py-9 pb-16`}>
        <div key={tab} className="animate-tab-fade-in">
          {tab === "contexte" && (
            <ContextSection
              context={context}
              setContext={setContext}
              setAnswers={setAnswers}
              processName={processName}
              processId={processId}
              initialAnalysis={aiAnalysis}
              onAnalysisChange={setAiAnalysis}
              onApplyRoi={(patch) => setRoi((p) => ({ ...p, ...patch }))}
              aiQuota={aiQuota}
              aiUsedThisMonth={aiUsedThisMonth}
              readOnly={readOnly}
              siblings={siblings}
            />
          )}
          {tab === "diagnostic" && (
            <Diagnostic
              answers={answers}
              setAnswers={setAnswers}
              weights={weights}
              setWeights={setWeights}
              context={context}
              initialContext={initialContext}
              history={history}
              currency={currency}
              readOnly={readOnly}
              loggedIn={loggedIn}
              onGoToContext={() => changeTab("contexte")}
              processId={processId}
            />
          )}
          {tab === "roi" && (
            <Roi
              inputs={roi}
              setInputs={setRoi}
              currency={currency}
              setCurrency={setCurrency}
              processName={processName}
              aptitudeOverall={diag.overall}
              aptitudeAnswered={diag.answeredCount > 0}
              readOnly={readOnly}
              hoursPerFte={hoursPerFte}
              magnitudeRef={magnitudeRef}
            />
          )}
          {tab === "prio" && (
            <Prioritisation
              answers={answers}
              weights={weights}
              context={context}
              roiInputs={roi}
              currency={currency}
              processName={processName}
              goTo={changeTab}
              aiAnalysis={aiAnalysis}
              hoursPerFte={hoursPerFte}
              magnitudeRef={magnitudeRef}
              threshold={priorityThreshold}
            />
          )}
          {tab === "roadmap" && (
            <RoadmapChecklist
              roadmap={roadmap}
              processId={processId}
              paybackMonths={roiCalc.payback}
              members={members}
              readOnly={readOnly}
            />
          )}
        </div>

        {nextTab && (
          <div className="mt-9 flex justify-end no-print">
            <button
              onClick={() => changeTab(nextTab)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-vivid text-ink text-[13.5px] font-semibold hover:brightness-95 transition"
            >
              {t.continueToTab.replace("{label}", TAB_LABELS[nextTab])}
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </main>

      {saveState === "conflict" && (
        <div className="no-print bg-coral/10 border-t border-coral/25">
          <div className="max-w-[1160px] mx-auto px-5 sm:px-6 py-2.5 text-[12.5px] text-coral flex items-center gap-2 flex-wrap">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{t.conflictNotice}</span>
            <button onClick={() => window.location.reload()} className="font-semibold hover:underline">
              {t.reloadPage}
            </button>
            <span>{t.or}</span>
            <button onClick={() => handleSave(true)} className="font-semibold hover:underline">
              {t.overwriteMine}
            </button>
          </div>
        </div>
      )}

      <div className="no-print sticky bottom-0 border-t border-line bg-white/90 backdrop-blur-md backdrop-saturate-150">
        <div className="max-w-[1160px] mx-auto px-5 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[12.5px] text-ink-faint">
            {readOnly && processId && (
              <>
                <Lock size={14} /> {t.readOnlyLabel}
              </>
            )}
            {!readOnly && processId && saveState === "saved" && !isSaving && (
              <>
                <Check size={14} className="text-accent" /> {t.savedLabel}
              </>
            )}
            {!readOnly && processId && saveState === "error" && !isSaving && (
              <>
                <CloudOff size={14} className="text-coral" /> {t.saveFailedLabel}
              </>
            )}
            {!readOnly && processId && saveState === "conflict" && !isSaving && (
              <>
                <AlertTriangle size={14} className="text-coral" /> {t.conflictDetectedLabel}
              </>
            )}
            {!readOnly && processId && saveState === "idle" && !isSaving && (
              <>
                <Cloud size={14} /> {t.unsavedChangesLabel}
              </>
            )}
            {!readOnly && processId && isSaving && (
              <>
                <Loader2 size={14} className="animate-spin-slow" /> {t.savingLabel}
              </>
            )}
            {reportState === "error" && !isExporting && (
              <span className="text-coral">{t.exportFailedLabel}</span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {processId && !readOnly && <ShareLinkPanel processId={processId} />}
            {tab === "roadmap" && (
              <>
                <button
                  onClick={handleExportSummary}
                  disabled={isExporting}
                  title={t.summaryTooltip}
                  className="px-4 py-2.5 rounded-lg border border-line bg-surface text-ink text-[13.5px] font-semibold hover:bg-accent-soft hover:border-accent/25 transition disabled:opacity-60 flex items-center gap-2"
                >
                  {isExporting && exportKind === "summary" ? (
                    <>
                      <Loader2 size={14} className="animate-spin-slow" /> {t.generatingLabel}
                    </>
                  ) : (
                    <>
                      {isPaid ? <FileText size={14} /> : <Lock size={14} className="text-gold" />}
                      {t.summaryButtonLabel}
                    </>
                  )}
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  title={t.reportTooltip}
                  className="px-5 py-2.5 rounded-lg border border-line bg-surface text-ink text-[13.5px] font-semibold hover:bg-accent-soft hover:border-accent/25 transition disabled:opacity-60 flex items-center gap-2"
                >
                  {isExporting && exportKind === "full" ? (
                    <>
                      <Loader2 size={14} className="animate-spin-slow" /> {t.generatingLabel}
                    </>
                  ) : (
                    <>
                      {isPaid ? <Download size={14} /> : <Lock size={14} className="text-gold" />}
                      {t.reportButtonLabel}
                    </>
                  )}
                </button>
              </>
            )}
            {processId && !readOnly && (
              <button
                onClick={() => handleSave()}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-lg bg-accent-vivid text-ink text-[13.5px] font-semibold hover:brightness-95 transition disabled:opacity-60"
              >
                {t.saveButtonLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      <footer className="no-print max-w-[1160px] mx-auto w-full px-5 sm:px-6 pb-11">
        <div className="border-t border-line pt-4 text-[11.5px] text-ink-faint flex justify-between flex-wrap gap-2">
          <span>{t.footerTagline}</span>
          <span className="font-mono">{t.footerPerProcess}</span>
        </div>
      </footer>
    </div>
  );
}
