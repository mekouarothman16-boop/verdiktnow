import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const LOCALE_COOKIE = "NEXT_LOCALE";

/** Verrou temporaire pré-lancement : protège les pages (jamais /api, exclu du matcher plus bas —
 * les webhooks Stripe et le cron n'ont aucun moyen de fournir un mot de passe) derrière une
 * authentification HTTP Basic. Se désactive tout seul si SITE_PASSWORD n'est pas défini, pour ne
 * jamais bloquer un environnement où la variable n'a pas été configurée. À retirer une fois le
 * site prêt pour de vrais visiteurs. */
function checkSitePassword(request: NextRequest): NextResponse | null {
  const password = process.env.SITE_PASSWORD;
  if (!password) return null;

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const decoded = atob(auth.slice("Basic ".length));
    const suppliedPassword = decoded.slice(decoded.indexOf(":") + 1);
    if (suppliedPassword === password) return null;
  }

  return new NextResponse("Authentification requise / Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="VerdiktNow"' },
  });
}

function resolveLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;

  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const preferred = acceptLanguage
      .split(",")
      .map((part) => part.split(";")[0].trim().toLowerCase().slice(0, 2));
    for (const p of preferred) {
      if (isLocale(p)) return p;
    }
  }

  return DEFAULT_LOCALE;
}

export async function proxy(request: NextRequest) {
  const passwordCheck = checkSitePassword(request);
  if (passwordCheck) return passwordCheck;

  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1];

  if (!isLocale(firstSegment)) {
    const locale = resolveLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const locale = firstSegment;
  const logicalPathname = pathname.slice(`/${locale}`.length) || "/";

  // Supabase keys aren't set yet — let the site run in its current
  // frontend-only mode instead of breaking every route.
  const response = SUPABASE_CONFIGURED
    ? await updateSession(request, locale, logicalPathname)
    : NextResponse.next();

  response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)",
  ],
};
