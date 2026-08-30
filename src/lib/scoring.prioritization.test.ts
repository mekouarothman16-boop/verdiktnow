import { describe, it, expect } from "vitest";
import { prioritizationQuadrant } from "@/lib/scoring";

describe("prioritizationQuadrant", () => {
  it("classifies each corner of the matrix relative to a 50 threshold", () => {
    expect(prioritizationQuadrant(80, 80)).toBe("automate");
    expect(prioritizationQuadrant(80, 20)).toBe("plan");
    expect(prioritizationQuadrant(20, 80)).toBe("prepare");
    expect(prioritizationQuadrant(20, 20)).toBe("setAside");
  });

  it("treats a score exactly at the threshold as meeting it, on both axes", () => {
    expect(prioritizationQuadrant(50, 50)).toBe("automate");
    expect(prioritizationQuadrant(50, 49)).toBe("plan");
    expect(prioritizationQuadrant(49, 50)).toBe("prepare");
  });

  it("respects a custom organization threshold instead of the default 50", () => {
    // Aptitude 75 clears a stricter 70 threshold on its own, but value 65 does not.
    expect(prioritizationQuadrant(75, 65, 50)).toBe("automate");
    expect(prioritizationQuadrant(75, 65, 70)).toBe("plan");
  });
});
