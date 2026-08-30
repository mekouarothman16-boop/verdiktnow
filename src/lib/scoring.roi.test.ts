import { describe, it, expect } from "vitest";
import { roiResult, roiScenarios, roiSensitivity, SAVINGS_REALIZATION_FACTORS, type RoiInputs } from "@/lib/scoring";

const baseInputs: RoiInputs = {
  volume: 400,
  minutes: 25,
  hourlyCost: 55,
  errorRate: 8,
  reworkMin: 20,
  autoRate: 70,
  implCost: 25000,
  licenseCost: 3000,
  maintenancePct: 15,
  changeMgmtCost: 5000,
  discount: 8,
  savingsRealization: "reallocation",
};

describe("roiResult", () => {
  it("matches a hand-calculated baseline", () => {
    const r = roiResult(baseInputs);
    // occYr = 4800; normalH = 4800*25/60 = 2000; reworkH = 4800*0.08*20/60 = 128
    expect(r.currentH).toBeCloseTo(2128, 5);
    expect(r.normalCost).toBeCloseTo(2000 * 55, 5);
    expect(r.reworkCost).toBeCloseTo(128 * 55, 5);
    // savedH = currentH * 0.7
    expect(r.savedH).toBeCloseTo(2128 * 0.7, 5);
    const laborSavings = 2128 * 0.7 * 55;
    expect(r.laborSavings).toBeCloseTo(laborSavings, 5);
    const realizedSavings = laborSavings * SAVINGS_REALIZATION_FACTORS.reallocation;
    expect(r.realizedSavings).toBeCloseTo(realizedSavings, 5);
    expect(r.maintenanceCost).toBeCloseTo(25000 * 0.15, 5);
    expect(r.netRecurring).toBeCloseTo(realizedSavings - 3000 - 25000 * 0.15, 5);
    expect(r.totalUpfrontCost).toBe(25000 + 5000);
  });

  it("returns no payback and a floor value score when net recurring is not positive", () => {
    const r = roiResult({ ...baseInputs, autoRate: 0 });
    // savedH = 0 -> laborSavings = 0 -> netRecurring = -licenseCost - maintenanceCost < 0
    expect(r.netRecurring).toBeLessThan(0);
    expect(r.payback).toBeNull();
    expect(r.valueScore).toBe(5);
  });

  it("produces zero hours and zero savings at zero volume without dividing by zero", () => {
    const r = roiResult({ ...baseInputs, volume: 0 });
    expect(r.currentH).toBe(0);
    expect(r.laborSavings).toBe(0);
    expect(Number.isFinite(r.npv)).toBe(true);
    expect(Number.isFinite(r.netRecurring)).toBe(true);
  });

  it("gives zero labor savings at zero hourly cost", () => {
    const r = roiResult({ ...baseInputs, hourlyCost: 0 });
    expect(r.laborSavings).toBe(0);
    expect(r.currentCost).toBe(0);
  });

  it("saves the full workload at 100% automation rate", () => {
    const r = roiResult({ ...baseInputs, autoRate: 100 });
    expect(r.savedH).toBeCloseTo(r.currentH, 8);
  });

  it("applies each savings-realization factor as documented", () => {
    (Object.keys(SAVINGS_REALIZATION_FACTORS) as (keyof typeof SAVINGS_REALIZATION_FACTORS)[]).forEach((mode) => {
      const r = roiResult({ ...baseInputs, savingsRealization: mode });
      expect(r.realizedSavings).toBeCloseTo(r.laborSavings * SAVINGS_REALIZATION_FACTORS[mode], 5);
    });
  });

  it("computes NPV as a plain sum of undiscounted cash flows when discount is zero", () => {
    const r = roiResult({ ...baseInputs, discount: 0 });
    const expectedNpv = -r.totalUpfrontCost + r.netRecurring * 5;
    expect(r.npv).toBeCloseTo(expectedNpv, 5);
  });

  it("builds a quarterly cash flow series spanning the full 5-year horizon", () => {
    const r = roiResult(baseInputs);
    expect(r.cash[0]).toEqual({ m: 0, cum: -r.totalUpfrontCost });
    expect(r.cash[r.cash.length - 1].m).toBe(60);
    expect(r.cash.length).toBe(21); // m = 0,3,...,60
  });

  it("never produces a negative payback period", () => {
    const r = roiResult({ ...baseInputs, autoRate: 95, hourlyCost: 200 });
    expect(r.payback).not.toBeNull();
    expect(r.payback as number).toBeGreaterThan(0);
  });
});

describe("roiScenarios", () => {
  it("scales the automation rate by each scenario factor, clamped to [0, 100]", () => {
    const scenarios = roiScenarios({ ...baseInputs, autoRate: 90 });
    // conservative: 90*0.7=63, likely: 90*1=90, optimistic: 90*1.2=108 -> clamped to 100
    expect(scenarios.conservative.savedH).toBeLessThan(scenarios.likely.savedH);
    expect(scenarios.likely.savedH).toBeLessThan(scenarios.optimistic.savedH);
    const full = roiResult({ ...baseInputs, autoRate: 100 });
    expect(scenarios.optimistic.savedH).toBeCloseTo(full.savedH, 5);
  });
});

describe("roiSensitivity", () => {
  it("returns one row per varied input, sorted by descending impact range", () => {
    const rows = roiSensitivity(baseInputs);
    expect(rows).toHaveLength(6);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].range).toBeGreaterThanOrEqual(rows[i].range);
    }
  });

  it("increasing volume increases net recurring savings when automation is active", () => {
    const rows = roiSensitivity(baseInputs);
    const volumeRow = rows.find((r) => r.key === "volume")!;
    expect(volumeRow.high).toBeGreaterThan(volumeRow.low);
  });
});
