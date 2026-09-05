"use client";

import { LocaleLink } from "@/components/i18n/LocaleLink";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatSeatPrice, getPerUserLabel, getTiers } from "@/lib/plans";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";

export function ProGate({
  loggedIn,
  title,
  description,
}: {
  loggedIn: boolean;
  title: string;
  description: string;
}) {
  const locale = useLocale();
  const { proGate: t } = useDictionary().tool;
  const tiers = getTiers(locale);
  return (
    <Card className="p-10 text-center max-w-[560px] mx-auto">
      <div className="w-11 h-11 rounded-full bg-gold-soft flex items-center justify-center mx-auto mb-4">
        <Lock size={18} className="text-gold" />
      </div>
      <div className="font-mono text-[10px] font-semibold tracking-[0.08em] text-gold uppercase mb-2">
        {t.badge}
      </div>
      <h2 className="font-sans text-[20px] font-bold text-ink mb-2.5 tracking-[-0.01em]">{title}</h2>
      <p className="text-[13.5px] text-ink-soft leading-relaxed mb-6">{description}</p>

      <LocaleLink
        href={loggedIn ? "/compte" : "/connexion?next=/compte"}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent-vivid text-ink text-[13.5px] font-semibold hover:brightness-95 transition"
      >
        {loggedIn
          ? t.viewTiersFrom.replace("{price}", formatSeatPrice(tiers.essentiel.priceMonthly ?? 0, "monthly", locale, getPerUserLabel(locale)))
          : t.loginToViewTiers}
      </LocaleLink>
    </Card>
  );
}
