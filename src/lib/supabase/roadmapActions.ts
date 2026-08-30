"use server";

import { createClient, getUserOrg } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getServerLocale } from "@/i18n/serverLocale";
import { getDictionary } from "@/i18n/getDictionary";
import type { RoadmapProgressRow } from "@/lib/supabase/types";

export type RoadmapProgressEntry = Pick<
  RoadmapProgressRow,
  | "step_key"
  | "done"
  | "text"
  | "is_custom"
  | "phase_key"
  | "due_date"
  | "assigned_to"
  | "title"
  | "start_date"
  | "progress_percent"
  | "is_blocking"
  | "status_color"
  | "blocking_detail"
  | "blocking_resolution"
> & {
  dueDateSetByLabel: string | null;
  assignedToLabel: string | null;
};

/** Résout due_date_set_by et assigned_to en libellé affichable ("vous" ou l'email) côté serveur —
 * même principe que la résolution actor_id → email du journal d'activité (processus/page.tsx) :
 * jamais d'id brut envoyé au client, toujours résolu via l'API admin avant de quitter le serveur. */
export async function listRoadmapProgress(processId: string): Promise<RoadmapProgressEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("roadmap_progress")
    .select(
      "step_key, done, text, is_custom, phase_key, due_date, due_date_set_by, assigned_to, title, start_date, progress_percent, is_blocking, status_color, blocking_detail, blocking_resolution"
    )
    .eq("process_id", processId);

  const rows = data ?? [];
  const t = getDictionary(await getServerLocale()).tool.roadmapChecklist;

  const emailByUserId = new Map<string, string>();
  const otherIds = Array.from(
    new Set(
      [...rows.map((r) => r.due_date_set_by), ...rows.map((r) => r.assigned_to)].filter(
        (id): id is string => !!id && id !== user.id
      )
    )
  );
  if (otherIds.length > 0 && isSupabaseAdminConfigured) {
    const admin = createAdminClient();
    await Promise.all(
      otherIds.map(async (id) => {
        const { data } = await admin.auth.admin.getUserById(id);
        emailByUserId.set(id, data.user?.email ?? id);
      })
    );
  }

  return rows.map((r) => ({
    step_key: r.step_key,
    done: r.done,
    text: r.text,
    is_custom: r.is_custom,
    phase_key: r.phase_key,
    due_date: r.due_date,
    assigned_to: r.assigned_to,
    title: r.title,
    start_date: r.start_date,
    progress_percent: r.progress_percent,
    is_blocking: r.is_blocking,
    status_color: r.status_color as "green" | "yellow" | "red" | "gray" | null,
    blocking_detail: r.blocking_detail,
    blocking_resolution: r.blocking_resolution,
    dueDateSetByLabel: !r.due_date_set_by
      ? null
      : r.due_date_set_by === user.id
        ? t.youLabel
        : emailByUserId.get(r.due_date_set_by) ?? null,
    assignedToLabel: !r.assigned_to
      ? null
      : r.assigned_to === user.id
        ? t.youLabel
        : emailByUserId.get(r.assigned_to) ?? null,
  }));
}

export async function toggleRoadmapStep(processId: string, stepKey: string, done: boolean) {
  const t = getDictionary(await getServerLocale()).errors.actions.roadmap;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: t.loginRequired };

  const org = await getUserOrg(supabase, user.id);
  if (!org) return { ok: false as const, error: t.orgNotFound };

  const { error } = await supabase.from("roadmap_progress").upsert(
    {
      process_id: processId,
      step_key: stepKey,
      done,
      done_by: done ? user.id : null,
      done_at: done ? new Date().toISOString() : null,
      // Synchronisé dans un seul sens avec le % d'avancement du tableau de bord : cocher/décocher
      // ici force 100/0, mais une valeur intermédiaire fixée depuis le tableau (1-99) ne coche
      // jamais cette case — voir updateRoadmapStepProgress pour le sens inverse.
      progress_percent: done ? 100 : 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "process_id,step_key" }
  );

  if (error) return { ok: false as const, error: t.saveFailed };
  return { ok: true as const };
}

/** Réécrit le texte affiché d'une étape générée (surcharge) ou d'une étape personnalisée. */
export async function updateRoadmapStepText(processId: string, stepKey: string, text: string) {
  const t = getDictionary(await getServerLocale()).errors.actions.roadmap;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: t.loginRequired };

  const org = await getUserOrg(supabase, user.id);
  if (!org) return { ok: false as const, error: t.orgNotFound };

  const trimmed = text.trim().slice(0, 300);
  if (!trimmed) return { ok: false as const, error: t.textRequired };

  const { error } = await supabase.from("roadmap_progress").upsert(
    { process_id: processId, step_key: stepKey, text: trimmed, updated_at: new Date().toISOString() },
    { onConflict: "process_id,step_key" }
  );

  if (error) return { ok: false as const, error: t.saveFailed };
  return { ok: true as const };
}

