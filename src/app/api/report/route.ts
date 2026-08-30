import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportDocument } from "@/lib/pdf/ReportDocument";
import { computeReportData, parseReportRequest, type ReportRequestBody } from "@/lib/pdf/reportData";
import { createClient, getUserOrg } from "@/lib/supabase/server";
import { getServerLocale } from "@/i18n/serverLocale";
import { getDictionary } from "@/i18n/getDictionary";

export async function POST(request: NextRequest) {
  const t = getDictionary(await getServerLocale()).errors.api.report;
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
      ReportDocument({
        processName: parsed.processName,
        currency: parsed.currency,
        categoryLabel: parsed.categoryLabel,
        context: parsed.context,
        answers: parsed.answers,
        weights: parsed.weights,
        aiAnalysis: parsed.aiAnalysis,
        currentProcessId: parsed.currentProcessId,
        roiInputs: parsed.roiInputs,
        orgLogoUrl: org.logoUrl,
        locale: parsed.locale,
        ...data,
      })
    );

    const filename = `verdiktnow-${parsed.processName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "rapport"}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("report route error", err);
    return NextResponse.json({ error: t.generationFailed }, { status: 500 });
  }
}
