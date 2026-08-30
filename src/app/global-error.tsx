"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/** Dernier filet quand app/[lang]/layout.tsx lui-même plante — même raison que
 * global-not-found.tsx (segment dynamique en tête de layout racine). Volontairement sans
 * dépendance au pipeline Tailwind/polices : c'est le seul écran qui doit rester lisible même
 * si le reste de l'app est cassé. Bilingue en dur, faute de pouvoir résoudre la locale ici
 * (obligatoirement un Client Component, sans accès au cookie NEXT_LOCALE côté serveur). */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ margin: 0, background: "#e9ecea", color: "#091315", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "24px",
          }}
        >
          <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
            Une erreur est survenue — Something went wrong
          </h1>
          <p style={{ fontSize: "14px", color: "#6d7373", maxWidth: "420px", marginBottom: "24px" }}>
            Réessayez, ou revenez à l&apos;accueil si le problème persiste.
            <br />
            Try again, or return home if the problem persists.
          </p>
          <button
            onClick={() => retry()}
            style={{
              background: "#d7ff53",
              color: "#091315",
              border: "none",
              borderRadius: "9999px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Réessayer — Try again
          </button>
        </div>
      </body>
    </html>
  );
}
