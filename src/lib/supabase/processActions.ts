"use server";

import { redirect } from "next/navigation";
import { createClient, getUserOrg } from "@/lib/supabase/server";
import { logActivity } from "@/lib/supabase/activityLog";
import { getServerLocale, revalidateLocalizedPath } from "@/i18n/serverLocale";
import { getDictionary } from "@/i18n/getDictionary";
import type { AnalysisResult, Answers, Context, Currency, RoiInputs, Weights } from "@/lib/scoring";

export async function createProcess() {
  const locale = await getServerLocale();
  const t = getDictionary(locale).errors.actions.process;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/connexion`);

  const org = await getUserOrg(supabase, user.id);
  if (!org) redirect(`/${locale}/connexion`);

  // Aucun forfait gratuit : la page /processus affiche un mur de paiement plutôt que ce
  // bouton pour une organisation sans abonnement payant actif, mais cette action reste
  // appelable directement (formulaire brut) — même garde ici, en profondeur.
  if (org.plan === "free") {
    redirect(`/${locale}/compte`);
  }

  const { data, error } = await supabase
    .from("processes")
    .insert({ user_id: user.id, organization_id: org.organizationId })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/${locale}/processus?error=${encodeURIComponent(error?.message ?? t.createFailed)}`);
  }
  await logActivity(supabase, org.organizationId, user.id, "process_created", null, data.id);
  redirect(`/${locale}/outil/${data.id}`);
}

/** Suppression définitive — irréversible, y compris l'historique. Réservée à la vue des archives. */
export async function deleteProcess(processId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: proc } = await supabase.from("processes").select("organization_id, name").eq("id", processId).maybeSingle();
  await supabase.from("processes").delete().eq("id", processId);
  if (proc) await logActivity(supabase, proc.organization_id, user?.id, "process_deleted", proc.name);
  revalidateLocalizedPath("/processus");
}

/** Action par défaut au lieu de la suppression : masque le processus sans perdre son historique. */
export async function archiveProcess(processId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: proc } = await supabase.from("processes").select("organization_id, name").eq("id", processId).maybeSingle();
  await supabase.from("processes").update({ archived_at: new Date().toISOString() }).eq("id", processId);
  if (proc) await logActivity(supabase, proc.organization_id, user?.id, "process_archived", proc.name, processId);
  revalidateLocalizedPath("/processus");
}

export async function unarchiveProcess(processId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: proc } = await supabase.from("processes").select("organization_id, name").eq("id", processId).maybeSingle();
  await supabase.from("processes").update({ archived_at: null }).eq("id", processId);
  if (proc) await logActivity(supabase, proc.organization_id, user?.id, "process_unarchived", proc.name, processId);
  revalidateLocalizedPath("/processus");
}

export async function updateProcessTags(processId: string, tags: string[]) {
  const supabase = await createClient();
  const clean = Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean))).slice(0, 15);
  const { error } = await supabase.from("processes").update({ tags: clean }).eq("id", processId);
  revalidateLocalizedPath(`/outil/${processId}`);
  revalidateLocalizedPath("/processus");
  return error ? { ok: false as const, error: error.message } : { ok: true as const, tags: clean };
}

/**
 * Duplique le contexte qualitatif et la pondération d'un processus pour démarrer une nouvelle
 * évaluation sans repartir de zéro. Les réponses du diagnostic et les paramètres ROI ne sont PAS
 * copiés : ils décrivent le processus source spécifiquement et seraient trompeurs sur une copie.
 */
