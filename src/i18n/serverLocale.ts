import "server-only";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "./config";

/** Lit la langue active depuis le cookie NEXT_LOCALE — pour les Server Actions et Route Handlers,
 * qui n'ont pas accès au segment [lang] de la route (contrairement aux Server Components). */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get("NEXT_LOCALE")?.value;
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}

/** revalidatePath ne connaît que le chemin exact rendu — comme chaque page existe sous les deux
 * préfixes de langue, on invalide les deux plutôt que de deviner laquelle était active. */
export function revalidateLocalizedPath(logicalPath: string) {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}${logicalPath}`);
  }
}
