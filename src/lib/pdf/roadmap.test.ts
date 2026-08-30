import { describe, it, expect } from "vitest";
import { diagnosticResult, recommendApproach, roiResult, DEFAULT_WEIGHTS, DEFAULT_ROI_INPUTS, type Context } from "@/lib/scoring";
import { buildRoadmap } from "@/lib/pdf/roadmap";

const context: Context = { sponsorName: "Marie Tremblay", actors: "Agent AP, Superviseur" };
const diag = diagnosticResult({ "std-0": 1, "rules-0": 1 }, DEFAULT_WEIGHTS, context);
const approach = recommendApproach(diag, context);
const roi = roiResult(DEFAULT_ROI_INPUTS);

describe("buildRoadmap", () => {
  it("gives every generated item — immediate actions, phases, and milestones alike — a non-empty title", () => {
    for (const locale of ["fr", "en"] as const) {
      const roadmap = buildRoadmap(diag, approach, roi, "CAD", context, locale);
      const allItems = [...roadmap.immediate, ...roadmap.phases.flatMap((p) => p.items)];
      expect(allItems.length).toBeGreaterThan(0);
      allItems.forEach((item) => {
        expect(item.title.trim().length).toBeGreaterThan(0);
        expect(item.text.trim().length).toBeGreaterThan(0);
      });
    }
  });

  it("uses stable, unique keys across every section so progress persists correctly per step", () => {
    const roadmap = buildRoadmap(diag, approach, roi, "CAD", context, "fr");
    const allItems = [...roadmap.immediate, ...roadmap.phases.flatMap((p) => p.items)];
    const keys = allItems.map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("places the vendor-contact and production go-live milestones in the expected phases", () => {
    const roadmap = buildRoadmap(diag, approach, roi, "CAD", context, "fr");
    const phase1Keys = roadmap.phases[0].items.map((i) => i.key);
    const phase2Keys = roadmap.phases[1].items.map((i) => i.key);
    const phase3Keys = roadmap.phases[2].items.map((i) => i.key);
    expect(phase1Keys).toContain("contactVendor");
    expect(phase1Keys).toContain("selectVendorContract");
    expect(phase2Keys[0]).toBe("pilotKickoff");
    expect(phase2Keys).toContain("pilotReview");
    expect(phase3Keys[0]).toBe("productionGoLive");
  });
});
