"use client";

import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";

export type ActivityEntry = {
  id: string;
  actorEmail: string;
  action: string;
  detail: string | null;
  createdAt: string;
};

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  const locale = useLocale();
  const { activityFeed: t } = useDictionary().tool;

  const ACTION_LABELS: Record<string, (detail: string | null) => string> = {
    process_created: () => t.actionProcessCreated,
    process_saved: (d) => t.actionProcessSaved.replace("{detail}", d ?? t.fallbackProcessDetail),
    process_archived: (d) => t.actionProcessArchived.replace("{detail}", d ?? t.fallbackProcessDetail),
    process_unarchived: (d) => t.actionProcessUnarchived.replace("{detail}", d ?? t.fallbackProcessDetail),
    process_deleted: (d) => t.actionProcessDeleted.replace("{detail}", d ?? t.fallbackProcessDetail),
    process_duplicated: (d) => t.actionProcessDuplicated.replace("{detail}", d ?? t.fallbackCopyDetail),
    comment_added: () => t.actionCommentAdded,
    weight_profile_saved: (d) => t.actionWeightProfileSaved.replace("{detail}", d ?? ""),
    share_link_created: (d) => t.actionShareLinkCreated.replace("{detail}", d ?? t.fallbackProcessDetail),
    share_link_revoked: (d) => t.actionShareLinkRevoked.replace("{detail}", d ?? t.fallbackProcessDetail),
    member_invited: (d) => t.actionMemberInvited.replace("{detail}", d ?? t.fallbackMemberDetail),
    csv_import: (d) => t.actionCsvImport.replace("{detail}", d ?? t.fallbackCsvDetail),
    second_opinion_submitted: () => t.actionSecondOpinionSubmitted,
  };

  function describe(action: string, detail: string | null): string {
    return (ACTION_LABELS[action] ?? (() => t.actionFallback.replace("{action}", action)))(detail);
  }

  function relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const min = Math.round(diffMs / 60000);
    if (min < 1) return t.justNow;
    if (min < 60) return t.minutesAgo.replace("{n}", String(min));
    const h = Math.round(min / 60);
    if (h < 24) return t.hoursAgo.replace("{n}", String(h));
    const d = Math.round(h / 24);
    if (d < 30) return t.daysAgo.replace("{n}", String(d));
    return new Date(iso).toLocaleDateString(locale === "en" ? "en-CA" : "fr-CA");
  }

  if (entries.length === 0) return null;
  return (
    <Card className="p-5 mb-6">
      <Eyebrow className="mb-3">{t.eyebrow}</Eyebrow>
      <div className="grid gap-2.5">
        {entries.map((e) => (
          <div key={e.id} className="flex items-baseline gap-2 text-[12.5px] leading-snug">
            <span className="font-semibold text-ink shrink-0">{e.actorEmail}</span>
            <span className="text-ink-soft">{describe(e.action, e.detail)}</span>
            <span className="ml-auto font-mono text-[11px] text-ink-faint shrink-0 whitespace-nowrap">
              {relativeTime(e.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
