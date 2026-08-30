"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUserOrg } from "@/lib/supabase/server";
import { logActivity } from "@/lib/supabase/activityLog";
import { getServerLocale } from "@/i18n/serverLocale";
import { getDictionary } from "@/i18n/getDictionary";

const BUCKET = "process-attachments";
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

export type AttachmentEntry = {
  path: string;
  name: string;
  size: number;
  contentType: string;
  createdAt: string;
  url: string;
};

export async function listAttachments(processId: string): Promise<AttachmentEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const org = await getUserOrg(supabase, user.id);
  if (!org) return [];

  const folder = `${org.organizationId}/${processId}`;
  const { data } = await supabase.storage.from(BUCKET).list(folder, { sortBy: { column: "created_at", order: "desc" } });
  if (!data) return [];

  const entries = await Promise.all(
    data
      .filter((f) => f.name !== ".emptyFolderPlaceholder")
      .map(async (f) => {
        const path = `${folder}/${f.name}`;
        const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
        return {
          path,
          name: f.name.replace(/^\d+-/, ""),
          size: f.metadata?.size ?? 0,
          contentType: f.metadata?.mimetype ?? "application/octet-stream",
          createdAt: f.created_at ?? "",
          url: signed?.signedUrl ?? "",
        };
      })
  );
  return entries;
}

export async function uploadAttachment(processId: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const t = getDictionary(await getServerLocale()).errors.actions.attachment;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: t.loginRequired };

  const org = await getUserOrg(supabase, user.id);
  if (!org) return { ok: false, error: t.orgNotFound };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: t.fileMissing };
  if (file.size > MAX_SIZE) return { ok: false, error: t.fileTooLarge };
  if (!ALLOWED_TYPES.includes(file.type)) return { ok: false, error: t.fileTypeNotAllowed };

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
  const path = `${org.organizationId}/${processId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) return { ok: false, error: error.message };

  await logActivity(supabase, org.organizationId, user.id, "attachment_added", file.name, processId);
  revalidatePath(`/outil/${processId}`);
  return { ok: true };
}

export async function deleteAttachment(processId: string, path: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const org = await getUserOrg(supabase, user?.id);
  if (!org || !path.startsWith(`${org.organizationId}/${processId}/`)) return;

  await supabase.storage.from(BUCKET).remove([path]);
  revalidatePath(`/outil/${processId}`);
}
