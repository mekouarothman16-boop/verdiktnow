import { KeyRound } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { verifyLoginCode, resendLoginCode } from "@/lib/supabase/actions";
import { getDictionary } from "@/i18n/getDictionary";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { redirect } from "next/navigation";

export default async function LoginCodePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ email?: string; error?: string; message?: string }>;
}) {
  const { email, error, message } = await searchParams;
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;
  const { loginCode: t } = getDictionary(lang).auth;

  // Sans courriel en contexte (accès direct à l'URL), impossible de vérifier un code —
  // retour à l'étape 1 plutôt qu'un formulaire cassé.
  if (!email) redirect(`/${lang}/connexion`);

  return (
    <AuthCard
      eyebrow={t.eyebrow}
      title={t.title}
      sub={t.sub.replace("{email}", email)}
      error={error}
      message={message}
      footer={
        <LocaleLink href="/connexion" className="text-accent font-semibold hover:underline">
          {t.backToLogin}
        </LocaleLink>
      }
    >
      <form action={verifyLoginCode} className="grid gap-4">
        <input type="hidden" name="email" value={email} />
        <label className="block">
          <span className="text-[12.5px] text-ink-soft block mb-1.5">{t.codeLabel}</span>
          <input
            type="text"
            name="code"
            required
            autoComplete="one-time-code"
            inputMode="numeric"
            placeholder={t.codePlaceholder}
            autoFocus
            className="w-full border border-line rounded-[12px] px-3 py-2.5 font-mono text-lg tracking-[0.3em] text-ink outline-none bg-surface focus:border-accent transition-colors text-center"
          />
        </label>
        <button
          type="submit"
          className="mt-1 flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-accent-vivid text-ink text-[14px] font-semibold hover:brightness-95 transition"
        >
          <KeyRound size={15} /> {t.submit}
        </button>
      </form>
      <form action={resendLoginCode} className="mt-3.5 text-center">
        <input type="hidden" name="email" value={email} />
        <button type="submit" className="text-[12.5px] text-ink-soft hover:text-ink hover:underline transition-colors">
          {t.resendLink}
        </button>
      </form>
    </AuthCard>
  );
}
