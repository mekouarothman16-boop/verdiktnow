import { describe, it, expect } from "vitest";
import { diagnosticResult, DEFAULT_WEIGHTS, DIMENSIONS, type Answers, type Context } from "@/lib/scoring";
import { buildRiskRegister, buildRaci, buildComplianceChecklist, buildVendorShortlist, type RiskRegisterEntry } from "@/lib/pdf/roadmap";
import type { ApproachRecommendation } from "@/lib/scoring";
import { pdf as pdfFr } from "@/i18n/dictionaries/fr/pdf";

function approach(id: ApproachRecommendation["id"], caution: string | null = null): ApproachRecommendation {
  return { id, label: id, description: "", rationale: [], criteria: "", caution };
}

/** Répond une seule question d'un levier de façon à obtenir approximativement le score visé
 * (arrondi au multiple de 5 le plus proche selon la pondération de la question) — suffisant pour
 * placer un levier sous ou au-dessus des seuils de buildRiskRegister sans viser l'exactitude. */
function answerDim(dimId: string, likertValue: number): Answers {
  return { [`${dimId}-0`]: likertValue };
}

describe("buildRiskRegister", () => {
  it("is empty when nothing is weak, no caution, and no AI risks", () => {
    const diag = diagnosticResult(answerDim("std", 4), DEFAULT_WEIGHTS, {});
    expect(buildRiskRegister(diag, {}, null)).toEqual([]);
  });

  it("flags a weak lever answered near zero as Élevée probability, with impact keyed to the lever's weight", () => {
    // "data" (weight 18) answered at 0 -> rawScore 0, well under 50 and under 30 -> Élevée probability.
    const diag = diagnosticResult(answerDim("data", 0), DEFAULT_WEIGHTS, {});
    const entries = buildRiskRegister(diag, {}, null);
    expect(entries).toHaveLength(1);
    expect(entries[0].probability).toBe("Élevée");
    expect(entries[0].impact).toBe("Élevée"); // weight 18 >= 18
  });

  it("uses Moyenne probability for a weak-but-not-critical lever (score between 30 and 50)", () => {
    // "risk" questions weigh [2, 1.5, 2, 1.5, 1]; answering only the first (2/4) and last (0/4)
    // gives round(4 / (4*3) * 100) = 33 — weak enough to qualify, but not under the 30 cutoff.
    const diag = diagnosticResult({ "risk-0": 2, "risk-4": 0 }, DEFAULT_WEIGHTS, {});
    const entries = buildRiskRegister(diag, {}, null);
    expect(entries[0].probability).toBe("Moyenne");
  });

  it("assigns Faible impact to a weak lever whose weight is under 13 (risk, weight 12)", () => {
    const diag = diagnosticResult(answerDim("risk", 0), DEFAULT_WEIGHTS, {});
    const entries = buildRiskRegister(diag, {}, null);
    expect(entries[0].impact).toBe("Faible");
  });

  it("keeps only the 3 weakest levers even when more than 3 qualify", () => {
    const answers: Answers = {
      ...answerDim("std", 0),
      ...answerDim("rules", 0),
      ...answerDim("data", 0),
      ...answerDim("vol", 0),
    };
    const diag = diagnosticResult(answers, DEFAULT_WEIGHTS, {});
    const entries = buildRiskRegister(diag, {}, null);
    expect(entries).toHaveLength(3);
  });

  it("adds the approach's caution as an Élevée/Élevée entry when present", () => {
    const diag = diagnosticResult(answerDim("std", 4), DEFAULT_WEIGHTS, {});
    const entries = buildRiskRegister(diag, {}, approach("process_first", "Attention particulière requise"));
    expect(entries).toContainEqual(
      expect.objectContaining({ risk: "Attention particulière requise", probability: "Élevée", impact: "Élevée" })
    );
  });

  it("adds up to 3 AI-flagged risks as Moyenne/Moyenne entries, dropping the rest", () => {
    const diag = diagnosticResult(answerDim("std", 4), DEFAULT_WEIGHTS, {});
    const aiAnalysis = { synthese: "", risques: ["R1", "R2", "R3", "R4"], scores: {}, leviers: {}, roiSuggestion: null };
    const entries = buildRiskRegister(diag, {}, null, aiAnalysis);
    expect(entries).toHaveLength(3);
    expect(entries.every((e: RiskRegisterEntry) => e.probability === "Moyenne" && e.impact === "Moyenne")).toBe(true);
  });

  it("never returns more than 6 entries, ranked with the most severe first", () => {
    const answers: Answers = {
      ...answerDim("std", 0),
      ...answerDim("rules", 0),
      ...answerDim("data", 0),
    };
    const diag = diagnosticResult(answers, DEFAULT_WEIGHTS, {});
    const aiAnalysis = { synthese: "", risques: ["R1", "R2", "R3"], scores: {}, leviers: {}, roiSuggestion: null };
    const entries = buildRiskRegister(diag, {}, approach("rpa", "Mise en garde"), aiAnalysis);
    expect(entries).toHaveLength(6); // 3 weak levers + 1 caution + 3 AI risks = 7 candidates, capped at 6
    for (let i = 1; i < entries.length; i++) {
      const rank = (e: RiskRegisterEntry) => ({ Faible: 1, Moyenne: 2, Élevée: 3 }[e.probability] * { Faible: 1, Moyenne: 2, Élevée: 3 }[e.impact]);
      expect(rank(entries[i - 1])).toBeGreaterThanOrEqual(rank(entries[i]));
    }
  });
});

