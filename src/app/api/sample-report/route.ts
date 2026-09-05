import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient, getUserOrg } from "@/lib/supabase/server";
import { getServerLocale } from "@/i18n/serverLocale";
import { getDictionary } from "@/i18n/getDictionary";

// Rapport exemple, réservé aux abonnés.
//
// Les deux PDF vivaient dans `public/`, donc servis en clair par Next à qui
// connaissait l'adresse, sans aucun moyen d'y attacher une vérification. Ils
// sont maintenant dans `private/reports/`, hors du dossier servi, et ne sortent
// que par cette route après contrôle de la session et du palier.
//
// Le fichier n'est pas atteint par une valeur venue de la requête : la langue
// choisit entre deux chemins écrits en dur. Aucune traversée de répertoire n'est
// possible même si le paramètre est manipulé.
//
// `private/reports` doit rester déclaré dans `outputFileTracingIncludes`
// (next.config.ts), sinon les PDF ne partent pas dans le paquet de déploiement
// et la route répond 500 en production alors qu'elle marche en local.

const FILES = {
  fr: "exemple-rapport-verdiktnow.pdf",
  en: "example-report-verdiktnow.pdf",
} as const;

export async function GET() {
  const locale = await getServerLocale();
  const t = getDictionary(locale).errors.api.report;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const org = await getUserOrg(supabase, user?.id);
  if (!org || org.plan === "free") {
    return NextResponse.json({ error: t.paidTierRequired }, { status: 403 });
  }

  const filename = FILES[locale];
  let file: Buffer;
  try {
    file = await readFile(path.join(process.cwd(), "private", "reports", filename));
  } catch {
    // Ne devrait arriver que si le fichier a disparu du paquet de déploiement,
    // typiquement une déclaration outputFileTracingIncludes oubliée. Le message
    // de palier serait trompeur ici : l'abonné est bien autorisé.
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      // Sans `private`, un CDN pourrait mettre en cache la réponse servie à un
      // abonné et la rendre ensuite à n'importe qui : la garde deviendrait
      // décorative.
      "Cache-Control": "private, no-store",
    },
  });
}
