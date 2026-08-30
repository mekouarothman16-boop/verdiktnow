"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getServerLocale } from "@/i18n/serverLocale";
import { getDictionary } from "@/i18n/getDictionary";

/**
 * Client Supabase "jetable" : mêmes clés que le client normal, mais sans adaptateur de cookies
 * (@supabase/supabase-js brut, pas @supabase/ssr) — toute session qu'il ouvre reste en mémoire
 * de cet appel de fonction, jamais écrite dans le navigateur. Sert uniquement à vérifier un mot
 * de passe ou déclencher l'envoi d'un code sans jamais établir la vraie session avant l'étape 2.
 */
function createThrowawayClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Étape 1/2 de la connexion : vérifie le mot de passe sans jamais poser de session, puis
 * déclenche l'envoi par courriel du code à usage unique de Supabase (mécanisme natif
 * d'authentification sans mot de passe, réutilisé ici comme second facteur — Supabase ne
 * propose pas de "code courriel" comme facteur MFA autonome, seulement le TOTP). L'étape 2
 * (verifyLoginCode) est celle qui pose réellement la session.
 */
export async function requestLoginCode(formData: FormData) {
  const locale = await getServerLocale();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const throwaway = createThrowawayClient();

  const { error: passwordError } = await throwaway.auth.signInWithPassword({ email, password });
  if (passwordError) {
    redirect(`/${locale}/connexion?error=${encodeURIComponent(passwordError.message)}`);
  }
  // Le mot de passe est confirmé ; cette session jetable ne sert plus à rien, autant la révoquer
  // plutôt que de laisser une paire de jetons valide inutilisée.
  await throwaway.auth.signOut();

  const { error: otpError } = await throwaway.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (otpError) {
    redirect(`/${locale}/connexion?error=${encodeURIComponent(otpError.message)}`);
  }

  redirect(`/${locale}/connexion/code?email=${encodeURIComponent(email)}`);
}

/** Étape 2/2 : le code saisi est vérifié avec le vrai client (cookies), donc c'est cet appel,
 * et lui seul, qui établit la session pour de vrai. */
export async function verifyLoginCode(formData: FormData) {
  const locale = await getServerLocale();
  const email = String(formData.get("email") || "");
  const code = String(formData.get("code") || "").trim();
  const t = getDictionary(locale).auth.loginCode;
  const supabase = await createClient();

  if (!code) {
    redirect(`/${locale}/connexion/code?email=${encodeURIComponent(email)}&error=${encodeURIComponent(t.codeRequired)}`);
  }

  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  if (error) {
    redirect(`/${locale}/connexion/code?email=${encodeURIComponent(email)}&error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/${locale}/processus`);
}

/** Renvoie un nouveau code sans redemander le mot de passe — atteindre cette page suffit à
 * prouver que l'étape 1 a déjà réussi pour ce courriel durant cette tentative de connexion. */
export async function resendLoginCode(formData: FormData) {
  const locale = await getServerLocale();
  const email = String(formData.get("email") || "");
  const t = getDictionary(locale).auth.loginCode;
  const throwaway = createThrowawayClient();

  const { error } = await throwaway.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (error) {
    redirect(`/${locale}/connexion/code?email=${encodeURIComponent(email)}&error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/${locale}/connexion/code?email=${encodeURIComponent(email)}&message=${encodeURIComponent(t.resendSent)}`);
}

export async function signUp(formData: FormData) {
  const locale = await getServerLocale();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    redirect(`/${locale}/inscription?error=${encodeURIComponent(error.message)}`);
  }
  const { confirmEmailMessage } = getDictionary(locale).auth.inscription;
  redirect(`/${locale}/inscription?message=${encodeURIComponent(confirmEmailMessage)}`);
}

export async function signOut() {
  const locale = await getServerLocale();
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}
