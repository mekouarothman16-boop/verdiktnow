import { LOCALES, type Locale, isLocale } from "./config";

/** Sépare un préfixe de langue d'un chemin, s'il y en a un. */
export function stripLocale(pathname: string): { locale: Locale | null; path: string } {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  if (maybeLocale && isLocale(maybeLocale)) {
    const rest = "/" + segments.slice(2).join("/");
    return { locale: maybeLocale, path: rest === "/" ? "/" : rest.replace(/\/+$/, "") || "/" };
  }
  return { locale: null, path: pathname };
}

/** Préfixe un chemin logique (sans langue) avec la langue donnée, en remplaçant tout préfixe existant. */
export function localizePath(pathname: string, locale: Locale): string {
  const { path } = stripLocale(pathname);
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

export function pathnameHasLocale(pathname: string): boolean {
  const first = pathname.split("/")[1];
  return !!first && isLocale(first);
}

/** Construit `alternates.languages` (hreflang) pour un chemin logique donné (sans préfixe de langue). */
export function buildLanguageAlternates(logicalPath: string): Record<Locale, string> {
  return Object.fromEntries(LOCALES.map((l) => [l, localizePath(logicalPath, l)])) as Record<Locale, string>;
}

export { LOCALES };
