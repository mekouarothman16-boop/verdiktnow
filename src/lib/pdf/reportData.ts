import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AnalysisResult,
  Answers,
  adoptionEase,
  assessmentConfidence,
  buildToolInventory,
  Context,
  Currency,
  CURRENCIES,
  DEFAULT_ROI_INPUTS,
  DEFAULT_WEIGHTS,
  getApplicableContextQuestions,
  getProcessCategories,
  getToolRoleMeta,
  parseActivities,
  parseAiSeededAnswers,
  parseCustomTools,
  parseSelectedTools,
  PortfolioEntry,
  PortfolioLeverRow,
  PROCESS_CATEGORIES,
  REGULATION_TAGS,
  RoiInputs,
  roiSensitivity,
  serializeActivities,
  serializeAiSeededAnswers,
  serializeCustomTools,
  serializeSelectedTools,
  VOLUME_VARIABILITY_OPTIONS,
  Weights,
  diagnosticResult,
  recommendApproach,
  roiResult,
  roiScenarios,
} from "@/lib/scoring";
import {
  buildComplianceChecklist,
  buildRaci,
  buildRiskRegister,
  buildRoadmap,
  buildSecurityChecklist,
  buildVendorQuestions,
  buildVendorShortlist,
} from "@/lib/pdf/roadmap";
import { sanitizeText } from "@/lib/pdf/format";
import { getDictionary } from "@/i18n/getDictionary";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/i18n/config";

const VERDICT_COLOR = {
  accent: "#55631A",
  olive: "#6B7D31",
  amber: "#9A6C1B",
  coral: "#C45033",
};

/** Réutilise le même texte de verdict que Prioritisation.tsx (dictionnaire tool.prioritisation) plutôt
 * que d'en dupliquer un troisième jeu, propre au PDF. */
export function buildVerdict(A: number, V: number, locale: Locale = "fr", threshold: number = 50) {
  const t = getDictionary(locale).tool.prioritisation;
  if (A >= threshold && V >= threshold) {
    return { title: t.verdictAutomateTitle, color: VERDICT_COLOR.accent, text: t.verdictAutomateText };
  }
  if (A >= threshold && V < threshold) {
    return { title: t.verdictPlanTitle, color: VERDICT_COLOR.olive, text: t.verdictPlanText };
  }
  if (A < threshold && V >= threshold) {
    return { title: t.verdictPrepareTitle, color: VERDICT_COLOR.amber, text: t.verdictPrepareText };
  }
  return { title: t.verdictSetAsideTitle, color: VERDICT_COLOR.coral, text: t.verdictSetAsideText };
}

export type ReportRequestBody = {
  processId?: string;
  processName?: string;
  currency?: string;
  context?: Record<string, string>;
  answers?: Answers;
  weights?: Weights;
  roiInputs?: RoiInputs;
  aiAnalysis?: AnalysisResult | null;
  locale?: string;
};

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? v[0] ?? null : v;
}

/** Le texte de l'analyse IA transite par le navigateur (persisté puis renvoyé tel quel), donc pas plus fiable
 * qu'un champ libre saisi à la main pour la contrainte de police du PDF — même traitement que le reste. */
function sanitizeAiAnalysis(a: AnalysisResult): AnalysisResult {
  return {
    ...a,
    synthese: sanitizeText(a.synthese ?? ""),
    risques: (a.risques ?? []).map(sanitizeText),
    leviers: Object.fromEntries(Object.entries(a.leviers ?? {}).map(([k, v]) => [k, sanitizeText(v)])),
    roiSuggestion: a.roiSuggestion ? { ...a.roiSuggestion, note: sanitizeText(a.roiSuggestion.note ?? "") } : null,
  };
}