/** Fixe ou retire (dueDate === null) l'échéance affichée pour une étape générée ou personnalisée. */
export async function updateRoadmapStepDueDate(processId: string, stepKey: string, dueDate: string | null) {
  const t = getDictionary(await getServerLocale()).errors.actions.roadmap;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: t.loginRequired };

  const org = await getUserOrg(supabase, user.id);
  if (!org) return { ok: false as const, error: t.orgNotFound };

  const { error } = await supabase.from("roadmap_progress").upsert(
    {
      process_id: processId,
      step_key: stepKey,
      due_date: dueDate,
      due_date_set_by: dueDate ? user.id : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "process_id,step_key" }
  );

  if (error) return { ok: false as const, error: t.saveFailed };
  return { ok: true as const };
}

/** Assigne (ou retire, assigneeId === null) une étape générée ou personnalisée à un membre de
 * l'organisation. Ne vérifie pas ici que assigneeId appartient bien à l'organisation — la même
 * confiance que le reste de ces actions serveur (l'UI n'offre que les membres de l'org dans le
 * sélecteur), la RLS de roadmap_progress reste la garde réelle contre un accès hors organisation.
 *
 * `currentText` est toujours ré-écrit dans la colonne `text`, même s'il n'a pas changé : c'est
 * l'appelant (RoadmapChecklist) qui connaît déjà le texte affiché (généré ou personnalisé), donc
 * cette écriture est sans risque (idempotente) et sert de "photo" durable du libellé — nécessaire
 * pour qu'une étape générée reste lisible hors du contexte de son processus (voir la page
 * "Mes tâches", qui liste des étapes de plusieurs processus sans recalculer chaque diagnostic). */
export async function updateRoadmapStepAssignee(processId: string, stepKey: string, assigneeId: string | null, currentText: string) {
  const t = getDictionary(await getServerLocale()).errors.actions.roadmap;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: t.loginRequired };

  const org = await getUserOrg(supabase, user.id);
  if (!org) return { ok: false as const, error: t.orgNotFound };

  const { error } = await supabase.from("roadmap_progress").upsert(
    { process_id: processId, step_key: stepKey, assigned_to: assigneeId, text: currentText, updated_at: new Date().toISOString() },
    { onConflict: "process_id,step_key" }
  );

  if (error) return { ok: false as const, error: t.saveFailed };
  return { ok: true as const };
}

/** Réécrit le titre court (colonne `title`) d'une étape générée (surcharge) ou personnalisée —
 * pendant de `updateRoadmapStepText` pour la description longue. */
export async function updateRoadmapStepTitle(processId: string, stepKey: string, title: string) {
  const t = getDictionary(await getServerLocale()).errors.actions.roadmap;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: t.loginRequired };

  const org = await getUserOrg(supabase, user.id);
  if (!org) return { ok: false as const, error: t.orgNotFound };

  const trimmed = title.trim().slice(0, 300);
  if (!trimmed) return { ok: false as const, error: t.textRequired };

  const { error } = await supabase.from("roadmap_progress").upsert(
    { process_id: processId, step_key: stepKey, title: trimmed, updated_at: new Date().toISOString() },
    { onConflict: "process_id,step_key" }
  );

  if (error) return { ok: false as const, error: t.saveFailed };
  return { ok: true as const };
}

export async function updateRoadmapStepStartDate(processId: string, stepKey: string, startDate: string | null) {
  const t = getDictionary(await getServerLocale()).errors.actions.roadmap;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: t.loginRequired };

  const org = await getUserOrg(supabase, user.id);
  if (!org) return { ok: false as const, error: t.orgNotFound };

  const { error } = await supabase.from("roadmap_progress").upsert(
    { process_id: processId, step_key: stepKey, start_date: startDate, updated_at: new Date().toISOString() },
    { onConflict: "process_id,step_key" }
  );

  if (error) return { ok: false as const, error: t.saveFailed };
  return { ok: true as const };
}

/** Sens inverse de la synchronisation faite dans `toggleRoadmapStep` : atteindre 100 % coche
 * `done`, toute autre valeur (y compris redescendre depuis 100) la décoche. */
