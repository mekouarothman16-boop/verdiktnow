import { describe, it, expect } from "vitest";
import {
  parseActivities,
  serializeActivities,
  parseCustomTools,
  serializeCustomTools,
  parseAttachmentLinks,
  serializeAttachmentLinks,
  parseAiSeededAnswers,
  serializeAiSeededAnswers,
  parseSelectedTools,
  serializeSelectedTools,
  parseProcessDependencies,
  serializeProcessDependencies,
  totalActivityMinutes,
  type ProcessActivity,
  type CustomTool,
  type Context,
} from "@/lib/scoring";

describe("activities JSON round-trip", () => {
  const activity: ProcessActivity = {
    id: "a1",
    label: "Valider la facture",
    actor: "Agent AP",
    system: "SAP",
    minutes: 12,
    friction: "Ressaisie manuelle",
    rulesBased: true,
    digitalData: false,
    frequentExceptions: true,
  };

  it("survives a serialize/parse round-trip unchanged", () => {
    const context: Context = { activities: serializeActivities([activity]) };
    expect(parseActivities(context)).toEqual([activity]);
  });

  it("returns an empty array rather than throwing on corrupted JSON", () => {
    expect(parseActivities({ activities: "{not valid json" })).toEqual([]);
  });

  it("returns an empty array when the field is absent", () => {
    expect(parseActivities({})).toEqual([]);
  });

  it("returns an empty array when the JSON parses but isn't an array", () => {
    expect(parseActivities({ activities: JSON.stringify({ not: "an array" }) })).toEqual([]);
  });

  it("backfills missing boolean fields for rows saved before they existed", () => {
    const legacyContext: Context = { activities: JSON.stringify([{ id: "old", label: "Ancienne étape" }]) };
    const parsed = parseActivities(legacyContext);
    expect(parsed).toEqual([
      { id: "old", label: "Ancienne étape", actor: "", system: "", minutes: 0, friction: "", rulesBased: false, digitalData: false, frequentExceptions: false },
    ]);
  });

  it("sums minutes across activities, ignoring non-finite values", () => {
    const activities: ProcessActivity[] = [
      { ...activity, minutes: 10 },
      { ...activity, id: "a2", minutes: 5 },
      { ...activity, id: "a3", minutes: NaN },
    ];
    expect(totalActivityMinutes(activities)).toBe(15);
  });
});

describe("custom tools JSON round-trip", () => {
  const tool: CustomTool = { id: "t1", name: "Outil maison", usage: "Suivi des dossiers", role: "connected" };

  it("survives a serialize/parse round-trip unchanged", () => {
    const context: Context = { toolsCustom: serializeCustomTools([tool]) };
    expect(parseCustomTools(context)).toEqual([tool]);
  });

  it("falls back to role 'unknown' for an invalid or missing role", () => {
    const context: Context = { toolsCustom: JSON.stringify([{ id: "t2", name: "Sans rôle" }]) };
    expect(parseCustomTools(context)).toEqual([{ id: "t2", name: "Sans rôle", usage: "", role: "unknown" }]);
  });

  it("returns an empty array on corrupted JSON", () => {
    expect(parseCustomTools({ toolsCustom: "not json" })).toEqual([]);
  });

  it("drops entries without a name", () => {
    const context: Context = { toolsCustom: JSON.stringify([{ id: "t3" }, tool]) };
    expect(parseCustomTools(context)).toEqual([tool]);
  });
});

describe("attachment links JSON round-trip", () => {
  it("survives a serialize/parse round-trip unchanged", () => {
    const links = { "facture.pdf": "act-1", "bon-commande.pdf": "act-2" };
    const context: Context = { attachmentLinks: serializeAttachmentLinks(links) };
    expect(parseAttachmentLinks(context)).toEqual(links);
  });

  it("drops entries with an empty activity id on save", () => {
    const serialized = serializeAttachmentLinks({ "a.pdf": "act-1", "b.pdf": "" });
    expect(JSON.parse(serialized)).toEqual({ "a.pdf": "act-1" });
  });

  it("returns an empty object on corrupted JSON", () => {
    expect(parseAttachmentLinks({ attachmentLinks: "{broken" })).toEqual({});
  });
});

describe("AI-seeded answers JSON round-trip", () => {
  it("survives a serialize/parse round-trip unchanged", () => {
    const seeded = { "std-0": 3, "risk-2": 1 };
    const context: Context = { aiSeededAnswers: serializeAiSeededAnswers(seeded) };
    expect(parseAiSeededAnswers(context)).toEqual(seeded);
  });

  it("drops non-numeric values", () => {
    const context: Context = { aiSeededAnswers: JSON.stringify({ "std-0": 3, "std-1": "not a number" }) };
    expect(parseAiSeededAnswers(context)).toEqual({ "std-0": 3 });
  });
});

describe("selected tools and process dependencies", () => {
  it("round-trips known tool ids and drops unknown ones", () => {
    const context: Context = { toolsSelected: serializeSelectedTools(["sap", "not_a_real_tool", "excel"]) };
    expect(parseSelectedTools(context)).toEqual(["sap", "excel"]);
  });

  it("round-trips process dependency ids, de-duplicated", () => {
    const context: Context = { dependsOn: serializeProcessDependencies(["p1", "p2", "p1"]) };
    expect(parseProcessDependencies(context)).toEqual(["p1", "p2"]);
  });
});
