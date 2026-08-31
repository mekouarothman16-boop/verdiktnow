"use client";

import { useState } from "react";
import { Gauge, Menu, X, ArrowRight } from "lucide-react";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useDictionary } from "@/i18n/LocaleProvider";

export function LandingNav({ loggedIn = false }: { loggedIn?: boolean }) {
  const { common: t } = useDictionary();
  const [open, setOpen] = useState(false);

  const LINKS = [
    { href: "#comment-ca-marche", label: t.nav.howItWorks },
    { href: "#fonctionnalites", label: t.nav.features },
    { href: "#tarifs", label: t.nav.pricing },
    { href: "#faq", label: t.nav.faq },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur-md backdrop-saturate-150">
      <div className="max-w-[1160px] mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
        <LocaleLink href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-ink flex items-center justify-center">
            <Gauge size={17} color="var(--color-accent-soft)" />
          </div>
          <span className="font-display text-[16px] font-extrabold tracking-[0.01em] text-ink">VerdiktNow</span>
        </LocaleLink>

        <nav className="hidden md:flex items-center gap-7">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-[13.5px] font-medium text-ink-soft hover:text-ink transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          {!loggedIn && (
            <LocaleLink href="/connexion" className="text-[13.5px] font-medium text-ink-soft hover:text-ink transition-colors">
              {t.nav.login}
            </LocaleLink>
          )}
          {loggedIn ? (
            <LocaleLink
              href="/processus"
              className="group flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-accent-vivid text-ink text-[13.5px] font-semibold hover:brightness-95 transition"
            >
              {t.nav.myPortfolio} <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </LocaleLink>
          ) : (
            <a
              href="#tarifs"
              className="group flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-accent-vivid text-ink text-[13.5px] font-semibold hover:brightness-95 transition"
            >
              {t.nav.seePricing} <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          )}
        </div>

        <button
          aria-label="Ouvrir le menu"
          onClick={() => setOpen((o) => !o)}
          className="md:hidden p-2 -mr-2 text-ink"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-line bg-white px-5 py-4 flex flex-col gap-1">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-2 py-3 text-[14.5px] font-medium text-ink-soft border-b border-line-soft"
            >
              {l.label}
            </a>
          ))}
          <div className="py-3 border-b border-line-soft">
            <LanguageSwitcher />
          </div>
          {!loggedIn && (
            <LocaleLink
              href="/connexion"
              onClick={() => setOpen(false)}
              className="px-2 py-3 text-[14.5px] font-medium text-ink-soft border-b border-line-soft"
            >
              {t.nav.login}
            </LocaleLink>
          )}
          {loggedIn ? (
            <LocaleLink
              href="/processus"
              className="mt-3 flex items-center justify-center gap-1.5 px-4 py-3 rounded-full bg-accent-vivid text-ink text-[14px] font-semibold"
            >
              {t.nav.myPortfolio} <ArrowRight size={14} />
            </LocaleLink>
          ) : (
            <a
              href="#tarifs"
              onClick={() => setOpen(false)}
              className="mt-3 flex items-center justify-center gap-1.5 px-4 py-3 rounded-full bg-accent-vivid text-ink text-[14px] font-semibold"
            >
              {t.nav.seePricing} <ArrowRight size={14} />
            </a>
          )}
        </div>
      )}
    </header>
  );
}