export async function updateRoadmapStepProgress(processId: string, stepKey: string, percent: number) {
  const t = getDictionary(await getServerLocale()).errors.actions.roadmap;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: t.loginRequired };

  const org = await getUserOrg(supabase, user.id);
  if (!org) return { ok: false as const, error: t.orgNotFound };

  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const done = clamped === 100;

  const { error } = await supabase.from("roadmap_progress").upsert(
    {
      process_id: processId,
      step_key: stepKey,
      progress_percent: clamped,
      done,
      done_by: done ? user.id : null,
      done_at: done ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "process_id,step_key" }
  );

  if (error) return { ok: false as const, error: t.saveFailed };
  return { ok: true as const };
}

export async function updateRoadmapStepBlocking(processId: string, stepKey: string, isBlocking: boolean) {
  const t = getDictionary(await getServerLocale()).errors.actions.roadmap;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: t.loginRequired };

  const org = await getUserOrg(supabase, user.id);
  if (!org) return { ok: false as const, error: t.orgNotFound };

  const { error } = await supabase.from("roadmap_progress").upsert(
    { process_id: processId, step_key: stepKey, is_blocking: isBlocking, updated_at: new Date().toISOString() },
    { onConflict: "process_id,step_key" }
  );

  if (error) return { ok: false as const, error: t.saveFailed };
  return { ok: true as const };
}

export async function updateRoadmapStepBlockingDetail(processId: string, stepKey: string, detail: string) {
  const t = getDictionary(await getServerLocale()).errors.actions.roadmap;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: t.loginRequired };

  const org = await getUserOrg(supabase, user.id);
  if (!org) return { ok: false as const, error: t.orgNotFound };

  const { error } = await supabase.from("roadmap_progress").upsert(
    { process_id: processId, step_key: stepKey, blocking_detail: detail.trim().slice(0, 500) || null, updated_at: new Date().toISOString() },
    { onConflict: "process_id,step_key" }
  );

  if (error) return { ok: false as const, error: t.saveFailed };
  return { ok: true as const };
}

export async function updateRoadmapStepBlockingResolution(processId: string, stepKey: string, resolution: string) {
  const t = getDictionary(await getServerLocale()).errors.actions.roadmap;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: t.loginRequired };

  const org = await getUserOrg(supabase, user.id);
  if (!org) return { ok: false as const, error: t.orgNotFound };

  const { error } = await supabase.from("roadmap_progress").upsert(
    { process_id: processId, step_key: stepKey, blocking_resolution: resolution.trim().slice(0, 500) || null, updated_at: new Date().toISOString() },
    { onConflict: "process_id,step_key" }
  );

  if (error) return { ok: false as const, error: t.saveFailed };
  return { ok: true as const };
}

export async function updateRoadmapStepStatus(processId: string, stepKey: string, color: "green" | "yellow" | "red" | "gray" | null) {
  const t = getDictionary(await getServerLocale()).errors.actions.roadmap;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: t.loginRequired };

  const org = await getUserOrg(supabase, user.id);
  if (!org) return { ok: false as const, error: t.orgNotFound };

  const { error } = await supabase.from("roadmap_progress").upsert(
    { process_id: processId, step_key: stepKey, status_color: color, updated_at: new Date().toISOString() },
    { onConflict: "process_id,step_key" }
  );

  if (error) return { ok: false as const, error: t.saveFailed };
  return { ok: true as const };
}

/** Ajoute une action propre à l'équipe, absente de la feuille de route générée.
 * `phaseKey` place l'action dans une section ("immediate" | "phase-0" | "phase-1" | "phase-2") —
 * un index plutôt que le titre de la phase, qui est traduit donc pas stable d'une langue à l'autre.
 * Écrit dans `title` (nom court) plutôt que `text` (description) : le formulaire rapide "+ Ajouter
 * une action" ne capture qu'un titre, la description détaillée s'ajoute ensuite depuis le tableau
 * de bord si besoin — même répartition que pour les étapes générées. */
export async function addCustomRoadmapStep(processId: string, phaseKey: string, title: string) {
  const t = getDictionary(await getServerLocale()).errors.actions.roadmap;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: t.loginRequired };

  const org = await getUserOrg(supabase, user.id);
  if (!org) return { ok: false as const, error: t.orgNotFound };

  const trimmed = title.trim().slice(0, 300);
  if (!trimmed) return { ok: false as const, error: t.textRequired };

  const { data, error } = await supabase
    .from("roadmap_progress")
    .insert({ process_id: processId, phase_key: phaseKey, title: trimmed, is_custom: true, done: false })
    .select("step_key")
    .single();

  if (error || !data) return { ok: false as const, error: t.saveFailed };
  return { ok: true as const, stepKey: data.step_key as string };
}

export async function deleteRoadmapStep(processId: string, stepKey: string) {
  const supabase = await createClient();
  await supabase
    .from("roadmap_progress")
    .delete()
    .eq("process_id", processId)
    .eq("step_key", stepKey)
    .eq("is_custom", true);
}
