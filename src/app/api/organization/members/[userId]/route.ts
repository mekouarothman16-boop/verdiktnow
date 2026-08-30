import { NextRequest, NextResponse } from "next/server";
import { createClient, getUserOrg } from "@/lib/supabase/server";
import { syncSeatBilling } from "@/lib/supabase/seatBilling";
import { getServerLocale } from "@/i18n/serverLocale";
import { getDictionary } from "@/i18n/getDictionary";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId: targetUserId } = await params;
  const t = getDictionary(await getServerLocale()).errors.api.orgMembers;

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

  const { data: target } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.organizationId)
    .eq("user_id", targetUserId)
    .single<{ role: "owner" | "member" | "viewer" }>();

  if (!target) {
    return NextResponse.json({ error: t.memberNotFound }, { status: 404 });
  }

  if (target.role === "owner") {
    const { count } = await supabase
      .from("organization_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", org.organizationId)
      .eq("role", "owner");
    if ((count ?? 0) <= 1) {
      return NextResponse.json({ error: t.cannotRemoveLastOwner }, { status: 400 });
    }
  }

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", org.organizationId)
    .eq("user_id", targetUserId);

  if (error) {
    console.error("remove member error", error);
    return NextResponse.json({ error: t.removeFailed }, { status: 500 });
  }

  await syncSeatBilling(org.organizationId);

  return NextResponse.json({ ok: true });
}
