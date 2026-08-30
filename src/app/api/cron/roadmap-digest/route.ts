import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { sendEmail, isEmailConfigured } from "@/lib/email";

type ProcessRow = { name: string; archived_at: string | null; organization_id: string | null };
type OverdueRow = { process_id: string; processes: ProcessRow | ProcessRow[] | null };

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? v[0] ?? null : v;
}

function digestHtml(processes: { name: string; count: number }[], origin: string): string {
  const items = processes
    .map((p) => `<li>${p.name} — ${p.count}</li>`)
    .join("");
  return `
    <p>Bonjour,</p>
    <p>Votre organisation a des échéances de feuille de route en retard ou dues aujourd'hui sur VerdiktNow :</p>
    <ul>${items}</ul>
    <p><a href="${origin}/fr/processus">Voir mon portefeuille</a></p>
    <hr>
    <p>Hello,</p>
    <p>Your organization has roadmap deadlines that are overdue or due today on VerdiktNow:</p>
    <ul>${items}</ul>
    <p><a href="${origin}/en/processus">View my portfolio</a></p>
  `;
}

/** Rappel hebdomadaire des échéances de feuille de route en retard/dues, déclenché par Vercel Cron
 * (voir vercel.json). Même requête d'agrégation que la bannière "en retard" de /processus, mais
 * sans filtre RLS (service role) puisqu'il n'y a pas d'utilisateur authentifié dans un cron. */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured || !isEmailConfigured) {
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const admin = createAdminClient();
  const todayIso = new Date().toISOString().slice(0, 10);

  const { data: overdueRows } = await admin
    .from("roadmap_progress")
    .select("process_id, processes(name, archived_at, organization_id)")
    .eq("done", false)
    .lte("due_date", todayIso);

  // organization_id -> process_id -> { name, count }
  const byOrg = new Map<string, Map<string, { name: string; count: number }>>();
  for (const row of (overdueRows ?? []) as unknown as OverdueRow[]) {
    const proc = one(row.processes);
    if (!proc || proc.archived_at || !proc.organization_id) continue;
    const orgProcesses = byOrg.get(proc.organization_id) ?? new Map();
    const existing = orgProcesses.get(row.process_id);
    orgProcesses.set(row.process_id, { name: proc.name, count: (existing?.count ?? 0) + 1 });
    byOrg.set(proc.organization_id, orgProcesses);
  }

  let emailsSent = 0;
  for (const [organizationId, processMap] of byOrg) {
    const { data: members } = await admin
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", organizationId)
      .in("role", ["owner", "member"]);

    const html = digestHtml(Array.from(processMap.values()), origin);
    for (const member of members ?? []) {
      const { data } = await admin.auth.admin.getUserById(member.user_id);
      const email = data.user?.email;
      if (!email) continue;
      const { ok } = await sendEmail({
        to: email,
        subject: "VerdiktNow — Échéances à traiter / Deadlines to address",
        html,
      });
      if (ok) emailsSent += 1;
    }
  }

  return NextResponse.json({ ok: true, organizationsNotified: byOrg.size, emailsSent });
}
