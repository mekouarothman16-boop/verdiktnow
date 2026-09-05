import { UserPlus } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { signUp } from "@/lib/supabase/actions";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { getDictionary } from "@/i18n/getDictionary";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";

export default async function InscriptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  const { inscription: t } = getDictionary(lang).auth;
  return (
    <AuthCard
      eyebrow={t.eyebrow}
      title={t.title}
      sub={t.sub}
      error={error}
      message={message}
      footer={
        <>
          {t.hasAccount}{" "}
          <LocaleLink href="/connexion" className="text-accent font-semibold hover:underline">
            {t.login}
          </LocaleLink>
        </>
      }
    >
      <form action={signUp} className="grid gap-4">
        <label className="block">
          <span className="text-[12.5px] text-ink-soft block mb-1.5">{t.emailLabel}</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="w-full border border-line rounded-[12px] px-3 py-2.5 font-sans text-sm text-ink outline-none bg-surface focus:border-accent transition-colors"
          />
        </label>
        <label className="block">
          <span className="text-[12.5px] text-ink-soft block mb-1.5">{t.passwordLabel}</span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full border border-line rounded-[12px] px-3 py-2.5 font-sans text-sm text-ink outline-none bg-surface focus:border-accent transition-colors"
          />
          <span className="text-[11px] text-ink-faint block mt-1.5">{t.passwordHint}</span>
        </label>
        <button
          type="submit"
          className="mt-1 flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-accent-vivid text-ink text-[14px] font-semibold hover:brightness-95 transition"
        >
          <UserPlus size={15} /> {t.submit}
        </button>
      </form>
    </AuthCard>
  );
}
