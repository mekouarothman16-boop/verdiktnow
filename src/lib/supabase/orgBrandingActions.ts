"use server";

import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { createClient, getUserOrg } from "@/lib/supabase/server";
import { getServerLocale } from "@/i18n/serverLocale";
import { getDictionary } from "@/i18n/getDictionary";

const BUCKET = "org-logos";
const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_DIMENSION = 400;

async function requireOwner() {
  const t = getDictionary(await getServerLocale()).errors.actions.orgBranding;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const org = await getUserOrg(supabase, user?.id);
  if (!org) return { error: t.orgNotFound } as const;
  if (org.role !== "owner") return { error: t.ownerOnly } as const;
  return { supabase, org, t } as const;
}

async function clearExistingLogo(supabase: Awaited<ReturnType<typeof createClient>>, organizationId: string) {
  const { data: existing } = await supabase.storage.from(BUCKET).list(organizationId);
  if (existing && existing.length > 0) {
    await supabase.storage.from(BUCKET).remove(existing.map((f) => `${organizationId}/${f.name}`));
  }
}

export async function uploadOrgLogo(formData: FormData): Promise<{ ok: boolean; error?: string; logoUrl?: string }> {
  const auth = await requireOwner();
  if ("error" in auth) return { ok: false, error: auth.error };
  const { supabase, org, t } = auth;

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: t.noFileProvided };
  if (file.size > MAX_SIZE) return { ok: false, error: t.fileTooLarge };
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: t.formatNotSupported };
  }

  await clearExistingLogo(supabase, org.organizationId);

  // Réencodé en PNG propre et redimensionné : le décodeur PNG du moteur de PDF (pdfkit) est
  // plus strict qu'un navigateur et rejette certains fichiers (PNG entrelacés, chunks non
  // standards, etc.) que sharp normalise ici, sans quoi le logo peut s'afficher dans l'app
  // mais échouer silencieusement à l'export PDF.
  let normalized: Buffer;
  try {
    const original = Buffer.from(await file.arrayBuffer());
    normalized = await sharp(original)
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
  } catch {
    return { ok: false, error: t.corruptImage };
  }

  // Chemin unique par téléversement (plutôt qu'un nom fixe) : le moteur de PDF met en cache les
  // images par URL en mémoire pour la durée du process serveur ; un chemin fixe réutiliserait un
  // échec de décodage mis en cache même après correction du fichier source.
  const path = `${org.organizationId}/logo-${Date.now()}.png`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, normalized, {
    contentType: "image/png",
    upsert: true,
  });
  if (uploadError) return { ok: false, error: t.uploadFailed };

  const { error: updateError } = await supabase
    .from("organizations")
    .update({ logo_path: path })
    .eq("id", org.organizationId);
  if (updateError) return { ok: false, error: t.saveFailed };

  revalidatePath("/compte");
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, logoUrl: pub.publicUrl };
}

export async function removeOrgLogo(): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireOwner();
  if ("error" in auth) return { ok: false, error: auth.error };
  const { supabase, org } = auth;

  await clearExistingLogo(supabase, org.organizationId);
  await supabase.from("organizations").update({ logo_path: null }).eq("id", org.organizationId);

  revalidatePath("/compte");
  return { ok: true };
}
