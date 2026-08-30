"use client";

import { Gauge } from "lucide-react";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { useDictionary } from "@/i18n/LocaleProvider";

export function Footer() {
  const { common: t } = useDictionary();

  const LEGAL_LINKS = [
    { href: "/apropos", label: t.footer.about },
    { href: "/aide", label: t.footer.help },
    { href: "/confidentialite", label: t.footer.privacy },
    { href: "/conditions", label: t.footer.terms },
  ];

  return (
    <footer className="border-t border-line">
      <div className="max-w-[1160px] mx-auto px-5 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-ink flex items-center justify-center">
            <Gauge size={14} color="var(--color-accent-soft)" />
          </div>
          <span className="font-display text-[14px] font-extrabold tracking-[0.01em] text-ink">VerdiktNow</span>
        </div>
        <nav className="flex items-center gap-5">
          {LEGAL_LINKS.map((l) => (
            <LocaleLink key={l.href} href={l.href} className="text-[12px] text-ink-faint hover:text-ink transition-colors">
              {l.label}
            </LocaleLink>
          ))}
        </nav>
        <span className="text-[12px] text-ink-faint">
          {t.footer.copyright.replace("{year}", String(new Date().getFullYear()))}
        </span>
      </div>
    </footer>
  );
}
