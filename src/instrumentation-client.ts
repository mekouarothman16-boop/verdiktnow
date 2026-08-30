import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Aucune trace de performance pour l'instant — seule la capture d'erreurs est activée,
  // pour rester sur le palier gratuit sans configuration supplémentaire.
  tracesSampleRate: 0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
