"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useLocale } from "@/i18n/LocaleProvider";
import { localizePath } from "@/i18n/localizePath";

type LocaleLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

/** Comme next/link, mais préfixe automatiquement les chemins internes (commençant par "/") avec la langue active. */
export function LocaleLink({ href, ...props }: LocaleLinkProps) {
  const locale = useLocale();
  const localizedHref = href.startsWith("/") ? localizePath(href, locale) : href;
  return <Link href={localizedHref} {...props} />;
}
