import { NextResponse, type NextRequest } from "next/server";
import { i18nRouter } from "next-i18n-router";
import i18nConfig from "./i18config";
import {
  applySupabaseCookies,
  updateSession,
} from "./utils/supabase/middleware";

const LOCALES = i18nConfig.locales ?? ["en", "es"];
const DEFAULT_LOCALE = i18nConfig.defaultLocale ?? "en";

const PUBLIC_PATHS = new Set([
  "/login",
  "/404",
  "/error",
  "/after-place-order",
]);

for (const locale of LOCALES) {
  PUBLIC_PATHS.add(`/${locale}/login`);
  PUBLIC_PATHS.add(`/${locale}/404`);
  PUBLIC_PATHS.add(`/${locale}/error`);
  PUBLIC_PATHS.add(`/${locale}/after-place-order`);
}

function getLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|es)(\/|$)/);
  return match ? match[1] : DEFAULT_LOCALE;
}

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return false;
}

function hasAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));
}

export async function middleware(request: NextRequest) {
  const { url, nextUrl } = request;
  const pathname = nextUrl.pathname;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/assets/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  const locale = getLocale(pathname);
  const isLoginPage =
    pathname === "/login" || pathname === `/${locale}/login`;
  const isPublic = isPublicPath(pathname);

  const i18nResponse = await i18nRouter(request, i18nConfig);

  // Public routes: only touch Supabase on login (redirect if already signed in).
  if (isPublic && !isLoginPage) {
    return i18nResponse ?? NextResponse.next();
  }

  if (isLoginPage && !hasAuthCookie(request)) {
    return i18nResponse ?? NextResponse.next();
  }

  const { supabaseResponse, session, error } = await updateSession(request);

  let response = i18nResponse ?? supabaseResponse;
  response = applySupabaseCookies(supabaseResponse, response);

  if (error) {
    console.error("Error fetching session:", error.message);
    if (!isLoginPage) {
      const redirect = NextResponse.redirect(
        new URL(`/${locale}/login`, url)
      );
      return applySupabaseCookies(supabaseResponse, redirect);
    }
    return response;
  }

  if (session) {
    if (isLoginPage) {
      const redirect = NextResponse.redirect(new URL(`/${locale}`, url));
      return applySupabaseCookies(supabaseResponse, redirect);
    }
    return response;
  }

  if (!isLoginPage && !isPublic) {
    const redirect = NextResponse.redirect(
      new URL(`/${locale}/login`, url)
    );
    return applySupabaseCookies(supabaseResponse, redirect);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|assets|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff2?|map|ico)$).*)",
  ],
};
