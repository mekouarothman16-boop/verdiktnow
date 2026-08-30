"use server";

import { createClient, getUserOrg } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getServerLocale } from "@/i18n/serverLocale";
import { getDictionary } from "@/i18n/getDictionary";

export async function exportMyData() {
  const t = getDictionary(await getServerLocale()).errors.actions.account;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: t.loginToExport };

  const org = await getUserOrg(supabase, user.id);
  if (!org) return { ok: false as const, error: t.orgNotFound };

  const { data: processes } = await supabase
    .from("processes")
    .select(
      "id, name, currency, created_at, updated_at, archived_at, tags, assessments(*), roi_inputs(*), process_comments(*)"
    )
    .eq("organization_id", org.organizationId);

  const { data: weightProfiles } = await supabase
    .from("weight_profiles")
    .select("name, category, weights, created_at")
    .eq("organization_id", org.organizationId);

  return {
    ok: true as const,
    data: {
      exportedAt: new Date().toISOString(),
      compte: { courriel: user.email, identifiant: user.id },
      organisation: { nom: org.orgName, palier: org.plan, role: org.role },
      processus: processes ?? [],
      profilsDePonderation: weightProfiles ?? [],
    },
  };
}

export type DeleteAccountResult = { ok: true } | { ok: false; error: string };

/**
 * Suppression de compte en libre-service, avec garde-fous : un propriétaire d'organisation
 * partagée avec d'autres membres ne peut pas supprimer son compte sans d'abord transférer la
 * propriété ou retirer les autres membres — sinon l'organisation resterait sans propriétaire.
 */
export async function deleteMyAccount(): Promise<DeleteAccountResult> {
  const t = getDictionary(await getServerLocale()).errors.actions.account;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: t.loginToDelete };
  if (!isSupabaseAdminConfigured) return { ok: false, error: t.deleteNotConfigured };

  const org = await getUserOrg(supabase, user.id);
  if (!org) return { ok: false, error: t.orgNotFound };

  const { data: memberRows } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", org.organizationId);
  const otherMembers = (memberRows ?? []).filter((m) => m.user_id !== user.id);

  if (org.role === "owner" && otherMembers.length > 0) {
    return { ok: false, error: t.sharedOrgOwner };
  }

  const admin = createAdminClient();

  if (org.role === "owner") {
    // Seul membre de l'organisation : supprimer d'abord les processus (aucun "on delete cascade"
    // depuis organizations vers processes), puis l'organisation elle-même — le reste (facturation,
    // membres, invitations, historique) suit par cascade FK.
    await admin.from("processes").delete().eq("organization_id", org.organizationId);
    await admin.from("organizations").delete().eq("id", org.organizationId);
  } else {
    await admin.from("organization_members").delete().eq("organization_id", org.organizationId).eq("user_id", user.id);
  }

  const { error: authError } = await admin.auth.admin.deleteUser(user.id);
  if (authError) return { ok: false, error: t.deleteError.replace("{message}", authError.message) };

  await supabase.auth.signOut();
  return { ok: true };
}
