import { describe, it, expect } from "vitest";
import { diagnosticResult, suggestedAutoRate, DIMENSIONS, DEFAULT_WEIGHTS, type Answers, type Context } from "@/lib/scoring";

/** Répond au maximum (4/4) à toutes les questions d'un ou plusieurs leviers — pratique pour
 * forcer un rawScore de 100 et isoler l'effet d'un plafond contextuel. */
function maxAnswersFor(dimIds: string[]): Answers {
  const answers: Answers = {};
  DIMENSIONS.filter((d) => dimIds.includes(d.id)).forEach((d) => {
    d.questions.forEach((_, i) => {
      answers[`${d.id}-${i}`] = 4;
    });
  });
  return answers;
}

describe("diagnosticResult", () => {
  it("scores everything at zero with no answers at all", () => {
    const result = diagnosticResult({}, DEFAULT_WEIGHTS);
    expect(result.overall).toBe(0);
    expect(result.answeredCount).toBe(0);
    result.dimScores.forEach((d) => {
      expect(d.score).toBe(0);
      expect(d.answered).toBe(0);
      expect(d.adjustment).toBeNull();
    });
  });

  it("reaches a perfect 100 across the board when every question is answered at maximum, with no context caps triggered", () => {
    const answers = maxAnswersFor(DIMENSIONS.map((d) => d.id));
    const result = diagnosticResult(answers, DEFAULT_WEIGHTS, {});
    result.dimScores.forEach((d) => {
      expect(d.rawScore).toBe(100);
      expect(d.score).toBe(100);
      expect(d.adjustment).toBeNull();
    });
    expect(result.overall).toBe(100);
  });

  it("never lets a context cap raise a score — it only ever lowers it", () => {
    const answers = maxAnswersFor(["vol"]);
    // "imprevisible" caps the volume lever at 60, well below its raw 100.
    const context: Context = { volumeVariability: "imprevisible" };
    const result = diagnosticResult(answers, DEFAULT_WEIGHTS, context);
    const vol = result.dimScores.find((d) => d.id === "vol")!;
    expect(vol.rawScore).toBe(100);
    expect(vol.score).toBe(60);
    expect(vol.adjustment).not.toBeNull();
    expect(vol.adjustment!.delta).toBeLessThan(0);
    expect(vol.adjustment!.delta).toBe(vol.score - vol.rawScore);
  });

  it("does not apply a cap that wouldn't actually lower the raw score", () => {
    // Two of five "vol" questions answered at 1/4 keeps the raw score well under the 60 cap.
    const answers: Answers = { "vol-0": 1, "vol-1": 1 };
    const context: Context = { volumeVariability: "imprevisible" };
    const result = diagnosticResult(answers, DEFAULT_WEIGHTS, context);
    const vol = result.dimScores.find((d) => d.id === "vol")!;
    expect(vol.rawScore).toBeLessThan(60);
    expect(vol.score).toBe(vol.rawScore);
    expect(vol.adjustment).toBeNull();
  });

  it("never applies a cap to a dimension that has no answers yet", () => {
    // No "vol" answers at all, but the unpredictable-volume signal is present.
    const answers = maxAnswersFor(["std"]);
    const context: Context = { volumeVariability: "imprevisible" };
    const result = diagnosticResult(answers, DEFAULT_WEIGHTS, context);
    const vol = result.dimScores.find((d) => d.id === "vol")!;
    expect(vol.answered).toBe(0);
    expect(vol.score).toBe(0);
    expect(vol.adjustment).toBeNull();
  });

  it("caps the risk lever when regulations are declared", () => {
    const answers = maxAnswersFor(["risk"]);
    const context: Context = { regulations: "rgpd_loi25" };
    const result = diagnosticResult(answers, DEFAULT_WEIGHTS, context);
    const risk = result.dimScores.find((d) => d.id === "risk")!;
    expect(risk.rawScore).toBe(100);
    expect(risk.score).toBe(70);
  });

  it("caps the risk lever when a sensitive term appears in free text, case-insensitively", () => {
    const answers = maxAnswersFor(["risk"]);
    const context: Context = { pain: "Ce processus touche un DOSSIER PATIENT sensible" };
    const result = diagnosticResult(answers, DEFAULT_WEIGHTS, context);
    const risk = result.dimScores.find((d) => d.id === "risk")!;
    expect(risk.score).toBe(70);
  });

  it("caps the rules lever when most documented steps aren't rule-based", () => {
    const answers = maxAnswersFor(["rules"]);
    const activities = JSON.stringify([
      { id: "a1", label: "Étape 1", rulesBased: false, digitalData: true, frequentExceptions: false, minutes: 5, actor: "", system: "", friction: "" },
      { id: "a2", label: "Étape 2", rulesBased: false, digitalData: true, frequentExceptions: false, minutes: 5, actor: "", system: "", friction: "" },
    ]);
    const result = diagnosticResult(answers, DEFAULT_WEIGHTS, { activities });
    const rules = result.dimScores.find((d) => d.id === "rules")!;
    expect(rules.score).toBe(60);
  });

  it("excludes unanswered dimensions from the weighted overall rather than treating them as zero", () => {
    // Only "std" (weight 22) answered at max; every other lever untouched.
    const answers = maxAnswersFor(["std"]);
    const result = diagnosticResult(answers, DEFAULT_WEIGHTS, {});
    expect(result.overall).toBe(100);
  });

  it("assigns the corresponding readiness level for a given overall score", () => {
    const perfect = diagnosticResult(maxAnswersFor(DIMENSIONS.map((d) => d.id)), DEFAULT_WEIGHTS, {});
    expect(perfect.level.n).toBe(5);
    const empty = diagnosticResult({}, DEFAULT_WEIGHTS, {});
    expect(empty.level.n).toBe(1);
  });
});

describe("suggestedAutoRate", () => {
  it("clamps to a 5-95 range and rounds to the nearest integer", () => {
    expect(suggestedAutoRate(0)).toBe(5);
    expect(suggestedAutoRate(1)).toBe(5);
    expect(suggestedAutoRate(50)).toBe(45);
    expect(suggestedAutoRate(100)).toBe(90);
  });
});
