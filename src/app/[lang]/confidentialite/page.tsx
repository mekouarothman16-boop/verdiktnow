import { ContentHeader } from "@/components/legal/ContentHeader";
import { Footer } from "@/components/landing/Footer";
import { ENTERPRISE_CONTACT_EMAIL } from "@/lib/plans";
import { getDictionary } from "@/i18n/getDictionary";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { buildLanguageAlternates } from "@/i18n/localizePath";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  return {
    title: getDictionary(lang).legal.confidentialite.metaTitle,
    alternates: { languages: buildLanguageAlternates("/confidentialite") },
  };
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-[20px] font-bold text-ink mt-9 mb-3">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[14.5px] text-ink-soft leading-relaxed mb-3">{children}</p>;
}
function Li({ children }: { children: React.ReactNode }) {
  return <li className="text-[14.5px] text-ink-soft leading-relaxed mb-1.5">{children}</li>;
}
function Ul({ items }: { items?: readonly string[] }) {
  if (!items) return null;
  return (
    <ul className="list-disc pl-5 mb-3">
      {items.map((item) => (
        <Li key={item}>{item}</Li>
      ))}
    </ul>
  );
}
function EmailLink() {
  return (
    <a href={`mailto:${ENTERPRISE_CONTACT_EMAIL}`} className="text-accent hover:underline">
      {ENTERPRISE_CONTACT_EMAIL}
    </a>
  );
}

export default async function ConfidentialitePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  const { confidentialite: t } = getDictionary(lang).legal;
  const [s1, s2, s3, s4, s5, s6, s7, s8] = t.sections;
  const dateLocale = lang === "en" ? "en-CA" : "fr-CA";

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <ContentHeader />
      <main className="flex-1 max-w-[760px] mx-auto w-full px-5 sm:px-6 py-14">
        <h1 className="font-display text-[30px] sm:text-[36px] font-extrabold tracking-[-0.015em] text-ink mb-2">
          {t.title}
        </h1>
        <p className="text-[13px] text-ink-faint mb-6">
          {t.lastUpdated} {new Date().toLocaleDateString(dateLocale, { dateStyle: "long" })}
        </p>

        <div className="px-4.5 py-3.5 rounded-lg border border-amber/25 bg-amber/10 text-[12.5px] text-ink-soft leading-relaxed mb-8">
          {t.notice}
        </div>

        <P>{t.intro}</P>

        <H2>{s1.h2}</H2>
        {"items" in s1 && <Ul items={s1.items} />}

        <H2>{s2.h2}</H2>
        {"p" in s2 && <P>{s2.p}</P>}

        <H2>{s3.h2}</H2>
        {"p" in s3 && <P>{s3.p}</P>}
        {"items" in s3 && <Ul items={s3.items} />}
        {"p2" in s3 && <P>{s3.p2}</P>}

        <H2>{s4.h2}</H2>
        {"p" in s4 && <P>{s4.p}</P>}

        <H2>{s5.h2}</H2>
        {"p" in s5 && <P>{s5.p}</P>}

        <H2>{s6.h2}</H2>
        {"p" in s6 && <P>{s6.p}</P>}
        {"items" in s6 && <Ul items={s6.items} />}
        {"p2" in s6 && (
          <P>
            {s6.p2} <EmailLink />.
          </P>
        )}

        <H2>{s7.h2}</H2>
        {"p" in s7 && <P>{s7.p}</P>}

        <H2>{s8.h2}</H2>
        {"p" in s8 && (
          <P>
            {s8.p} <EmailLink />.
          </P>
        )}
      </main>
      <Footer />
    </div>
  );
}
