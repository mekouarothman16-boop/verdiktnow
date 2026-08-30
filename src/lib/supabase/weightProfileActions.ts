"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUserOrg } from "@/lib/supabase/server";
import { logActivity } from "@/lib/supabase/activityLog";
import { getServerLocale } from "@/i18n/serverLocale";
import { getDictionary } from "@/i18n/getDictionary";
import type { Weights } from "@/lib/scoring";
import type { WeightProfileRow } from "@/lib/supabase/types";

export type WeightProfileEntry = Pick<WeightProfileRow, "id" | "name" | "category" | "weights" | "created_at">;

export async function listWeightProfiles(): Promise<WeightProfileEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const org = await getUserOrg(supabase, user.id);
  if (!org) return [];

  const { data } = await supabase
    .from("weight_profiles")
    .select("id, name, category, weights, created_at")
    .eq("organization_id", org.organizationId)
    .order("created_at", { ascending: false });

  return (data ?? []) as WeightProfileEntry[];
}

export async function saveWeightProfile(name: string, category: string | null, weights: Weights) {
  const t = getDictionary(await getServerLocale()).errors.actions.weightProfile;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: t.loginRequired };

  const org = await getUserOrg(supabase, user.id);
  if (!org) return { ok: false as const, error: t.orgNotFound };

  const trimmed = name.trim().slice(0, 60);
  if (!trimmed) return { ok: false as const, error: t.nameRequired };

  const { data, error } = await supabase
    .from("weight_profiles")
    .insert({ organization_id: org.organizationId, name: trimmed, category, weights, created_by: user.id })
    .select("id, created_at")
    .single();

  revalidatePath("/outil", "layout");
  if (error || !data) return { ok: false as const, error: error?.message ?? t.saveFailed };
  await logActivity(supabase, org.organizationId, user.id, "weight_profile_saved", trimmed);
  return { ok: true as const, id: data.id as string, createdAt: data.created_at as string };
}

export async function deleteWeightProfile(profileId: string) {
  const supabase = await createClient();
  await supabase.from("weight_profiles").delete().eq("id", profileId);
  revalidatePath("/outil", "layout");
}
