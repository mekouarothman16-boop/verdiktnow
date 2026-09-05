import { redirect } from "next/navigation";
import { FileText, Gauge, LogOut } from "lucide-react";
import { createClient, getUserOrg, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { signOut } from "@/lib/supabase/actions";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SupabaseSetupNotice } from "@/components/app/SupabaseSetupNotice";
import { AccountActions } from "@/components/app/AccountActions";
import { PricingCards } from "@/components/app/PricingCards";
import { OrgMembers, type InviteEntry, type MemberEntry } from "@/components/app/OrgMembers";
import { OrgBranding } from "@/components/app/OrgBranding";
import { OrgCalibration } from "@/components/app/OrgCalibration";
import { DataControls } from "@/components/app/DataControls";
import { syncSeatBilling } from "@/lib/supabase/seatBilling";
import { TIERS } from "@/lib/plans";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { getDictionary } from "@/i18n/getDictionary";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";

export default async function ComptePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  if (!isSupabaseConfigured) return <SupabaseSetupNotice />;
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  const { common: t, auth: authDict } = getDictionary(lang);
  const ct = authDict.compte;
  const { checkout } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/connexion?next=/${lang}/compte`);

  const org = await getUserOrg(supabase, user.id);
  if (!org) redirect(`/${lang}/connexion?next=/${lang}/compte`);

  if (org.role === "owner") await syncSeatBilling(org.organizationId);

  const { data: memberRows } = await supabase
    .from("organization_members")
    .select("user_id, role")
    .eq("organization_id", org.organizationId);

  const members: MemberEntry[] = [];
  if (memberRows && isSupabaseAdminConfigured) {
    const admin = createAdminClient();
    for (const row of memberRows as { user_id: string; role: "owner" | "member" }[]) {
      const { data } = await admin.auth.admin.getUserById(row.user_id);
      members.push({ userId: row.user_id, role: row.role, email: data.user?.email ?? row.user_id });
    }
  }
  members.sort((a, b) => (a.role === b.role ? 0 : a.role === "owner" ? -1 : 1));

  let invites: InviteEntry[] = [];
  if (org.role === "owner") {
    const { data: inviteRows } = await supabase
      .from("organization_invites")
      .select("id, email")
      .eq("organization_id", org.organizationId)
      .is("accepted_at", null);
    invites = (inviteRows ?? []) as InviteEntry[];
  }

  const tier = TIERS[org.plan];

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-line bg-white/90 backdrop-blur-md px-4 sm:px-8">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-10 lg:px-14 py-3.5 flex items-center justify-between">
          <LocaleLink href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-ink flex items-center justify-center">
              <Gauge size={18} color="var(--color-accent-soft)" />
            </div>
            <span className="font-display text-[16px] font-extrabold tracking-[0.01em] text-ink">VerdiktNow</span>
          </LocaleLink>
          <div className="flex items-center gap-4">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <LocaleLink href="/processus" className="text-[13px] text-ink-soft hover:text-ink transition-colors">
              {t.appHeader.myPortfolio}
            </LocaleLink>
            <form action={signOut}>
              <button className="flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink transition-colors">
                <LogOut size={14} /> {t.appHeader.logout}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto w-full px-5 sm:px-6 py-10 flex-1">
        <Eyebrow>{ct.orgEyebrow}</Eyebrow>
        <h1 className="font-display text-[28px] font-semibold text-ink mt-1.5 mb-8 tracking-[0.005em]">{org.orgName}</h1>

        {checkout === "success" && (
          <div className="mb-6 px-4 py-3 rounded-[12px] bg-teal/10 border border-teal/20 text-[13px] text-teal">
            {ct.checkoutSuccess}
          </div>
        )}
        {checkout === "cancelled" && (
          <div className="mb-6 px-4 py-3 rounded-[12px] bg-line-soft border border-line text-[13px] text-ink-soft">
            {ct.checkoutCancelled}
          </div>
        )}

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold"
                  style={{
                    background: org.plan === "free" ? "var(--color-line-soft)" : "var(--color-gold-soft)",
                    color: org.plan === "free" ? "var(--color-ink-faint)" : "var(--color-gold)",
                  }}
                >
                  {org.plan === "free" ? ct.noActivePlan : ct.tierBadge.replace("{tier}", tier.label)}
                </span>
              </div>
              {org.plan !== "free" && (
                <div className="text-[12.5px] text-ink-faint mt-2">
                  {org.aiQuota != null
                    ? ct.aiQuotaUsed.replace("{used}", String(org.aiUsedThisMonth)).replace("{quota}", String(org.aiQuota))
                    : ct.aiQuotaUnlimited.replace("{used}", String(org.aiUsedThisMonth))}
                </div>
              )}
            </div>
            {org.role === "owner" && (org.plan === "essentiel" || org.plan === "croissance") && <AccountActions />}
          </div>
        </Card>

        {/* Le rapport exemple n'est plus servi depuis `public/` : il ne sort que
            par /api/sample-report, qui refait le même contrôle de palier côté
            serveur. Cacher la carte ne protège donc rien à lui seul, mais évite
            de proposer à un compte sans forfait un lien qui lui répondrait 403. */}
        {org.plan !== "free" && (
          <Card className="p-6 mb-6">
            <Eyebrow className="mb-4">{ct.sampleReportEyebrow}</Eyebrow>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <span className="w-12 h-12 shrink-0 rounded-[12px] bg-accent-soft border border-accent/20 flex items-center justify-center">
                <FileText size={20} className="text-accent-deep" />
              </span>
              <p className="flex-1 text-[13.5px] text-ink-soft leading-relaxed">{ct.sampleReportText}</p>
              <a
                href="/api/sample-report"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-line bg-surface text-ink text-[13.5px] font-semibold hover:border-accent hover:text-accent transition"
              >
                <FileText size={15} /> {ct.sampleReportButton}
              </a>
            </div>
          </Card>
        )}

        <Card className="p-6 mb-6">
          <Eyebrow className="mb-4">{ct.tiersEyebrow}</Eyebrow>
          <PricingCards currentPlan={org.plan} isOwner={org.role === "owner"} />
        </Card>

        <Card className="p-6 mb-6">
          <Eyebrow className="mb-4">{ct.brandingEyebrow}</Eyebrow>
          <OrgBranding logoUrl={org.logoUrl} isOwner={org.role === "owner"} />
        </Card>

        <Card className="p-6 mb-6">
          <Eyebrow className="mb-4">{ct.calibrationEyebrow}</Eyebrow>
          <OrgCalibration
            hoursPerFte={org.hoursPerFte}
            magnitudeRef={org.magnitudeRef}
            priorityThreshold={org.priorityThreshold}
            isOwner={org.role === "owner"}
          />
        </Card>

        <Card className="p-6 mb-6">
          <Eyebrow className="mb-4">{ct.membersEyebrow}</Eyebrow>
          <OrgMembers members={members} invites={invites} isOwner={org.role === "owner"} currentUserId={user.id} />
        </Card>

        <Card className="p-6">
          <Eyebrow className="mb-4">{ct.dataEyebrow}</Eyebrow>
          <DataControls userEmail={user.email ?? ""} />
        </Card>
      </main>
    </div>
  );
}
