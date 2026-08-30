"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUserOrg } from "@/lib/supabase/server";
import { getServerLocale } from "@/i18n/serverLocale";
import { getDictionary } from "@/i18n/getDictionary";

const BOUNDS = {
  hoursPerFte: { min: 500, max: 3000 },
  magnitudeRef: { min: 1000, max: 10000000 },
  priorityThreshold: { min: 10, max: 90 },
};

export async function updateOrgConstants(
  hoursPerFte: number,
  magnitudeRef: number,
  priorityThreshold: number
): Promise<{ ok: boolean; error?: string }> {
  const t = getDictionary(await getServerLocale()).errors.actions.orgCalibration;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const org = await getUserOrg(supabase, user?.id);
  if (!org) return { ok: false, error: t.orgNotFound };
  if (org.role !== "owner") return { ok: false, error: t.ownerOnly };

  const inBounds = (v: number, b: { min: number; max: number }) => Number.isFinite(v) && v >= b.min && v <= b.max;
  if (
    !inBounds(hoursPerFte, BOUNDS.hoursPerFte) ||
    !inBounds(magnitudeRef, BOUNDS.magnitudeRef) ||
    !inBounds(priorityThreshold, BOUNDS.priorityThreshold)
  ) {
    return { ok: false, error: t.invalidValue };
  }

  const { error } = await supabase
    .from("organizations")
    .update({ constants: { hoursPerFte, magnitudeRef, priorityThreshold } })
    .eq("id", org.organizationId);
  if (error) return { ok: false, error: t.saveFailed };

  revalidatePath("/compte");
  return { ok: true };
}
