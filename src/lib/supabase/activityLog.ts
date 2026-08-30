import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Insertion best-effort dans le journal d'activité — appelée depuis d'autres server actions,
 * jamais exposée directement au client. Volontairement silencieuse en cas d'échec (RLS,
 * table absente avant migration) : le journal ne doit jamais faire échouer l'action réelle
 * qu'il décrit.
 */
export async function logActivity(
  supabase: SupabaseClient,
  organizationId: string,
  actorId: string | null | undefined,
  action: string,
  detail?: string | null,
  processId?: string | null
) {
  try {
    await supabase.from("activity_log").insert({
      organization_id: organizationId,
      process_id: processId ?? null,
      actor_id: actorId ?? null,
      action,
      detail: detail ?? null,
    });
  } catch {
    // best-effort — voir commentaire ci-dessus
  }
}
