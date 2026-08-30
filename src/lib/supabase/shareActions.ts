"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/supabase/activityLog";
import { getServerLocale } from "@/i18n/serverLocale";
import { getDictionary } from "@/i18n/getDictionary";
import type { ProcessShareLinkRow } from "@/lib/supabase/types";

export type ShareLinkEntry = Pick<ProcessShareLinkRow, "id" | "token" | "created_at" | "revoked_at">;

export async function listShareLinks(processId: string): Promise<ShareLinkEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("process_share_links")
    .select("id, token, created_at, revoked_at")
    .eq("process_id", processId)
    .order("created_at", { ascending: false });
  return (data ?? []) as ShareLinkEntry[];
}

export async function createShareLink(processId: string) {
  const t = getDictionary(await getServerLocale()).errors.actions.share;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: t.loginRequired };

  const { data, error } = await supabase
    .from("process_share_links")
    .insert({ process_id: processId, created_by: user.id })
    .select("id, token, created_at, revoked_at")
    .single();

  revalidatePath(`/outil/${processId}`);
  if (error || !data) return { ok: false as const, error: error?.message ?? t.createFailed };

  const { data: proc } = await supabase.from("processes").select("organization_id, name").eq("id", processId).maybeSingle();
  if (proc) await logActivity(supabase, proc.organization_id, user.id, "share_link_created", proc.name, processId);

  return { ok: true as const, link: data as ShareLinkEntry };
}

export async function revokeShareLink(processId: string, linkId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("process_share_links").update({ revoked_at: new Date().toISOString() }).eq("id", linkId);
  const { data: proc } = await supabase.from("processes").select("organization_id, name").eq("id", processId).maybeSingle();
  if (proc) await logActivity(supabase, proc.organization_id, user?.id, "share_link_revoked", proc.name, processId);
  revalidatePath(`/outil/${processId}`);
}