describe("buildRaci", () => {
  it("swaps responsible/consulted for the scoping row relative to the standard rows", () => {
    const context: Context = { actors: "Agent AP, Superviseur" };
    const rows = buildRaci(context, approach("rpa"));
    expect(rows).toHaveLength(5);
    const [scoping, dev] = rows;
    expect(scoping.responsible).toBe(dev.consulted);
    expect(scoping.consulted).toBe(dev.responsible);
  });

  it("swaps accountable/consulted for the deployment row relative to the standard rows", () => {
    const context: Context = { actors: "Agent AP" };
    const rows = buildRaci(context, approach("rpa"));
    const [, dev, , deploy] = rows;
    expect(deploy.accountable).toBe(dev.consulted);
    expect(deploy.consulted).toBe(dev.responsible);
  });

  it("falls back to a generic accountable/consulted when no sponsor or actors are declared", () => {
    const withContext = buildRaci({ sponsorName: "Marie", actors: "Agent" }, approach("rpa"));
    const withoutContext = buildRaci({}, approach("rpa"));
    expect(withoutContext[1].accountable).not.toBe(withContext[1].accountable);
    expect(withoutContext[1].consulted).not.toBe(withContext[1].consulted);
  });

  it("picks a different default responsible party depending on the recommended approach", () => {
    const rpaRows = buildRaci({}, approach("rpa"));
    const agenticRows = buildRaci({}, approach("agentic"));
    expect(rpaRows[1].responsible).not.toBe(agenticRows[1].responsible);
  });
});

describe("buildComplianceChecklist", () => {
  const base = pdfFr.compliance;

  it("returns only the 3 base items with no category, regulation, or agentic approach", () => {
    expect(buildComplianceChecklist({}, null)).toEqual([base.baseSensitivity, base.baseRetention, base.baseDpia]);
  });

  it("appends category-specific items for a known category", () => {
    const items = buildComplianceChecklist({ category: "finance" }, null);
    expect(items).toEqual([base.baseSensitivity, base.baseRetention, base.baseDpia, ...base.categoryFinance]);
  });

  it("appends one item per declared regulation, in order", () => {
    const items = buildComplianceChecklist({ regulations: "rgpd_loi25;pci_dss" }, null);
    expect(items.slice(3)).toEqual([base.regGdprLoi25, base.regPciDss]);
  });

  it("only adds the custom 'other' regulation text when it's actually filled in", () => {
    const withText = buildComplianceChecklist({ regulations: "other", regulationsOther: "Norme interne X" }, null);
    expect(withText.slice(3)).toEqual([base.otherRegulation.replace("{other}", "Norme interne X")]);

    const withoutText = buildComplianceChecklist({ regulations: "other", regulationsOther: "" }, null);
    expect(withoutText.slice(3)).toEqual([]);
  });

  it("silently ignores an unrecognized regulation id", () => {
    expect(buildComplianceChecklist({ regulations: "not_a_real_regulation" }, null).length).toBe(3);
  });

  it("appends the agentic governance items only for the agentic approach", () => {
    const items = buildComplianceChecklist({}, approach("agentic"));
    expect(items.slice(3)).toEqual([base.agenticGovernance, base.agenticErrorControl]);
    expect(buildComplianceChecklist({}, approach("rpa")).length).toBe(3);
  });
});

describe("buildVendorShortlist", () => {
  it("returns an empty list without a recommended approach", () => {
    expect(buildVendorShortlist(null, {})).toEqual([]);
  });

  it("returns an empty list for the process-first approach, which has no tooling to suggest yet", () => {
    expect(buildVendorShortlist(approach("process_first"), { systems: "SAP" })).toEqual([]);
  });

  it("returns the raw vendor list untouched when no system or tool evidence is declared", () => {
    expect(buildVendorShortlist(approach("rpa"), {})).toEqual(pdfFr.vendorShortlist.rpa);
  });

  it("attaches a Microsoft match note only to the vendor recognized as part of that ecosystem", () => {
    const list = buildVendorShortlist(approach("rpa"), { systems: "On carbure à Microsoft 365 et Teams" });
    const msVendor = list.find((v) => v.name === "Microsoft Power Automate")!;
    const otherVendor = list.find((v) => v.name === "UiPath")!;
    expect(msVendor.matchNote).toContain("Microsoft 365 et Teams");
    expect(otherVendor.matchNote).toBeUndefined();
  });

  it("attaches an enterprise match note to every enterprise-recognized vendor when an ERP is mentioned", () => {
    const list = buildVendorShortlist(approach("rpa"), { systems: "Nous utilisons SAP au quotidien" });
    expect(list.find((v) => v.name === "UiPath")!.matchNote).toContain("SAP");
    expect(list.find((v) => v.name === "Automation Anywhere")!.matchNote).toContain("SAP");
    expect(list.find((v) => v.name === "Microsoft Power Automate")!.matchNote).toBeUndefined();
  });

  it("prefers a checked tool from the inventory over free-text system names as evidence", () => {
    const list = buildVendorShortlist(approach("rpa"), { toolsSelected: "sap" });
    expect(list.find((v) => v.name === "UiPath")!.matchNote).toContain("SAP");
  });

  it("leaves the list untouched when none of its vendor names match the detected ecosystem", () => {
    // The agentic vendor list contains no name recognized by either ecosystem check.
    const list = buildVendorShortlist(approach("agentic"), { systems: "SAP, Microsoft 365" });
    expect(list).toEqual(pdfFr.vendorShortlist.agentic);
  });
});
