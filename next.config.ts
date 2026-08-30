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
};

// org/project/authToken sont optionnels : sans eux, le plugin de build saute simplement
// l'envoi des source maps (moins lisible en cas d'erreur), sans faire échouer la build.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
});
