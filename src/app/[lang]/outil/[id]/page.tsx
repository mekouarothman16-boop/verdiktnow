import { notFound, redirect } from "next/navigation";
import { createClient, getUserOrg, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { ToolShell } from "@/components/app/ToolShell";
import { SupabaseSetupNotice } from "@/components/app/SupabaseSetupNotice";
import { DEFAULT_ROI_INPUTS, DEFAULT_WEIGHTS } from "@/lib/scoring";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import type { AssessmentHistoryRow, AssessmentRow, ProcessRow, RoiInputsRow } from "@/lib/supabase/types";

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? v[0] ?? null : v;
}

export default async function ProcessToolPage({ params }: { params: Promise<{ id: string; lang: string }> }) {
  const { id, lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  if (!isSupabaseConfigured) return <SupabaseSetupNotice />;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/connexion?next=/${lang}/outil/${id}`);

  const org = await getUserOrg(supabase, user.id);

  const { data } = await supabase
    .from("processes")
    .select("*, assessments(*), roi_inputs(*)")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const process = data as ProcessRow;
  const assessment = one<AssessmentRow>(
    (data as unknown as { assessments: AssessmentRow | AssessmentRow[] | null }).assessments
  );
  const roiRow = one<RoiInputsRow>(
    (data as unknown as { roi_inputs: RoiInputsRow | RoiInputsRow[] | null }).roi_inputs
  );

  const { data: historyData } = await supabase
    .from("assessment_history")
    .select("id, aptitude_score, value_score, net_recurring, saved_at")
    .eq("process_id", id)
    .order("saved_at", { ascending: false })
    .limit(24);
  const history = (historyData ?? []) as Pick<AssessmentHistoryRow, "id" | "aptitude_score" | "value_score" | "net_recurring" | "saved_at">[];

  let siblings: { id: string; name: string }[] = [];
  if (org) {
    const { data: siblingRows } = await supabase
      .from("processes")
      .select("id, name")
      .eq("organization_id", org.organizationId)
      .is("archived_at", null)
      .neq("id", id);
    siblings = (siblingRows ?? []) as { id: string; name: string }[];
  }

  // Pour le sélecteur d'assignation de la feuille de route — mêmes membres que /compte,
  // mais on n'a besoin ici que de l'id et de l'email, pas du rôle.
  let members: { userId: string; email: string }[] = [];
  if (org && isSupabaseAdminConfigured) {
    const { data: memberRows } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", org.organizationId);
    if (memberRows) {
      const admin = createAdminClient();
      members = await Promise.all(
        memberRows.map(async (row) => {
          const { data } = await admin.auth.admin.getUserById(row.user_id);
          return { userId: row.user_id, email: data.user?.email ?? row.user_id };
        })
      );
    }
  }

  return (
    <ToolShell
      processId={process.id}
      plan={org?.plan ?? "free"}
      role={org?.role}
      loggedIn
      initialName={process.name}
      initialCurrency={process.currency}
      initialContext={assessment?.context ?? {}}
      initialAnswers={assessment?.answers ?? {}}
      initialWeights={{ ...DEFAULT_WEIGHTS, ...(assessment?.weights ?? {}) }}
      initialRoi={{ ...DEFAULT_ROI_INPUTS, ...(roiRow?.inputs ?? {}) }}
      initialAiAnalysis={assessment?.ai_analysis ?? null}
      initialUpdatedAt={assessment?.updated_at ?? null}
      initialHistory={history}
      initialTags={process.tags ?? []}
      aiQuota={org?.aiQuota ?? null}
      aiUsedThisMonth={org?.aiUsedThisMonth ?? 0}
      hoursPerFte={org?.hoursPerFte}
      magnitudeRef={org?.magnitudeRef}
      priorityThreshold={org?.priorityThreshold ?? 50}
      siblings={siblings}
      members={members}
    />
  );
}
