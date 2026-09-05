import { Eye, ShieldCheck, Layers, Languages } from "lucide-react";
import { ContentHeader } from "@/components/legal/ContentHeader";
import { Footer } from "@/components/landing/Footer";
import { Card } from "@/components/ui/Card";
import { getDictionary } from "@/i18n/getDictionary";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { buildLanguageAlternates } from "@/i18n/localizePath";
import type { Metadata } from "next";

const ICONS = [Eye, ShieldCheck, Layers, Languages];

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  return {
    title: getDictionary(lang).legal.apropos.metaTitle,
    alternates: { languages: buildLanguageAlternates("/apropos") },
  };
}

export default async function AProposPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  const { apropos: t } = getDictionary(lang).legal;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <ContentHeader />
      <main className="flex-1 max-w-[760px] mx-auto w-full px-5 sm:px-6 py-14">
        <h1 className="font-display text-[30px] sm:text-[36px] font-semibold tracking-[0.005em] text-ink mb-10">
          {t.title}
        </h1>

        <section className="mb-10">
          <h2 className="font-display text-[19px] font-semibold text-ink mb-2.5">{t.whoTitle}</h2>
          <p className="text-[14.5px] text-ink-soft leading-relaxed">{t.whoText}</p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-[19px] font-semibold text-ink mb-2.5">{t.missionTitle}</h2>
          <p className="text-[14.5px] text-ink-soft leading-relaxed">{t.missionText}</p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-[19px] font-semibold text-ink mb-4">{t.valuesTitle}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {t.values.map((v, i) => {
              const Icon = ICONS[i];
              return (
                <Card key={v.title} className="p-5">
                  <div className="w-9 h-9 rounded-[10px] bg-accent-soft flex items-center justify-center mb-3">
                    <Icon size={17} className="text-accent-deep" />
                  </div>
                  <div className="font-sans text-[14.5px] font-semibold text-ink mb-1.5">{v.title}</div>
                  <p className="text-[13px] text-ink-soft leading-relaxed">{v.text}</p>
                </Card>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-display text-[19px] font-semibold text-ink mb-2.5">{t.historyTitle}</h2>
          {t.historyParagraphs.map((p, i) => (
            <p key={i} className="text-[14.5px] text-ink-soft leading-relaxed mb-3 last:mb-0">
              {p}
            </p>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
