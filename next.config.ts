import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  experimental: {
    // Requis car app/[lang]/layout.tsx est le layout racine avec un segment dynamique en tête :
    // un simple app/[lang]/not-found.tsx ne capte pas les URL qui ne correspondent à AUCUNE route
    // (voir node_modules/next/dist/docs/.../not-found.md, section "Your root layout is defined
    // using top-level dynamic segments"). app/[lang]/not-found.tsx reste utile pour les notFound()
    // explicites à l'intérieur d'une route déjà résolue (ex. processus introuvable).
    globalNotFound: true,
  },
  // Les rapports exemple sont hors de `public/` pour qu'aucune adresse publique
  // n'y mène ; ils ne sortent que par /api/sample-report, après contrôle du
  // palier. Next ne peut pas deviner qu'un `readFile` en dépend, donc sans cette
  // déclaration les PDF resteraient hors du paquet de déploiement et la route
  // répondrait 404 en production tout en marchant en local.
  outputFileTracingIncludes: {
    "/api/sample-report": ["./private/reports/**/*"],
  },
};

// org/project/authToken sont optionnels : sans eux, le plugin de build saute simplement
// l'envoi des source maps (moins lisible en cas d'erreur), sans faire échouer la build.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
});
