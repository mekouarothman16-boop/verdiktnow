import "server-only";

export const isEmailConfigured = !!process.env.RESEND_API_KEY;

/** Même expéditeur que le SMTP Supabase déjà configuré (Resend) — tant qu'aucun domaine n'est
 * vérifié, `onboarding@resend.dev` ne livre qu'à l'adresse du compte Resend lui-même. */
const FROM = "VerdiktNow <onboarding@resend.dev>";

/** Appel direct à l'API Resend plutôt que le mailer Supabase Auth : ce dernier ne sert que les
 * flux d'authentification (OTP, invitation), pas un courriel transactionnel arbitraire. N'appelle
 * jamais côté client (server-only) — ne lance jamais d'exception, même convention défensive que
 * le reste du code serveur (voir seatBilling.ts, roadmapActions.ts). */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean }> {
  if (!isEmailConfigured) return { ok: false };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
