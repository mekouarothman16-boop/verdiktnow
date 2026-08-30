import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { PublicToolView } from "@/components/app/PublicToolView";
import { DEFAULT_ROI_INPUTS, DEFAULT_WEIGHTS } from "@/lib/scoring";
import type { AnalysisResult, Answers, Context, Currency, RoiInputs, Weights } from "@/lib/scoring";

function Invalid() {
  return (
    <div className="flex-1 flex items-center justify-center p-10 text-center">
      <p className="text-ink-soft text-[14.5px] max-w-[420px]">
        Ce lien de partage est invalide ou a été révoqué. Demandez un nouveau lien à la personne qui vous l&rsquo;a
        transmis.
      </p>
    </div>
  );
}

export default async function SharedProcessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isSupabaseAdminConfigured) return <Invalid />;

  const admin = createAdminClient();

  const { data: link } = await admin
    .from("process_share_links")
    .select("process_id, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (!link || link.revoked_at) return <Invalid />;

  const { data } = await admin
    .from("processes")
    .select("name, currency, assessments(context, answers, weights, ai_analysis), roi_inputs(inputs)")
    .eq("id", link.process_id)
    .maybeSingle();

  if (!data) return <Invalid />;

  type AssessmentJoin = { context: Context | null; answers: Answers | null; weights: Weights | null; ai_analysis: AnalysisResult | null };
  type RoiJoin = { inputs: RoiInputs | null };

  const assessment = (Array.isArray(data.assessments) ? data.assessments[0] : data.assessments) as AssessmentJoin | null;
  const roiRow = (Array.isArray(data.roi_inputs) ? data.roi_inputs[0] : data.roi_inputs) as RoiJoin | null;

  return (
    <PublicToolView
      processName={data.name}
      currency={data.currency as Currency}
      context={assessment?.context ?? {}}
      answers={assessment?.answers ?? {}}
      weights={{ ...DEFAULT_WEIGHTS, ...(assessment?.weights ?? {}) }}
      roiInputs={{ ...DEFAULT_ROI_INPUTS, ...(roiRow?.inputs ?? {}) }}
      aiAnalysis={assessment?.ai_analysis ?? null}
    />
  );
}
