import { describe, it, expect } from "vitest";
import { buildVendorQuestions, buildSecurityChecklist } from "@/lib/pdf/roadmap";
import type { ApproachRecommendation } from "@/lib/scoring";
import { pdf as pdfFr } from "@/i18n/dictionaries/fr/pdf";
import { pdf as pdfEn } from "@/i18n/dictionaries/en/pdf";

function approach(id: ApproachRecommendation["id"]): ApproachRecommendation {
  return { id, label: id, description: "", rationale: [], criteria: "", caution: null };
}

describe("buildVendorQuestions", () => {
  it("returns only the generic questions without a recommended approach", () => {
    expect(buildVendorQuestions(null)).toEqual(pdfFr.vendorQuestions.generic);
  });

  it("returns only the generic questions for the process-first approach, which has none of its own", () => {
    expect(buildVendorQuestions(approach("process_first"))).toEqual(pdfFr.vendorQuestions.generic);
  });

  it("appends the approach-specific questions after the generic ones, for every other approach", () => {
    (["rpa", "idp", "agentic", "hybrid"] as const).forEach((id) => {
      const result = buildVendorQuestions(approach(id));
      expect(result).toEqual([...pdfFr.vendorQuestions.generic, ...pdfFr.vendorQuestions[id]]);
    });
  });

  it("uses the requested locale's dictionary", () => {
    expect(buildVendorQuestions(approach("rpa"), "en")).toEqual([...pdfEn.vendorQuestions.generic, ...pdfEn.vendorQuestions.rpa]);
  });
});

describe("buildSecurityChecklist", () => {
  it("returns only the base checklist without a recommended approach", () => {
    expect(buildSecurityChecklist(null)).toEqual(pdfFr.security.base);
  });

  it("returns only the base checklist for the process-first approach, which has none of its own", () => {
    expect(buildSecurityChecklist(approach("process_first"))).toEqual(pdfFr.security.base);
  });

  it("appends the approach-specific items after the base checklist, for every other approach", () => {
    (["rpa", "idp", "agentic", "hybrid"] as const).forEach((id) => {
      const result = buildSecurityChecklist(approach(id));
      expect(result).toEqual([...pdfFr.security.base, ...pdfFr.security[id]]);
    });
  });

  it("uses the requested locale's dictionary", () => {
    expect(buildSecurityChecklist(approach("agentic"), "en")).toEqual([...pdfEn.security.base, ...pdfEn.security.agentic]);
  });
});
