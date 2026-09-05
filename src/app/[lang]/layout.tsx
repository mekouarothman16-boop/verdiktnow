import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import { LOCALES, isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { getDictionary } from "@/i18n/getDictionary";
import { buildLanguageAlternates } from "@/i18n/localizePath";
import "../globals.css";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const mono = Inter({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// Le proxy laisse passer les adresses à extension statique (.pdf, .png, .svg…)
// pour que les vrais fichiers de `public/` soient servis sans détour. Mais une
// adresse comme /rapport-inexistant.pdf tombait alors sur ce segment, était
// prise pour une langue, et rendait la page d'accueil avec un code 200 : un
// faux 404 qui trompe autant les moteurs de recherche que le visiteur.
//
// Avec dynamicParams à false, toute valeur absente de generateStaticParams,
// donc toute valeur autre que fr et en, répond 404 au niveau du routage. On ne
// peut pas obtenir le même résultat en appelant notFound() ici : ce layout est
// le layout racine, celui-là même dans lequel la page d'erreur devrait se
// rendre.
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  const { home } = getDictionary(lang).landing;

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: home.title,
    description: home.description,
    alternates: {
      languages: buildLanguageAlternates("/"),
    },
  } satisfies Metadata & { lang?: string };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  const dict = getDictionary(lang);

  return (
    <html lang={lang} className={`${sans.variable} ${display.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink font-sans">
        <LocaleProvider locale={lang} dict={dict}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
