import { AnalysisResult, ApproachRecommendation, constraintsSummary, Context, Currency, DiagnosticResult, getToolCatalog, parseSelectedTools, RoiResult, sponsorDisplay } from "@/lib/scoring";
import { money, truncateCell } from "@/lib/pdf/format";
import { pdf as pdfFr } from "@/i18n/dictionaries/fr/pdf";
import { pdf as pdfEn } from "@/i18n/dictionaries/en/pdf";
import type { Locale } from "@/i18n/config";

// Import direct des dictionnaires `pdf` (comme scoring.ts) plutôt que via getDictionary() de
// @/i18n/getDictionary — ce dernier importe next/root-params, indisponible dans les Client
// Components. buildRoadmap() est appelé aussi bien côté serveur (génération du PDF) que côté
// client (onglet Feuille de route de ToolShell.tsx), donc ce module doit rester sans dépendance
// serveur-only.
function getPdfDict(locale: Locale) {
  return locale === "en" ? pdfEn : pdfFr;
}

export type RoadmapItem = { key: string; title: string; text: string };
/** startWeek/durationWeeks bornent la phase sur l'axe du Gantt, semaines écoulées depuis
 * aujourd'hui (l'origine de la feuille de route n'a pas de date de début fixée par l'utilisateur).
 * Ce sont des estimations dérivées de `timeframe` (même borne haute), pas une planification
 * validée — le Gantt reste un aperçu indicatif, jamais un engagement de calendrier. */
export type RoadmapPhase = { title: string; timeframe: string; items: RoadmapItem[]; startWeek: number; durationWeeks: number };
export type Roadmap = { phases: RoadmapPhase[]; immediate: RoadmapItem[]; immediateDurationWeeks: number; immediateTimeframe: string };

/** Durées indicatives en semaines, alignées sur la borne haute des `timeframe` affichés
 * ("2 à 4 semaines" → 4, "1 à 3 mois" → 12, "3 à 6 mois" → 24) — un seul endroit à ajuster
 * si ces bornes changent, pour que le texte et le Gantt ne divergent jamais. */
export const IMMEDIATE_DURATION_WEEKS = 1;
const PHASE_DURATIONS_WEEKS = [4, 12, 24];

