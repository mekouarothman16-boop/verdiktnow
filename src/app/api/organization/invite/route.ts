import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient, getUserOrg } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/supabase/activityLog";
import { getServerLocale } from "@/i18n/serverLocale";
import { getDictionary } from "@/i18n/getDictionary";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const locale = await getServerLocale();
  const t = getDictionary(locale).errors.api.orgInvite;

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ error: t.notConfigured }, { status: 503 });
  }

  let body: { email?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: t.invalidRequest }, { status: 400 });
  }
  const email = (body.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: t.invalidEmail }, { status: 400 });
  }
  // "owner" n'est jamais accepté ici : un second propriétaire ne peut être créé que
  // par un transfert de propriété explicite, pas via cette route d'invitation.
  const role = body.role === "viewer" ? "viewer" : "member";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: t.loginRequired }, { status: 401 });
  }

  const org = await getUserOrg(supabase, user.id);
  if (!org) {
    return NextResponse.json({ error: t.orgNotFound }, { status: 404 });
  }
  if (org.role !== "owner") {
    return NextResponse.json({ error: t.ownerOnly }, { status: 403 });
  }

  // Insertion via le client normal (RLS) : la policy "invites_owner_manage" revalide
  // que l'appelant est bien owner de l'organisation, indépendamment de la vérification ci-dessus.
  const { error: insertError } = await supabase.from("organization_invites").insert({
    organization_id: org.organizationId,
    email,
    role,
    invited_by: user.id,
  });
  if (insertError) {
    console.error("organization invite insert error", insertError);
    return NextResponse.json({ error: t.createFailed }, { status: 500 });
  }

  await logActivity(supabase, org.organizationId, user.id, "member_invited", email);

  const origin = (await headers()).get("origin") ?? new URL(request.url).origin;
  const admin = createAdminClient();
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/${locale}/connexion`,
  });

  if (inviteError) {
    if (inviteError.message?.toLowerCase().includes("already been registered")) {
      return NextResponse.json({ error: t.emailAlreadyUsed }, { status: 409 });
    }
    console.error("inviteUserByEmail error", inviteError);
    return NextResponse.json({ error: t.sendFailed }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
