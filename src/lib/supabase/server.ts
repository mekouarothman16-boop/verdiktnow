import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrgRole, Plan } from "@/lib/supabase/types";
import { aiQuotaFor } from "@/lib/plans";

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type UserOrg = {
  organizationId: string;
  orgName: string;
  role: OrgRole;
  plan: Plan;
  aiQuota: number | null;
  aiUsedThisMonth: number;
  logoUrl: string | null;
  hoursPerFte: number;
  magnitudeRef: number;
  priorityThreshold: number;
};

type MembershipRow = {
  organization_id: string;
  role: OrgRole;
  organizations: {
    name: string;
    logo_path: string | null;
    constants: unknown;
    organization_billing: { plan: Plan; ai_quota_override: number | null } | null;
  } | null;
};

const ORG_LOGO_BUCKET = "org-logos";

export const DEFAULT_ORG_CONSTANTS = { hoursPerFte: 1600, magnitudeRef: 120000, priorityThreshold: 50 };

/** Repère générique hors contexte d'organisation (page vitrine, rapport d'exemple). */
export const FALLBACK_ORG_CONSTANTS = DEFAULT_ORG_CONSTANTS;

/** `organizations.constants` (jsonb) est calibrable par organisation — voir OrgCalibration.tsx.
 * Bornes larges mais réelles : au-delà, un chiffre saisi par erreur (ex. 0 ou 10 millions)
 * fausserait silencieusement tous les calculs de ROI/priorisation de l'organisation. */
function parseOrgConstants(raw: unknown): { hoursPerFte: number; magnitudeRef: number; priorityThreshold: number } {
  const c = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const num = (v: unknown, fallback: number, min: number, max: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
  return {
    hoursPerFte: num(c.hoursPerFte, DEFAULT_ORG_CONSTANTS.hoursPerFte, 500, 3000),
    magnitudeRef: num(c.magnitudeRef, DEFAULT_ORG_CONSTANTS.magnitudeRef, 1000, 10000000),
    priorityThreshold: num(c.priorityThreshold, DEFAULT_ORG_CONSTANTS.priorityThreshold, 10, 90),
  };
}

/** Résout l'organisation d'un utilisateur connecté (chaque utilisateur appartient à
 * exactement une organisation, créée ou rejointe à l'inscription). Retourne `null`
 * pour un visiteur anonyme. */
export async function getUserOrg(supabase: SupabaseClient, userId: string | undefined): Promise<UserOrg | null> {
  if (!userId) return null;

  const { data } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(name, logo_path, constants, organization_billing(plan, ai_quota_override))")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  const membership = data as unknown as MembershipRow;
  const billing = membership.organizations?.organization_billing ?? null;
  const plan: Plan = billing?.plan ?? "free";
  const aiQuota = aiQuotaFor(plan, billing?.ai_quota_override ?? null);
  const logoPath = membership.organizations?.logo_path ?? null;
  const logoUrl = logoPath ? supabase.storage.from(ORG_LOGO_BUCKET).getPublicUrl(logoPath).data.publicUrl : null;
  const constants = parseOrgConstants(membership.organizations?.constants);

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("ai_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", membership.organization_id)
    .gte("created_at", startOfMonth.toISOString());

  return {
    organizationId: membership.organization_id,
    orgName: membership.organizations?.name ?? "Mon organisation",
    role: membership.role,
    plan,
    aiQuota,
    aiUsedThisMonth: count ?? 0,
    logoUrl,
    hoursPerFte: constants.hoursPerFte,
    magnitudeRef: constants.magnitudeRef,
    priorityThreshold: constants.priorityThreshold,
  };
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore when middleware
            // is refreshing the session.
          }
        },
      },
    }
  );
}
