import type { Currency } from "@/lib/scoring";
import { CURRENCIES } from "@/lib/scoring";
import type { Locale } from "@/i18n/config";

/** Le format des nombres suit la langue d'affichage, pas la devise facturée — un utilisateur en
 * français voit toujours « 1 234,56 $ » même si son organisation facture en USD. `locale` pilote
 * donc le format ("fr-CA"/"en-CA"), `currency` ne fournit que le symbole. */
export function money(n: number, currency: Currency, locale: Locale = "fr") {
  const c = CURRENCIES[currency];
  const fmtLocale = locale === "en" ? "en-CA" : "fr-CA";
  return new Intl.NumberFormat(fmtLocale, { maximumFractionDigits: 0 }).format(Math.round(n)) + " " + c.symbol;
}

export function num(n: number, d = 0, locale: Locale = "fr") {
  const fmtLocale = locale === "en" ? "en-CA" : "fr-CA";
  return new Intl.NumberFormat(fmtLocale, { maximumFractionDigits: d }).format(n);
}

/** Reduit la taille d'une valeur de statistique quand le texte est trop long pour tenir sur une ligne. */
export function statFontSize(text: string, base: number): number {
  if (text.length > 12) return base * 0.68;
  if (text.length > 9) return base * 0.8;
  return base;
}

/** Tronque un texte destine a une case de taille fixe (ex. schema de flux), pour eviter qu'un
 * champ concu pour une courte liste (systemes, outils) ne fasse exploser la hauteur de sa case
 * si l'utilisateur y a plutot ecrit un paragraphe. */
export function truncate(text: string, max: number): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}...` : t;
}

/** Tronque une valeur destinee a une cellule de tableau compact (RACI, registre de risques) - ces
 * colonnes proviennent de champs libres (porteur, intervenants) qui peuvent etre longs en usage reel. */
export function truncateCell(text: string, max = 60): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}...` : t;
}

/** Retire les caracteres hors du jeu de glyphes couvert par les polices du rapport (Inter, JetBrains
 * Mono - latin etendu uniquement). Un glyphe manquant (emoji, CJK, arabe, cyrillique) n'a pas de largeur
 * mesurable pour le moteur PDF, ce qui decale et superpose tout le texte qui suit sur la meme ligne.
 * Comparaison par point de code (pas de regex) pour eviter toute ambiguite d'encodage sur les plages unicode. */
export function sanitizeText(text: string): string {
  let out = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    const isTabOrNewline = cp === 9 || cp === 10 || cp === 13;
    const isLatin = cp >= 0x20 && cp <= 0x24f; // latin de base + latin-1 supplement + latin etendu A/B
    const isGeneralPunctuation = cp >= 0x2000 && cp <= 0x206f; // tirets, guillemets courbes, points de suspension
    const isCurrencySymbol = cp >= 0x20a0 && cp <= 0x20cf; // $, EUR, etc.
    if (isTabOrNewline || isLatin || isGeneralPunctuation || isCurrencySymbol) out += ch;
  }
  // Un glyphe retiré laisse un espace orphelin de chaque côté (ex. "mot 🚀 mot" -> "mot  mot") ; on les fusionne.
  return out.replace(/ {2,}/g, " ").trim();
}
