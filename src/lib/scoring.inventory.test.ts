import { describe, it, expect } from "vitest";
import { buildToolInventory, getQuickWins, serializeSelectedTools, serializeCustomTools, type Context, type ProcessActivity, type CustomTool } from "@/lib/scoring";

describe("buildToolInventory", () => {
  it("returns an empty inventory with no verdict when nothing is declared", () => {
    const inventory = buildToolInventory({});
    expect(inventory.entries).toEqual([]);
    expect(inventory.verdict).toBeNull();
  });

  it("sorts entries platform-first, then connected, then data, then manual", () => {
    const context: Context = { toolsSelected: serializeSelectedTools(["fax", "power_automate", "sap", "excel"]) };
    const inventory = buildToolInventory(context);
    expect(inventory.entries.map((e) => e.role)).toEqual(["platform", "connected", "data", "manual"]);
  });

  it("declares a platform verdict as soon as one automation platform is checked, regardless of other tools", () => {
    const context: Context = { toolsSelected: serializeSelectedTools(["power_automate", "fax"]) };
    const inventory = buildToolInventory(context);
    expect(inventory.counts.platform).toBe(1);
    expect(inventory.verdict).not.toBeNull();
  });

  it("falls back to a 'connected but no platform' verdict when only connected tools are present", () => {
    const context: Context = { toolsSelected: serializeSelectedTools(["sap"]) };
    const inventory = buildToolInventory(context);
    expect(inventory.counts.platform).toBe(0);
    expect(inventory.counts.connected).toBe(1);
    expect(inventory.verdict).not.toBeNull();
  });

  it("falls back to a 'no platform, no API' verdict when only manual tools are present", () => {
    const context: Context = { toolsSelected: serializeSelectedTools(["fax", "paper"]) };
    const inventory = buildToolInventory(context);
    expect(inventory.counts.platform).toBe(0);
    expect(inventory.counts.connected).toBe(0);
    expect(inventory.verdict).not.toBeNull();
  });

  it("drops unknown tool ids from the selection rather than crashing", () => {
    const context: Context = { toolsSelected: "sap;not_a_real_tool;excel" };
    const inventory = buildToolInventory(context);
    expect(inventory.entries.map((e) => e.id).sort()).toEqual(["excel", "sap"]);
  });

  it("includes custom tools declared by hand, with their own role", () => {
    const customTool: CustomTool = { id: "t1", name: "Système maison", usage: "Suivi interne", role: "connected" };
    const context: Context = { toolsCustom: serializeCustomTools([customTool]) };
    const inventory = buildToolInventory(context);
    expect(inventory.entries).toEqual([{ id: "t1", label: "Système maison", role: "connected", usage: "Suivi interne", custom: true }]);
  });
});

describe("getQuickWins", () => {
  const readyActivity: ProcessActivity = {
    id: "a1", label: "Rapprochement", actor: "", system: "", minutes: 10, friction: "",
    rulesBased: true, digitalData: true, frequentExceptions: false,
  };
  const notReadyActivity: ProcessActivity = {
    id: "a2", label: "Revue manuelle", actor: "", system: "", minutes: 20, friction: "",
    rulesBased: false, digitalData: true, frequentExceptions: false,
  };

  it("only surfaces steps that are both rule-based and digital", () => {
    const summary = getQuickWins([readyActivity, notReadyActivity], {});
    expect(summary.items).toHaveLength(1);
    expect(summary.items[0].activityId).toBe("a1");
  });

  it("still surfaces a quick win flagged with frequent exceptions, as a caveat rather than a disqualifier", () => {
    const flagged: ProcessActivity = { ...readyActivity, id: "a3", frequentExceptions: true };
    const summary = getQuickWins([flagged], {});
    expect(summary.items).toHaveLength(1);
    expect(summary.items[0].hasFrequentExceptions).toBe(true);
  });

  it("ignores a step left without a label", () => {
    const blank: ProcessActivity = { ...readyActivity, id: "a4", label: "   " };
    expect(getQuickWins([blank], {}).items).toEqual([]);
  });

  it("lists only the platform tools already available from the inventory", () => {
    const context: Context = { toolsSelected: serializeSelectedTools(["power_automate", "sap"]) };
    const summary = getQuickWins([readyActivity], context);
    expect(summary.platformTools).toEqual(["Microsoft Power Automate"]);
  });

  it("returns no platform tools when none are checked", () => {
    const summary = getQuickWins([readyActivity], { toolsSelected: serializeSelectedTools(["sap"]) });
    expect(summary.platformTools).toEqual([]);
  });
});