export function parseReportRequest(body: ReportRequestBody) {
  const locale: Locale = isLocale(body.locale) ? body.locale : DEFAULT_LOCALE;
  const t = getDictionary(locale);
  const processName =
    typeof body.processName === "string" ? sanitizeText(body.processName).slice(0, 200) : t.pdf.untitledProcess;
  const currency: Currency = body.currency === "USD" ? "USD" : "CAD";

  const context: Context = {};
  if (body.context && typeof body.context === "object") {
    const cat = body.context.category;
    if (typeof cat === "string" && PROCESS_CATEGORIES.some((c) => c.id === cat)) {
      context.category = cat;
    }
    for (const q of getApplicableContextQuestions(context.category)) {
      const v = body.context[q.id];
      if (typeof v === "string") context[q.id] = sanitizeText(v).slice(0, 4000);
    }
    const vol = body.context.volumeVariability;
    if (typeof vol === "string" && VOLUME_VARIABILITY_OPTIONS.some((o) => o.id === vol)) {
      context.volumeVariability = vol;
    }
    const regs = body.context.regulations;
    if (typeof regs === "string") {
      const valid = regs.split(";").filter((id) => REGULATION_TAGS.some((r) => r.id === id));
      if (valid.length > 0) context.regulations = valid.join(";");
      if (valid.includes("other") && typeof body.context.regulationsOther === "string") {
        context.regulationsOther = sanitizeText(body.context.regulationsOther).slice(0, 200);
      }
    }
    const activitiesSerialized = serializeActivities(parseActivities(body.context as Record<string, string>));
    if (activitiesSerialized) context.activities = activitiesSerialized;
    const toolsSelected = serializeSelectedTools(parseSelectedTools(body.context as Record<string, string>));
    if (toolsSelected) context.toolsSelected = toolsSelected;
    const toolsCustom = serializeCustomTools(
      parseCustomTools(body.context as Record<string, string>).map((tool) => ({
        ...tool,
        name: sanitizeText(tool.name).slice(0, 120),
        usage: sanitizeText(tool.usage).slice(0, 300),
      }))
    );
    if (toolsCustom) context.toolsCustom = toolsCustom;
    const aiSeededSerialized = serializeAiSeededAnswers(parseAiSeededAnswers(body.context as Record<string, string>));
    if (aiSeededSerialized) context.aiSeededAnswers = aiSeededSerialized;
  }
  const categoryLabel = context.category
    ? getProcessCategories(locale).find((c) => c.id === context.category)?.label ?? null
    : null;

  const answers: Answers = body.answers && typeof body.answers === "object" ? body.answers : {};
  const weights: Weights = body.weights && typeof body.weights === "object" ? body.weights : DEFAULT_WEIGHTS;
  const roiInputs: RoiInputs = { ...DEFAULT_ROI_INPUTS, ...(body.roiInputs && typeof body.roiInputs === "object" ? body.roiInputs : {}) };
  const aiAnalysis: AnalysisResult | null =
    body.aiAnalysis && typeof body.aiAnalysis === "object" ? sanitizeAiAnalysis(body.aiAnalysis) : null;
  const currentProcessId = typeof body.processId === "string" ? body.processId : null;

  return { processName, currency, context, categoryLabel, answers, weights, roiInputs, aiAnalysis, currentProcessId, locale };
}

export type ParsedReportRequest = ReturnType<typeof parseReportRequest>;

