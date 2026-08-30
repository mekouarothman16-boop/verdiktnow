import { Mail } from "lucide-react";
import { ContentHeader } from "@/components/legal/ContentHeader";
import { Footer } from "@/components/landing/Footer";
import { Card } from "@/components/ui/Card";
import { ENTERPRISE_CONTACT_EMAIL } from "@/lib/plans";
import { getDictionary } from "@/i18n/getDictionary";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { buildLanguageAlternates } from "@/i18n/localizePath";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  return {
    title: getDictionary(lang).legal.aide.metaTitle,
    alternates: { languages: buildLanguageAlternates("/aide") },
  };
}

export default async function AidePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  const { aide: t } = getDictionary(lang).legal;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <ContentHeader />
      <main className="flex-1 max-w-[760px] mx-auto w-full px-5 sm:px-6 py-14">
        <h1 className="font-display text-[30px] sm:text-[36px] font-extrabold tracking-[-0.015em] text-ink mb-2">
          {t.title}
        </h1>
        <p className="text-ink-soft text-[15px] leading-relaxed mb-9">{t.subtitle}</p>

        <div className="grid gap-2.5 mb-10">
          {t.faq.map((item, i) => (
            <details key={i} className="group rounded-[10px] border border-line bg-surface overflow-hidden">
              <summary className="cursor-pointer list-none px-4.5 py-3.5 font-sans text-[14px] font-semibold text-ink flex items-center justify-between gap-3">
                {item.q}
                <span className="text-ink-faint group-open:rotate-180 transition-transform shrink-0">⌄</span>
              </summary>
              <p className="px-4.5 pb-4 text-[13.5px] text-ink-soft leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>

        <Card className="p-6 flex items-start gap-4">
          <div className="w-10 h-10 shrink-0 rounded-[9px] bg-accent-soft flex items-center justify-center">
            <Mail size={18} className="text-accent-deep" />
          </div>
          <div>
            <div className="font-sans text-[15px] font-semibold text-ink mb-1">{t.needHelp}</div>
            <p className="text-[13.5px] text-ink-soft leading-relaxed mb-2">{t.needHelpText}</p>
            <a href={`mailto:${ENTERPRISE_CONTACT_EMAIL}`} className="text-[13.5px] font-semibold text-accent hover:underline">
              {ENTERPRISE_CONTACT_EMAIL}
            </a>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
