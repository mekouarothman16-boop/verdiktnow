import { describe, it, expect } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  diagnosticResult,
  recommendApproach,
  roiResult,
  roiScenarios,
  roiSensitivity,
  assessmentConfidence,
  adoptionEase,
  prioritizationQuadrant,
  buildToolInventory,
  getToolRoleMeta,
  parseActivities,
  serializeActivities,
  DEFAULT_WEIGHTS,
  DEFAULT_ROI_INPUTS,
  DIMENSIONS,
  type Answers,
  type Context,
} from "@/lib/scoring";
import { buildRoadmap, buildRiskRegister, buildRaci, buildComplianceChecklist, buildSecurityChecklist, buildVendorShortlist, buildVendorQuestions } from "@/lib/pdf/roadmap";
import { ReportDocument } from "@/lib/pdf/ReportDocument";

/** Un jeu de props complet, construit avec les mêmes fonctions que l'application réelle
 * (pas des objets inventés à la main) — ce test vérifie que la chaîne diagnostic → ROI →
 * feuille de route → annexes s'assemble sans planter dans le gabarit PDF, ce qu'aucun test
 * unitaire des fonctions prises séparément ne peut garantir. */
function buildRealisticReportProps(locale: "fr" | "en" = "fr") {
  const context: Context = {
    sponsorName: "Marie Tremblay",
    sponsorRole: "Directrice des opérations",
    actors: "Agent AP, Superviseur",
    systems: "SAP, Excel, courriel",
    pain: "Ressaisie manuelle, délais d'approbation",
    exceptions: "Facture sans bon de commande",
    regulations: "rgpd_loi25",
    category: "finance",
    activities: serializeActivities([
      { id: "a1", label: "Réception et tri", actor: "Agent AP", system: "Courriel", minutes: 8, friction: "Formats hétérogènes", rulesBased: false, digitalData: false, frequentExceptions: true },
      { id: "a2", label: "Rapprochement", actor: "Agent AP", system: "SAP", minutes: 12, friction: "", rulesBased: true, digitalData: true, frequentExceptions: false },
    ]),
  };
  const answers: Answers = Object.fromEntries(
    DIMENSIONS.flatMap((d) => d.questions.map((_, i) => [`${d.id}-${i}`, 3]))
  );
  const diag = diagnosticResult(answers, DEFAULT_WEIGHTS, context, locale);
  const approach = recommendApproach(diag, context, locale);
  const roiInputs = DEFAULT_ROI_INPUTS;
  const roi = roiResult(roiInputs);
  const scenarios = roiScenarios(roiInputs);
  const sensitivity = roiSensitivity(roiInputs, 20, locale);
  const confidence = assessmentConfidence(diag, context, answers, false, [], locale);
  const adoption = adoptionEase(diag, context, approach, locale);
  const aptitudeScore = diag.overall;
  const valueScore = roi.valueScore;
  const quadrant = prioritizationQuadrant(aptitudeScore, valueScore);
  const verdict = { title: quadrant, text: quadrant, color: "#000000" };
  const roadmap = buildRoadmap(diag, approach, roi, "CAD", context, locale);
  const riskRegister = buildRiskRegister(diag, context, approach, null, locale);
  const raci = buildRaci(context, approach, locale);
  const compliance = buildComplianceChecklist(context, approach, locale);
  const security = buildSecurityChecklist(approach, locale);
  const vendorShortlist = buildVendorShortlist(approach, context, locale);
  const vendorQuestions = buildVendorQuestions(approach, locale);
  const toolInventory = buildToolInventory(context, locale);
  const toolRoleMeta = getToolRoleMeta(locale);
  const activities = parseActivities(context);

  return {
    processName: "Traitement des factures",
    currency: "CAD" as const,
    categoryLabel: "Finance & comptabilité",
    generatedAt: new Date().toISOString(),
    context,
    answers,
    weights: DEFAULT_WEIGHTS,
    diag,
    approach,
    roi,
    roiInputs,
    scenarios,
    sensitivity,
    confidence,
    adoption,
    verdict,
    aptitudeScore,
    valueScore,
    roadmap,
    riskRegister,
    raci,
    compliance,
    security,
    vendorShortlist,
    vendorQuestions,
    toolInventory,
    toolRoleMeta,
    activities,
    aiAnalysis: null,
    locale,
  };
}

describe("ReportDocument (PDF rendering smoke test)", () => {
  it("renders a complete report to a valid PDF buffer in French without throwing", async () => {
    const buffer = await renderToBuffer(<ReportDocument {...buildRealisticReportProps("fr")} />);
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(2000);
  });

  it("renders a complete report to a valid PDF buffer in English without throwing", async () => {
    const buffer = await renderToBuffer(<ReportDocument {...buildRealisticReportProps("en")} />);
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });

  it("renders an empty, freshly-created diagnostic (no answers, no approach) without throwing", async () => {
    const context: Context = {};
    const answers: Answers = {};
    const diag = diagnosticResult(answers, DEFAULT_WEIGHTS, context);
    const approach = recommendApproach(diag, context);
    const roi = roiResult(DEFAULT_ROI_INPUTS);
    const confidence = assessmentConfidence(diag, context, answers, false);
    const roadmap = buildRoadmap(diag, approach, roi, "CAD", context, "fr");

    const buffer = await renderToBuffer(
      <ReportDocument
        processName=""
        currency="CAD"
        categoryLabel={null}
        generatedAt={new Date().toISOString()}
        context={context}
        answers={answers}
        weights={DEFAULT_WEIGHTS}
        diag={diag}
        approach={approach}
        roi={roi}
        roiInputs={DEFAULT_ROI_INPUTS}
        scenarios={roiScenarios(DEFAULT_ROI_INPUTS)}
        sensitivity={roiSensitivity(DEFAULT_ROI_INPUTS)}
        confidence={confidence}
        verdict={null}
        aptitudeScore={diag.overall}
        valueScore={roi.valueScore}
        roadmap={roadmap}
        riskRegister={[]}
        raci={buildRaci(context, approach)}
        compliance={buildComplianceChecklist(context, approach)}
      />
    );
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });
});