export function buildRoadmap(
  diag: DiagnosticResult,
  approach: ApproachRecommendation | null,
  roi: RoiResult,
  currency: Currency,
  context: Context,
  locale: Locale = "fr"
): Roadmap {
  const t = getPdfDict(locale).roadmap;
  const LEVER_PREP_ITEMS: Record<string, (score: number) => string> = {
    std: (s) => t.leverPrepStd.replace("{score}", String(s)),
    rules: (s) => t.leverPrepRules.replace("{score}", String(s)),
    data: (s) => t.leverPrepData.replace("{score}", String(s)),
    vol: (s) => t.leverPrepVol.replace("{score}", String(s)),
    tech: (s) => t.leverPrepTech.replace("{score}", String(s)),
    risk: (s) => t.leverPrepRisk.replace("{score}", String(s)),
  };
  const APPROACH_PILOT_ITEM: Record<ApproachRecommendation["id"], string> = {
    process_first: t.approachPilotProcessFirst,
    rpa: t.approachPilotRpa,
    idp: t.approachPilotIdp,
    agentic: t.approachPilotAgentic,
    hybrid: t.approachPilotHybrid,
  };

  const weak = diag.dimScores
    .filter((d) => d.answered > 0 && d.score < 50)
    .sort((a, b) => a.score - b.score)
    .slice(0, 4);

  // `key` identifie l'étape de façon stable (branche de code), indépendamment du texte
  // interpolé (score, noms...) — c'est ce qui permet de persister une case cochée dans
  // roadmap_progress même quand le texte affiché change d'une régénération à l'autre.
  const sponsor = sponsorDisplay(context);
  const phase1Items: RoadmapItem[] = [];
  phase1Items.push({
    key: "sponsorConfirm",
    title: t.titleSponsorConfirm,
    text: sponsor ? t.sponsorConfirm.replace("{sponsor}", sponsor) : t.sponsorConfirmFallback,
  });
  phase1Items.push({
    key: "scopeValidate",
    title: t.titleScopeValidate,
    text: context.actors?.trim()
      ? t.scopeValidateWithActors.replace("{actors}", context.actors.trim())
      : t.scopeValidateFallback,
  });
  phase1Items.push({ key: "exitPlan", title: t.titleExitPlan, text: t.exitPlan });
  phase1Items.push({
    key: "humanImpact",
    title: t.titleHumanImpact,
    text: context.actors?.trim()
      ? t.humanImpactWithActors.replace("{actors}", context.actors.trim())
      : t.humanImpactFallback,
  });
  const constraints = constraintsSummary(context);
  if (constraints) {
    phase1Items.push({ key: "liftConstraints", title: t.titleLiftConstraints, text: t.liftConstraints.replace("{constraints}", constraints) });
  }
  if (context.systems?.trim()) {
    phase1Items.push({
      key: "validateIntegrations",
      title: t.titleValidateIntegrations,
      text: t.validateIntegrations.replace("{systems}", context.systems.trim()),
    });
  }
  if (weak.length > 0) {
    weak.forEach((d) =>
      phase1Items.push({
        key: `leverPrep-${d.id}`,
        title: d.label,
        text: LEVER_PREP_ITEMS[d.id]?.(d.score) ?? t.weakLeverFallback.replace("{label}", d.label).replace("{score}", String(d.score)),
      })
    );
  } else if (diag.answeredCount > 0) {
    phase1Items.push({ key: "noWeakLever", title: t.titleNoWeakLever, text: t.noWeakLever });
  } else {
    phase1Items.push({ key: "completeToConfirm", title: t.titleCompleteToConfirm, text: t.completeToConfirm });
  }
  // Jalons clés du parcours fournisseur — universels à tout projet d'automatisation, donc
  // ajoutés sans condition (contrairement aux items ci-dessus, dérivés du diagnostic).
  phase1Items.push({ key: "contactVendor", title: t.titleContactVendor, text: t.contactVendor });
  phase1Items.push({ key: "selectVendorContract", title: t.titleSelectVendorContract, text: t.selectVendorContract });

  const phase2Items: RoadmapItem[] = [{ key: "pilotKickoff", title: t.titlePilotKickoff, text: t.pilotKickoff }];
  if (approach) phase2Items.push({ key: "approachPilot", title: t.titleApproachPilot, text: APPROACH_PILOT_ITEM[approach.id] });
  phase2Items.push({
    key: "targetPain",
    title: t.titleTargetPain,
    text: context.pain?.trim() ? t.targetPain.replace("{pain}", context.pain.trim()) : t.defineIndicators,
  });
  if (context.exceptions?.trim()) {
    phase2Items.push({
      key: "documentExceptions",
      title: t.titleDocumentExceptions,
      text: t.documentExceptions.replace("{exceptions}", context.exceptions.trim()),
    });
  }
  phase2Items.push({ key: "humanSupervision", title: t.titleHumanSupervision, text: t.humanSupervision });
  phase2Items.push({ key: "pilotReview", title: t.titlePilotReview, text: t.pilotReview });

  const phase3Items: RoadmapItem[] = [
    { key: "productionGoLive", title: t.titleProductionGoLive, text: t.productionGoLive },
    { key: "extendAutomation", title: t.titleExtendAutomation, text: t.extendAutomation },
    { key: "updateDocs", title: t.titleUpdateDocs, text: t.updateDocs },
    { key: "designateOperator", title: t.titleDesignateOperator, text: t.designateOperator },
  ];
  if (roi.netRecurring > 0) {
    phase3Items.push({
      key: "trackSavings",
      title: t.titleTrackSavings,
      text: t.trackSavings.replace("{amount}", money(roi.netRecurring, currency, locale)),
    });
  }
  phase3Items.push({ key: "reassessAfterDeploy", title: t.titleReassessAfterDeploy, text: t.reassessAfterDeploy });

  const immediate: RoadmapItem[] = [
    {
      key: "shareReport",
      title: t.titleShareReport,
      text: sponsor ? t.shareReportWithSponsor.replace("{sponsor}", sponsor) : t.shareReportFallback,
    },
    {
      key: "prioritizeWeakest",
      title: t.titlePrioritizeWeakest,
      text:
        weak.length > 0
          ? t.prioritizeWeakest.replace("{label}", weak[0].label).replace("{score}", String(weak[0].score))
          : t.blockTwoWeeks,
    },
    {
      key: "alignTimeline",
      title: t.titleAlignTimeline,
      text: context.timeline?.trim() ? t.alignTimeline.replace("{timeline}", context.timeline.trim()) : t.setTargetTimeline,
    },
  ];

  const phaseItems = [phase1Items, phase2Items, phase3Items];
  const phaseTitles = [t.phase1Title, t.phase2Title, t.phase3Title];
  const phaseTimeframes = [t.phase1Timeframe, t.phase2Timeframe, t.phase3Timeframe];
  let cursor = 0;
  const phases: RoadmapPhase[] = PHASE_DURATIONS_WEEKS.map((durationWeeks, i) => {
    const startWeek = cursor;
    cursor += durationWeeks;
    return { title: phaseTitles[i], timeframe: phaseTimeframes[i], items: phaseItems[i], startWeek, durationWeeks };
  });

  return { phases, immediate, immediateDurationWeeks: IMMEDIATE_DURATION_WEEKS, immediateTimeframe: t.immediateTimeframe };
}

