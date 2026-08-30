import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { SummaryDocument } from "@/lib/pdf/SummaryDocument";
import { computeReportData, parseReportRequest, type ReportRequestBody } from "@/lib/pdf/reportData";
import { createClient, getUserOrg } from "@/lib/supabase/server";
import { getServerLocale } from "@/i18n/serverLocale";
import { getDictionary } from "@/i18n/getDictionary";

export async function POST(request: NextRequest) {
  const t = getDictionary(await getServerLocale()).errors.api.reportSummary;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const org = await getUserOrg(supabase, user?.id);
  if (!org || org.plan === "free") {
    return NextResponse.json({ error: t.paidTierRequired }, { status: 403 });
  }

  let body: ReportRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: t.invalidRequest }, { status: 400 });
  }

  const parsed = parseReportRequest(body);
  const data = await computeReportData(supabase, org.organizationId, parsed, {
    hoursPerFte: org.hoursPerFte,
    magnitudeRef: org.magnitudeRef,
    priorityThreshold: org.priorityThreshold,
  });

  try {
    const buffer = await renderToBuffer(
      SummaryDocument({
        processName: parsed.processName,
        currency: parsed.currency,
        generatedAt: data.generatedAt,
        diag: data.diag,
        roi: data.roi,
        verdict: data.verdict,
        confidence: data.confidence,
        roadmap: data.roadmap,
        riskRegister: data.riskRegister,
        aptitudeScore: data.aptitudeScore,
        valueScore: data.valueScore,
        orgLogoUrl: org.logoUrl,
        locale: parsed.locale,
      })
    );

    const filename = `verdiktnow-resume-${parsed.processName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "rapport"}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("report summary route error", err);
    return NextResponse.json({ error: t.generationFailed }, { status: 500 });
  }
}