export async function duplicateProcess(processId: string) {
  const locale = await getServerLocale();
  const t = getDictionary(locale).errors.actions.process;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/connexion`);

  const org = await getUserOrg(supabase, user.id);
  if (!org) redirect(`/${locale}/connexion`);

  const { data: source } = await supabase
    .from("processes")
    .select("name, currency, assessments(context, weights)")
    .eq("id", processId)
    .single();

  if (!source) {
    redirect(`/${locale}/processus?error=${encodeURIComponent(t.notFound)}`);
  }

  const { data: newProcess, error } = await supabase
    .from("processes")
    .insert({
      user_id: user.id,
      organization_id: org.organizationId,
      name: `${source.name} ${t.copySuffix}`,
      currency: source.currency,
    })
    .select("id")
    .single();

  if (error || !newProcess) {
    redirect(`/${locale}/processus?error=${encodeURIComponent(error?.message ?? t.duplicateFailed)}`);
  }

  const sourceAssessment = Array.isArray(source.assessments) ? source.assessments[0] : source.assessments;
  if (sourceAssessment) {
    await supabase.from("assessments").insert({
      process_id: newProcess.id,
      context: sourceAssessment.context ?? {},
      weights: sourceAssessment.weights ?? {},
    });
  }

  await logActivity(supabase, org.organizationId, user.id, "process_duplicated", `${source.name} ${t.copySuffix}`, newProcess.id);
  revalidateLocalizedPath("/processus");
  redirect(`/${locale}/outil/${newProcess.id}`);
}

export type SaveProcessPayload = {
  name: string;
  currency: Currency;
  context: Context;
  answers: Answers;
  weights: Weights;
  aptitudeScore: number;
  roiInputs: RoiInputs;
  valueScore: number;
  netRecurring: number;
  aiAnalysis?: AnalysisResult | null;
  /** updated_at chargé à l'ouverture de la page — sert à détecter qu'un autre membre a sauvegardé entretemps. */
  expectedUpdatedAt?: string | null;
  /** Contourne délibérément la détection de collision (l'utilisateur a choisi d'écraser malgré l'avertissement). */
  force?: boolean;
};

export type SaveProcessResult =
  | { ok: true; updatedAt: string | null }
  | { ok: false; error: string; conflict?: boolean };

export async function saveProcess(processId: string, payload: SaveProcessPayload): Promise<SaveProcessResult> {
  const t = getDictionary(await getServerLocale()).errors.actions.process;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (payload.expectedUpdatedAt && !payload.force) {
    const { data: current } = await supabase
      .from("assessments")
      .select("updated_at")
      .eq("process_id", processId)
      .maybeSingle();
    if (current && current.updated_at !== payload.expectedUpdatedAt) {
      return {
        ok: false,
        conflict: true,
        error: t.conflictModified,
      };
    }
  }

  const [{ error: processError }, assessmentResult, { error: roiError }] = await Promise.all([
    supabase
      .from("processes")
      .update({ name: payload.name, currency: payload.currency })
      .eq("id", processId),
    supabase
      .from("assessments")
      .upsert({
        process_id: processId,
        context: payload.context,
        answers: payload.answers,
        weights: payload.weights,
        aptitude_score: payload.aptitudeScore,
        ai_analysis: payload.aiAnalysis ?? null,
      })
      .select("updated_at")
      .single(),
    supabase.from("roi_inputs").upsert({
      process_id: processId,
      inputs: payload.roiInputs,
      value_score: payload.valueScore,
    }),
  ]);

  const error = processError || assessmentResult.error || roiError;
  if (error) return { ok: false, error: error.message };

  await supabase.from("assessment_history").insert({
    process_id: processId,
    context: payload.context,
    answers: payload.answers,
    weights: payload.weights,
    aptitude_score: payload.aptitudeScore,
    roi_inputs: payload.roiInputs,
    value_score: payload.valueScore,
    net_recurring: payload.netRecurring,
    saved_by: user?.id ?? null,
  });

  const { data: procRow } = await supabase.from("processes").select("organization_id").eq("id", processId).maybeSingle();
  if (procRow) await logActivity(supabase, procRow.organization_id, user?.id, "process_saved", payload.name, processId);

  revalidateLocalizedPath(`/outil/${processId}`);
  revalidateLocalizedPath("/processus");
  return { ok: true, updatedAt: assessmentResult.data?.updated_at ?? null };
}

export type BulkImportRow = { name: string; category?: string; tags?: string[]; currency?: Currency };

/** Import en masse depuis un CSV — plafonné à 200 lignes par appel pour éviter un abus accidentel. */
export async function bulkImportProcesses(rows: BulkImportRow[]): Promise<{ created: number; errors: string[] }> {
  const t = getDictionary(await getServerLocale()).errors.actions.process;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { created: 0, errors: [t.loginToImport] };

  const org = await getUserOrg(supabase, user.id);
  if (!org) return { created: 0, errors: [t.orgNotFound] };
  if (org.plan === "free") return { created: 0, errors: [t.paidPlanRequired] };

  const clean = rows
    .map((r) => ({ ...r, name: r.name.trim() }))
    .filter((r) => r.name.length > 0)
    .slice(0, 200);

  if (clean.length === 0) return { created: 0, errors: [t.noValidRows] };

  let created = 0;
  const errors: string[] = [];
  for (const row of clean) {
    const { data: newProcess, error } = await supabase
      .from("processes")
      .insert({
        user_id: user.id,
        organization_id: org.organizationId,
        name: row.name,
        currency: row.currency ?? "CAD",
        tags: row.tags ?? [],
      })
      .select("id")
      .single();

    if (error || !newProcess) {
      errors.push(t.importRowFailed.replace("{name}", row.name).replace("{message}", error?.message ?? t.importRowFailedFallback));
      continue;
    }
    if (row.category) {
      await supabase.from("assessments").insert({ process_id: newProcess.id, context: { category: row.category } });
    }
    created++;
  }

  if (created > 0) {
    await logActivity(supabase, org.organizationId, user.id, "csv_import", String(created));
  }

  revalidateLocalizedPath("/processus");
  return { created, errors };
}