export type RiskLevel = "Faible" | "Moyenne" | "Élevée";
export type RiskRegisterEntry = {
  risk: string;
  probability: RiskLevel;
  impact: RiskLevel;
  mitigation: string;
  owner: string;
};

const LEVEL_RANK: Record<RiskLevel, number> = { Faible: 1, Moyenne: 2, Élevée: 3 };

/** `RiskLevel` reste toujours en français (comparé via LEVEL_RANK, pas seulement affiché) — même
 * convention que AssessmentConfidence.label/AdoptionEase.label dans scoring.ts. Utiliser cette
 * fonction pour l'affichage traduit. */
export function riskLevelLabel(level: RiskLevel, locale: Locale = "fr"): string {
  return getPdfDict(locale).riskLevel[level];
}

/**
 * Registre de risques dérivé des signaux déjà calculés (leviers faibles, mise en garde de
 * l'approche recommandée, risques IA) — pas de nouvelle saisie requise. Probabilité et impact
 * sont des heuristiques à valider par l'équipe, pas une évaluation actuarielle.
 */
export function buildRiskRegister(
  diag: DiagnosticResult,
  context: Context,
  approach: ApproachRecommendation | null,
  aiAnalysis?: AnalysisResult | null,
  locale: Locale = "fr"
): RiskRegisterEntry[] {
  const t = getPdfDict(locale).riskRegister;
  const owner = truncateCell(sponsorDisplay(context) || t.ownerToAssign);
  const entries: RiskRegisterEntry[] = [];

  diag.dimScores
    .filter((d) => d.answered > 0 && d.score < 50)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .forEach((d) => {
      entries.push({
        risk: t.leverInsufficient.replace("{label}", d.label).replace("{score}", String(d.score)),
        probability: d.score < 30 ? "Élevée" : "Moyenne",
        impact: d.weight >= 18 ? "Élevée" : d.weight >= 13 ? "Moyenne" : "Faible",
        mitigation: d.reco,
        owner,
      });
    });

  if (approach?.caution) {
    entries.push({
      risk: approach.caution,
      probability: "Élevée",
      impact: "Élevée",
      mitigation: t.cautionMitigation,
      owner,
    });
  }

  (aiAnalysis?.risques ?? []).slice(0, 3).forEach((risk) => {
    entries.push({
      risk,
      probability: "Moyenne",
      impact: "Moyenne",
      mitigation: t.mitigationValidate,
      owner,
    });
  });

  return entries
    .sort((a, b) => LEVEL_RANK[b.probability] * LEVEL_RANK[b.impact] - LEVEL_RANK[a.probability] * LEVEL_RANK[a.impact])
    .slice(0, 6);
}

export type RaciRow = { activity: string; responsible: string; accountable: string; consulted: string; informed: string };