/** Calcule tout ce dont les deux formats de rapport (complet et résumé une page) ont besoin, en un seul endroit. */
export async function computeReportData(
  supabase: SupabaseClient,
  organizationId: string,
  parsed: ParsedReportRequest,
  orgConstants: { hoursPerFte: number; magnitudeRef: number; priorityThreshold: number } = { hoursPerFte: 1600, magnitudeRef: 120000, priorityThreshold: 50 }
) {
  const { context, answers, weights, roiInputs, aiAnalysis, currency, currentProcessId, locale } = parsed;
  const { hoursPerFte, magnitudeRef, priorityThreshold } = orgConstants;

  const diag = diagnosticResult(answers, weights, context, locale);
  const approach = recommendApproach(diag, context, locale);
  const roi = roiResult(roiInputs, hoursPerFte, magnitudeRef);
  const scenarios = roiScenarios(roiInputs, hoursPerFte, magnitudeRef);
  const sensitivity = roiSensitivity(roiInputs, 20, locale);

  let secondOpinionSummaries: { answeredCount: number; overall: number }[] = [];
  if (currentProcessId) {
    const { data: opinionRows } = await supabase
      .from("assessment_second_opinions")
      .select("answers")
      .eq("process_id", currentProcessId);
    secondOpinionSummaries = (opinionRows ?? []).map((row: { answers: Answers }) => {
      const d = diagnosticResult(row.answers, weights, context, locale);
      return { answeredCount: d.answeredCount, overall: d.overall };
    });
  }
  const confidence = assessmentConfidence(diag, context, answers, !!aiAnalysis, secondOpinionSummaries, locale);
  const adoption = adoptionEase(diag, context, approach, locale);
  // Sanitisé ici (et non dans parseActivities/scoring.ts) car la contrainte de police est propre au PDF —
  // l'affichage web de ces mêmes activités peut afficher n'importe quel unicode sans problème.
  const activities = parseActivities(context).map((a) => ({
    ...a,
    label: sanitizeText(a.label),
    actor: sanitizeText(a.actor),
    system: sanitizeText(a.system),
    friction: sanitizeText(a.friction),
  }));
  const ready = diag.answeredCount > 0;
  const verdict = ready ? buildVerdict(diag.overall, roi.valueScore, locale, priorityThreshold) : null;
  const roadmap = buildRoadmap(diag, approach, roi, currency, context, locale);
  const riskRegister = buildRiskRegister(diag, context, approach, aiAnalysis, locale);
  const raci = buildRaci(context, approach, locale);
  const compliance = buildComplianceChecklist(context, approach, locale);
  const security = buildSecurityChecklist(approach, locale);
  const vendorShortlist = buildVendorShortlist(approach, context, locale);
  const vendorQuestions = buildVendorQuestions(approach, locale);
  const toolInventory = buildToolInventory(context, locale);
  const toolRoleMeta = getToolRoleMeta(locale);

  const { data: portfolioRows } = await supabase
    .from("processes")
    .select("id, name, currency, assessments(aptitude_score, answers, weights, context), roi_inputs(inputs, value_score)")
    .eq("organization_id", organizationId);

  const portfolioLevers: PortfolioLeverRow[] = (portfolioRows ?? [])
    .map((p) => {
      const a = one<{ aptitude_score: number | null; answers: Answers | null; weights: Weights | null; context: Context | null }>(p.assessments);
      if (!a?.answers || !a.weights || a.aptitude_score == null) return null;
      const d = diagnosticResult(a.answers, a.weights, a.context ?? {}, locale);
      if (d.answeredCount === 0) return null;
      const scores = Object.fromEntries(d.dimScores.map((dim) => [dim.id, dim.score]));
      return { id: p.id, name: p.name, scores };
    })
    .filter((p): p is PortfolioLeverRow => p !== null);

  const portfolio: PortfolioEntry[] = (portfolioRows ?? [])
    .map((p) => {
      const a = one<{ aptitude_score: number | null }>(p.assessments)?.aptitude_score;
      const v = one<{ value_score: number | null }>(p.roi_inputs)?.value_score;
      return a != null && v != null ? { id: p.id, name: p.name, A: a, V: v } : null;
    })
    .filter((p): p is PortfolioEntry => p !== null)
    .sort((a, b) => (b.A + b.V) / 2 - (a.A + a.V) / 2);

  // Ne cumuler que les processus dans la même devise que ce rapport — additionner CAD et USD serait faux.
  const portfolioTotalValue = (portfolioRows ?? [])
    .filter((p) => p.currency === currency)
    .reduce((sum, p) => {
      const inputs = one<{ inputs: RoiInputs | null }>(p.roi_inputs)?.inputs;
      if (!inputs) return sum;
      return sum + roiResult({ ...DEFAULT_ROI_INPUTS, ...inputs }, hoursPerFte, magnitudeRef).netRecurring;
    }, 0);

  const generatedAt = new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "fr-CA", { dateStyle: "long", timeStyle: "short" }).format(new Date());

  return {
    diag,
    approach,
    roi,
    scenarios,
    sensitivity,
    confidence,
    adoption,
    activities,
    ready,
    verdict,
    roadmap,
    riskRegister,
    raci,
    compliance,
    security,
    vendorShortlist,
    vendorQuestions,
    toolInventory,
    toolRoleMeta,
    portfolio,
    portfolioTotalValue,
    portfolioLevers,
    generatedAt,
    aptitudeScore: diag.overall,
    valueScore: roi.valueScore,
    priorityThreshold,
  };
}
