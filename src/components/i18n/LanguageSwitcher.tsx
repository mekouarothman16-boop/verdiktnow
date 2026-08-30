"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LOCALES } from "@/i18n/config";
import { useLocale, useDictionary } from "@/i18n/LocaleProvider";
import { localizePath } from "@/i18n/localizePath";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const dict = useDictionary();
  const pathname = usePathname();
  // Lu après le montage plutôt que via useSearchParams() pour éviter d'exiger une
  // frontière Suspense sur chaque page qui affiche le sélecteur.
  const [query, setQuery] = useState("");
  useEffect(() => {
    setQuery(window.location.search.replace(/^\?/, ""));
  }, [pathname]);

  return (
    <div className={`inline-flex items-center rounded-full border border-line bg-surface p-0.5 ${className}`}>
      {LOCALES.map((l) => {
        const active = l === locale;
        const href = `${localizePath(pathname, l)}${query ? `?${query}` : ""}`;
        return (
          <Link
            key={l}
            href={href}
            onClick={() => {
              document.cookie = `NEXT_LOCALE=${l};path=/;max-age=${60 * 60 * 24 * 365}`;
            }}
            aria-current={active ? "true" : undefined}
            className={
              active
                ? "px-2.5 py-1 rounded-full bg-ink text-white font-mono text-[11px] font-semibold uppercase tracking-[0.04em]"
                : "px-2.5 py-1 rounded-full text-ink-faint font-mono text-[11px] font-semibold uppercase tracking-[0.04em] hover:text-ink transition-colors"
            }
          >
            {l}
          </Link>
        );
      })}
      <span className="sr-only">{dict.common.language.fr} / {dict.common.language.en}</span>
    </div>
  );
}
