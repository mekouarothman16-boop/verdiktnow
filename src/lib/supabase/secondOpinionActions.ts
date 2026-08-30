"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUserOrg } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/supabase/activityLog";
import { getServerLocale } from "@/i18n/serverLocale";
import { getDictionary } from "@/i18n/getDictionary";
import type { Answers } from "@/lib/scoring";
import type { SecondOpinionRow } from "@/lib/supabase/types";

export type SecondOpinionEntry = {
  respondentId: string;
  respondentEmail: string;
  answers: Answers;
  submittedAt: string;
  isMine: boolean;
};

/** Tout membre ayant accès au processus (y compris un lecteur) peut consulter les deuxièmes
 * avis : ce sont des points de vue indépendants, pas une modification de l'évaluation principale. */
export async function listSecondOpinions(processId: string): Promise<SecondOpinionEntry[]> {
  const t = getDictionary(await getServerLocale()).errors.actions.secondOpinion;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("assessment_second_opinions")
    .select("id, process_id, respondent_id, answers, submitted_at, updated_at")
    .eq("process_id", processId)
    .order("submitted_at", { ascending: true });
  if (!data) return [];

  const rows = data as SecondOpinionRow[];
  const emailByUserId = new Map<string, string>();
  if (isSupabaseAdminConfigured) {
    const admin = createAdminClient();
    const uniqueIds = Array.from(new Set(rows.map((r) => r.respondent_id)));
    await Promise.all(
      uniqueIds.map(async (id) => {
        const { data: u } = await admin.auth.admin.getUserById(id);
        emailByUserId.set(id, u.user?.email ?? id);
      })
    );
  }

  return rows.map((r) => ({
    respondentId: r.respondent_id,
    respondentEmail: r.respondent_id === user.id ? t.you : emailByUserId.get(r.respondent_id) ?? r.respondent_id,
    answers: r.answers,
    submittedAt: r.submitted_at,
    isMine: r.respondent_id === user.id,
  }));
}

export async function submitSecondOpinion(processId: string, answers: Answers) {
  const t = getDictionary(await getServerLocale()).errors.actions.secondOpinion;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: t.loginRequired };

  const org = await getUserOrg(supabase, user.id);
  if (!org) return { ok: false as const, error: t.orgNotFound };

  const { error } = await supabase
    .from("assessment_second_opinions")
    .upsert(
      { process_id: processId, respondent_id: user.id, answers, updated_at: new Date().toISOString() },
      { onConflict: "process_id,respondent_id" }
    );

  if (!error) {
    await logActivity(supabase, org.organizationId, user.id, "second_opinion_submitted", null, processId);
  }

  revalidatePath(`/outil/${processId}`);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function deleteSecondOpinion(processId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("assessment_second_opinions")
    .delete()
    .eq("process_id", processId)
    .eq("respondent_id", user.id);
  revalidatePath(`/outil/${processId}`);
}