/** Matrice RACI standard pour un projet d'automatisation, seedée avec les noms disponibles dans le contexte. */
export function buildRaci(context: Context, approach: ApproachRecommendation | null, locale: Locale = "fr"): RaciRow[] {
  const t = getPdfDict(locale).raci;
  const APPROACH_RESPONSIBLE: Record<ApproachRecommendation["id"], string> = {
    process_first: t.responsibleBusiness,
    rpa: t.responsibleIt,
    idp: t.responsibleIt,
    agentic: t.responsibleAi,
    hybrid: t.responsibleItAndBusiness,
  };
  const accountable = truncateCell(sponsorDisplay(context) || t.accountableFallback);
  const consulted = truncateCell(context.actors?.trim() || t.consultedFallback);
  const responsible = approach ? APPROACH_RESPONSIBLE[approach.id] : t.responsibleIt;
  const informed = t.informed;

  return [
    { activity: t.activityScoping, responsible: consulted, accountable, consulted: responsible, informed },
    { activity: t.activityDev, responsible, accountable, consulted, informed },
    { activity: t.activityTests, responsible, accountable, consulted, informed },
    { activity: t.activityDeploy, responsible, accountable: consulted, consulted: responsible, informed },
    { activity: t.activitySupervision, responsible, accountable, consulted: t.consultedCompliance, informed },
  ];
}

/** Checklist de conformité : base commune + éléments spécifiques à la catégorie, aux réglementations
 * déclarées et à l'approche IA. */
export function buildComplianceChecklist(context: Context, approach: ApproachRecommendation | null, locale: Locale = "fr"): string[] {
  const t = getPdfDict(locale).compliance;
  const CATEGORY_COMPLIANCE: Record<string, string[]> = {
    finance: t.categoryFinance,
    hr: t.categoryHr,
    customer_service: t.categoryCustomerService,
    legal_compliance: t.categoryLegalCompliance,
    supply_chain: t.categorySupplyChain,
    procurement: t.categoryProcurement,
  };
  const REGULATION_COMPLIANCE: Record<string, string> = {
    rgpd_loi25: t.regGdprLoi25,
    pci_dss: t.regPciDss,
    hipaa_sante: t.regHipaaSante,
    sox_finance: t.regSoxFinance,
    audit_legal: t.regAuditLegal,
  };

  const items = [t.baseSensitivity, t.baseRetention, t.baseDpia];
  const catItems = context.category ? CATEGORY_COMPLIANCE[context.category] : undefined;
  if (catItems) items.push(...catItems);
  (context.regulations || "").split(";").filter(Boolean).forEach((tagId) => {
    if (tagId === "other") {
      const other = (context.regulationsOther || "").trim();
      if (other) items.push(t.otherRegulation.replace("{other}", other));
      return;
    }
    const item = REGULATION_COMPLIANCE[tagId];
    if (item) items.push(item);
  });
  if (approach?.id === "agentic") {
    items.push(t.agenticGovernance, t.agenticErrorControl);
  }
  return items;
}

export type VendorSuggestion = { name: string; tier: string; matchNote?: string; limits?: string; ecosystem?: string };

const MS_ECOSYSTEM_TERMS = ["microsoft", "365", "teams", "sharepoint", "outlook", "power automate", "dynamics", "azure"];
const ENTERPRISE_ERP_TERMS = ["sap", "salesforce", "oracle", "workday", "erp", "crm"];
/** Équivalents structurés des termes ci-dessus, issus de l'inventaire d'outils coché par l'utilisateur.
 * Une case cochée est un signal fiable là où le texte libre ne l'est qu'à moitié — on la privilégie donc. */
const MS_ECOSYSTEM_TOOL_IDS = ["power_automate", "power_apps", "copilot_studio", "outlook", "teams", "sharepoint", "dynamics", "power_bi"];
const ENTERPRISE_ERP_TOOL_IDS = ["sap", "oracle", "salesforce", "workday", "netsuite", "servicenow"];
const MS_VENDOR_NAMES = ["Microsoft Power Automate", "Azure AI Document Intelligence", "Power Automate + Copilot Studio"];
const ENTERPRISE_VENDOR_NAMES = ["UiPath", "Automation Anywhere", "ABBYY Vantage"];

