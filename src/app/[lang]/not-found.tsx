import Link from "next/link";
import { ContentHeader } from "@/components/legal/ContentHeader";
import { Footer } from "@/components/landing/Footer";
import { getDictionary, getRootParamsLocale } from "@/i18n/getDictionary";
import { localizePath } from "@/i18n/localizePath";

export default async function NotFound() {
  const lang = await getRootParamsLocale();
  const { notFound: t } = getDictionary(lang).common;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <ContentHeader />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-5 py-24">
        <p className="font-display text-[13px] font-semibold tracking-[0.08em] text-accent uppercase mb-3">{t.eyebrow}</p>
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
      <Footer />
    </div>
  );
}
