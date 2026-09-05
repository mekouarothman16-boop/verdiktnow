import Link from "next/link";
import { Bricolage_Grotesque, IBM_Plex_Sans } from "next/font/google";
import { getServerLocale } from "@/i18n/serverLocale";
import { getDictionary } from "@/i18n/getDictionary";
import { localizePath } from "@/i18n/localizePath";
import "./globals.css";

const sans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: "404",
};

/** Rendu pour toute URL ne correspondant à AUCUNE route (bypass complet du rendu normal, y
 * compris app/[lang]/layout.tsx) — sans accès aux params de route, la langue vient du cookie
 * NEXT_LOCALE comme dans les Server Actions (voir getServerLocale()). */
export default async function GlobalNotFound() {
  const lang = await getServerLocale();
  const { notFound: t } = getDictionary(lang).common;

  return (
    <html lang={lang} className={`${sans.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink font-sans">
        <main className="flex-1 flex flex-col items-center justify-center text-center px-5 py-24">
          <p className="font-display text-[13px] font-semibold tracking-[0.08em] text-accent uppercase mb-3">
            {t.eyebrow}
          </p>
          <h1 className="font-display text-[30px] sm:text-[36px] font-semibold tracking-[0.005em] text-ink mb-3">
            {t.title}
          </h1>
          <p className="text-ink-soft text-[15px] leading-relaxed max-w-[440px] mb-8">{t.description}</p>
          <Link
            href={localizePath("/", lang)}
            className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-accent-vivid text-ink text-[15px] font-semibold hover:brightness-95 transition shadow-card-lg"
          >
            {t.cta}
          </Link>
        </main>
      </body>
    </html>
  );
}
