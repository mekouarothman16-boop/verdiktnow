import { describe, it, expect } from "vitest";
import { diagnosticResult, recommendApproach, DEFAULT_WEIGHTS, DIMENSIONS, type Answers } from "@/lib/scoring";

function maxAnswersFor(dimIds: string[]): Answers {
  const answers: Answers = {};
  DIMENSIONS.filter((d) => dimIds.includes(d.id)).forEach((d) => {
    d.questions.forEach((_, i) => {
      answers[`${d.id}-${i}`] = 4;
    });
  });
  return answers;
}

function zeroAnswersFor(dimIds: string[]): Answers {
  const answers: Answers = {};
  DIMENSIONS.filter((d) => dimIds.includes(d.id)).forEach((d) => {
    d.questions.forEach((_, i) => {
      answers[`${d.id}-${i}`] = 0;
    });
  });
  return answers;
}

describe("recommendApproach", () => {
  it("returns null when the diagnostic has no answers at all", () => {
    const diag = diagnosticResult({}, DEFAULT_WEIGHTS, {});
    expect(recommendApproach(diag)).toBeNull();
  });

  it("recommends process-first work when the overall score is below 35", () => {
    const diag = diagnosticResult(zeroAnswersFor(["risk"]), DEFAULT_WEIGHTS, {});
    const rec = recommendApproach(diag);
    expect(rec?.id).toBe("process_first");
  });

  it("recommends RPA when rules, standardization, and data are all strong", () => {
    const diag = diagnosticResult(maxAnswersFor(["rules", "std", "data"]), DEFAULT_WEIGHTS, {});
    const rec = recommendApproach(diag);
    expect(rec?.id).toBe("rpa");
  });

  it("recommends IDP when data is weak but standardization and technical feasibility are solid", () => {
    const diag = diagnosticResult(maxAnswersFor(["std", "tech"]), DEFAULT_WEIGHTS, {});
    const rec = recommendApproach(diag);
    expect(rec?.id).toBe("idp");
  });

  it("recommends an agentic approach when rules are weak but data and technical feasibility are solid", () => {
    const diag = diagnosticResult(maxAnswersFor(["data", "tech"]), DEFAULT_WEIGHTS, {});
    const rec = recommendApproach(diag);
    expect(rec?.id).toBe("agentic");
  });

  it("falls back to a hybrid recommendation outside the other profiles", () => {
    const diag = diagnosticResult(maxAnswersFor(["rules", "tech"]), DEFAULT_WEIGHTS, {});
    const rec = recommendApproach(diag);
    expect(rec?.id).toBe("hybrid");
  });

  it("flags a low-risk caution when the risk lever itself scores under 40", () => {
    const diag = diagnosticResult(zeroAnswersFor(["risk"]), DEFAULT_WEIGHTS, {});
    const rec = recommendApproach(diag);
    expect(rec?.caution).not.toBeNull();
  });

  it("flags a capped-risk caution when the risk lever was corrected downward by context, even though it's no longer under 40", () => {
    const diag = diagnosticResult(maxAnswersFor(["risk"]), DEFAULT_WEIGHTS, { regulations: "rgpd_loi25" });
    const risk = diag.dimScores.find((d) => d.id === "risk")!;
    expect(risk.score).toBe(70); // capped, not < 40
    const rec = recommendApproach(diag);
    expect(rec?.caution).not.toBeNull();
  });

  it("gives no caution when risk is strong and uncapped", () => {
    const diag = diagnosticResult(maxAnswersFor(["risk"]), DEFAULT_WEIGHTS, {});
    const rec = recommendApproach(diag);
    expect(rec?.caution).toBeNull();
  });
});
