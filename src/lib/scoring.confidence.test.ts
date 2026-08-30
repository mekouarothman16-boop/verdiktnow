import { describe, it, expect } from "vitest";
import {
  diagnosticResult,
  assessmentConfidence,
  adoptionEase,
  serializeActivities,
  serializeAiSeededAnswers,
  DEFAULT_WEIGHTS,
  DIMENSIONS,
  type Answers,
  type Context,
  type ProcessActivity,
} from "@/lib/scoring";

function maxAnswersFor(dimIds: string[]): Answers {
  const answers: Answers = {};
  DIMENSIONS.filter((d) => dimIds.includes(d.id)).forEach((d) => {
    d.questions.forEach((_, i) => {
      answers[`${d.id}-${i}`] = 4;
    });
  });
  return answers;
}

const fullAnswers = maxAnswersFor(DIMENSIONS.map((d) => d.id));

const filledContext: Context = {
  sponsorName: "Marie Tremblay",
  sponsorRole: "Directrice des opérations",
  timeline: "Pilote d'ici 3 mois",
  objective: "Rembourser les frais de déplacement",
  expectedOutcome: "Remboursement déposé",
  mainSteps: "Réception, validation, paiement",
  activities: serializeActivities([{ id: "a1", label: "Étape 1", actor: "", system: "", minutes: 5, friction: "", rulesBased: true, digitalData: true, frequentExceptions: false } as ProcessActivity]),
};

describe("assessmentConfidence", () => {
  it("is Faible across the board with nothing filled in", () => {
    const diag = diagnosticResult({}, DEFAULT_WEIGHTS, {});
    const confidence = assessmentConfidence(diag, {}, {}, false);
    expect(confidence.label).toBe("Faible");
  });

  it("reaches Moyenne once the diagnostic and context are both substantially complete, with no independent second opinion", () => {
    const diag = diagnosticResult(fullAnswers, DEFAULT_WEIGHTS, filledContext);
    const confidence = assessmentConfidence(diag, filledContext, fullAnswers, false);
    expect(confidence.label).toBe("Moyenne");
  });

  it("only reaches Élevée with a converging second opinion on top of an otherwise complete assessment", () => {
    const diag = diagnosticResult(fullAnswers, DEFAULT_WEIGHTS, filledContext);
    const converging = [{ answeredCount: 30, overall: diag.overall }];
    const confidence = assessmentConfidence(diag, filledContext, fullAnswers, false, converging);
    expect(confidence.label).toBe("Élevée");
  });

  it("does not grant Élevée for a second opinion that diverges by more than 15 points", () => {
    const diag = diagnosticResult(fullAnswers, DEFAULT_WEIGHTS, filledContext);
    const divergent = [{ answeredCount: 30, overall: Math.max(0, diag.overall - 16) }];
    const confidence = assessmentConfidence(diag, filledContext, fullAnswers, false, divergent);
    expect(confidence.label).toBe("Moyenne");
  });

  it("drops to Faible when an AI-suggested answer is still unrevised by a human", () => {
    const context: Context = { ...filledContext, aiSeededAnswers: serializeAiSeededAnswers({ "std-0": 4 }) };
    const diag = diagnosticResult(fullAnswers, DEFAULT_WEIGHTS, context);
    const confidence = assessmentConfidence(diag, context, fullAnswers, true);
    expect(confidence.label).toBe("Faible");
  });

  it("drops to Faible when the process steps are never documented", () => {
    const { activities: _activities, ...context } = filledContext;
    const diag = diagnosticResult(fullAnswers, DEFAULT_WEIGHTS, context);
    const confidence = assessmentConfidence(diag, context, fullAnswers, false);
    expect(confidence.label).toBe("Faible");
  });
});

describe("adoptionEase", () => {
  it("is Faible when the diagnostic has no answers yet", () => {
    const diag = diagnosticResult({}, DEFAULT_WEIGHTS, {});
    expect(adoptionEase(diag, {}, null).label).toBe("Faible");
  });

  it("is Élevée for a standardized, low-risk process with few actors and no exceptions", () => {
    const answers = maxAnswersFor(["std", "risk"]);
    const context: Context = { actors: "Agent, Superviseur" };
    const diag = diagnosticResult(answers, DEFAULT_WEIGHTS, context);
    expect(adoptionEase(diag, context, null).label).toBe("Élevée");
  });

  it("is Faible for an unstandardized, high-risk process with many actors and frequent exceptions", () => {
    const diag = diagnosticResult({}, DEFAULT_WEIGHTS, {});
    const context: Context = { actors: "A, B, C, D, E", exceptions: "Beaucoup de cas particuliers" };
    expect(adoptionEase(diag, context, null).label).toBe("Faible");
  });
});
