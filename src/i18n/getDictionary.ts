import { lang } from "next/root-params";
import { isLocale, DEFAULT_LOCALE, type Locale } from "./config";
import { common as commonFr } from "./dictionaries/fr/common";
import { common as commonEn } from "./dictionaries/en/common";
import { landing as landingFr } from "./dictionaries/fr/landing";
import { landing as landingEn } from "./dictionaries/en/landing";
import { legal as legalFr } from "./dictionaries/fr/legal";
import { legal as legalEn } from "./dictionaries/en/legal";
import { auth as authFr } from "./dictionaries/fr/auth";
import { auth as authEn } from "./dictionaries/en/auth";
import { tool as toolFr } from "./dictionaries/fr/tool";
import { tool as toolEn } from "./dictionaries/en/tool";
import { pdf as pdfFr } from "./dictionaries/fr/pdf";
import { pdf as pdfEn } from "./dictionaries/en/pdf";
import { errors as errorsFr } from "./dictionaries/fr/errors";
import { errors as errorsEn } from "./dictionaries/en/errors";

const dictionaries = {
  fr: { common: commonFr, landing: landingFr, legal: legalFr, auth: authFr, tool: toolFr, pdf: pdfFr, errors: errorsFr },
  en: { common: commonEn, landing: landingEn, legal: legalEn, auth: authEn, tool: toolEn, pdf: pdfEn, errors: errorsEn },
} satisfies Record<
  Locale,
  { common: typeof commonFr; landing: typeof landingFr; legal: typeof legalFr; auth: typeof authFr; tool: typeof toolFr; pdf: typeof pdfFr; errors: typeof errorsFr }
>;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Pour les Server Components/utilitaires profonds qui ne veulent pas recevoir `lang` en prop —
 * indisponible dans les Client Components, Server Actions et Route Handlers (utiliser
 * getDictionary(locale) là où la langue est déjà connue autrement, ex. via un cookie). */
export async function getServerDictionary(): Promise<Dictionary> {
  const locale = await getRootParamsLocale();
  return getDictionary(locale);
}

/** Résout la locale courante via `next/root-params` — pour les Server Components qui ont besoin
 * de la locale brute (ex. locale-aware data helpers), en plus du dictionnaire de getServerDictionary().
 * Pas le même mécanisme que getServerLocale() de serverLocale.ts (cookie-based, pour Server Actions). */
export async function getRootParamsLocale(): Promise<Locale> {
  const locale = await lang();
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
}