/**
 * Sélection indicative d'outils par approche — pistes de départ, pas une recommandation d'achat ni une liste exhaustive.
 * Si les systèmes déclarés au contexte évoquent clairement un écosystème (Microsoft ou ERP d'entreprise), l'outil
 * correspondant reçoit une note explicative dérivée du texte saisi par l'utilisateur — jamais une note inventée.
 */
export function buildVendorShortlist(approach: ApproachRecommendation | null, context?: Context, locale: Locale = "fr"): VendorSuggestion[] {
  if (!approach) return [];
  const t = getPdfDict(locale).vendorShortlist;
  const APPROACH_VENDORS: Record<ApproachRecommendation["id"], VendorSuggestion[]> = {
    process_first: [],
    rpa: t.rpa,
    idp: t.idp,
    agentic: t.agentic,
    hybrid: t.hybrid,
  };
  const list = APPROACH_VENDORS[approach.id] ?? [];

  // Deux sources de signal : les outils cochés à l'inventaire (précis) et le texte libre des
  // systèmes (approximatif). La note affichée cite la source qui a effectivement déclenché la
  // correspondance — jamais une note inventée.
  const catalog = context ? getToolCatalog(locale) : [];
  const labelById = new Map(catalog.flatMap((g) => g.tools.map((tool) => [tool.id, tool.label] as const)));
  const selectedIds = context ? parseSelectedTools(context) : [];
  const msTools = selectedIds.filter((id) => MS_ECOSYSTEM_TOOL_IDS.includes(id)).map((id) => labelById.get(id) ?? id);
  const entTools = selectedIds.filter((id) => ENTERPRISE_ERP_TOOL_IDS.includes(id)).map((id) => labelById.get(id) ?? id);

  const systems = context?.systems?.trim();
  const text = (systems || "").toLowerCase();
  const msEvidence = msTools.length > 0 ? msTools.join(", ") : MS_ECOSYSTEM_TERMS.some((k) => text.includes(k)) ? systems : null;
  const entEvidence = entTools.length > 0 ? entTools.join(", ") : ENTERPRISE_ERP_TERMS.some((k) => text.includes(k)) ? systems : null;
  if (!msEvidence && !entEvidence) return list;

  return list.map((v) => {
    if (msEvidence && MS_VENDOR_NAMES.includes(v.name)) {
      return { ...v, matchNote: t.matchNoteMs.replace("{systems}", msEvidence) };
    }
    if (entEvidence && ENTERPRISE_VENDOR_NAMES.includes(v.name)) {
      return { ...v, matchNote: t.matchNoteEnterprise.replace("{systems}", entEvidence) };
    }
    return v;
  });
}

/** Questions concrètes à poser à un prestataire avant de l'engager — complète la liste de pistes d'outils. */
export function buildVendorQuestions(approach: ApproachRecommendation | null, locale: Locale = "fr"): string[] {
  const t = getPdfDict(locale).vendorQuestions;
  const APPROACH_VENDOR_QUESTIONS: Record<ApproachRecommendation["id"], string[]> = {
    process_first: [],
    rpa: t.rpa,
    idp: t.idp,
    agentic: t.agentic,
    hybrid: t.hybrid,
  };
  const specific = approach ? APPROACH_VENDOR_QUESTIONS[approach.id] ?? [] : [];
  return [...t.generic, ...specific];
}

/** Bonnes pratiques de sécurité opérationnelle — complète la checklist de conformité (réglementaire/vie privée). */
export function buildSecurityChecklist(approach: ApproachRecommendation | null, locale: Locale = "fr"): string[] {
  const t = getPdfDict(locale).security;
  const APPROACH_SECURITY: Record<ApproachRecommendation["id"], string[]> = {
    process_first: [],
    rpa: t.rpa,
    idp: t.idp,
    agentic: t.agentic,
    hybrid: t.hybrid,
  };
  const approachItems = approach ? APPROACH_SECURITY[approach.id] : [];
  return [...t.base, ...(approachItems ?? [])];
}
