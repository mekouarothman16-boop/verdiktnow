"use client";

import { Gauge } from "lucide-react";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { useDictionary } from "@/i18n/LocaleProvider";
import { GUTTER, INSET, SHELL } from "./layout";

export function Footer() {
  const { common: t } = useDictionary();

  const LEGAL_LINKS = [
    { href: "/apropos", label: t.footer.about },
    { href: "/aide", label: t.footer.help },
    { href: "/confidentialite", label: t.footer.privacy },
    { href: "/conditions", label: t.footer.terms },
  ];

  return (
    <footer className={`border-t border-line ${GUTTER}`}>
      <div className={`${SHELL} ${INSET} py-10 flex flex-col sm:flex-row items-center justify-between gap-5`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-ink flex items-center justify-center shrink-0">
            <Gauge size={17} color="var(--color-accent-soft)" />
          </div>
          <span className="font-display text-[16px] font-extrabold tracking-[0.01em] text-ink">VerdiktNow</span>
        </div>
        <nav className="flex items-center gap-5">
          {LEGAL_LINKS.map((l) => (
            <LocaleLink key={l.href} href={l.href} className="text-[13px] text-ink-faint hover:text-ink transition-colors">
              {l.label}
            </LocaleLink>
          ))}
        </nav>
        <span className="text-[13px] text-ink-faint">
          {t.footer.copyright.replace("{year}", String(new Date().getFullYear()))}
        </span>
      </div>
    </footer>
  );
}
