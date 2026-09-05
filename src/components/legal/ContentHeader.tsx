"use client";

import { LocaleLink } from "@/components/i18n/LocaleLink";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useDictionary } from "@/i18n/LocaleProvider";
import { Gauge, ArrowLeft } from "lucide-react";

export function ContentHeader() {
  const { legal: t } = useDictionary();
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur-md px-4 sm:px-8 backdrop-saturate-150">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-10 lg:px-14 h-16 flex items-center justify-between">
        <LocaleLink href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-ink flex items-center justify-center">
            <Gauge size={17} color="var(--color-accent-soft)" />
          </div>
          <span className="font-display text-[16px] font-extrabold tracking-[0.01em] text-ink">VerdiktNow</span>
        </LocaleLink>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <LocaleLink href="/" className="flex items-center gap-1.5 text-[13.5px] font-medium text-ink-soft hover:text-ink transition-colors">
            <ArrowLeft size={15} /> {t.contentHeader.backHome}
          </LocaleLink>
        </div>
      </div>
    </header>
  );
}
