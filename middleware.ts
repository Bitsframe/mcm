import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "./utils/supabase/server";
import { i18nRouter } from "next-i18n-router";
import i18nConfig from "./i18config";

export async function middleware(request: NextRequest) {
  const { url, nextUrl } = request;
  const pathname = nextUrl.pathname;

  // Bypass middleware for public assets (images, icons) so static files are served
  // directly and not subject to auth redirects which can cause 400/401 for assets.
  if (pathname.startsWith("/assets/") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // Avoid auth/session work for API requests to prevent token-refresh bursts.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const localeMatch = pathname.match(/^\/(en|es)/);
  const locale = localeMatch ? localeMatch[1] : i18nConfig.defaultLocale || "en";

  const isLoginPage = pathname === "/login" || pathname.startsWith(`/${locale}/login`);
  const isAPIRequest = pathname.startsWith("/api/");
  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));

  const i18nResponse = await i18nRouter(request, i18nConfig);
  const response = i18nResponse || NextResponse.next();

  // Avoid unnecessary auth calls on login when no session cookies exist.
  if (isLoginPage && !hasAuthCookie) {
    return response;
  }

  try {
    const supabase = createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Error fetching session:", error.message);
      // If session is expired, redirect to login (don't block request)
      if (!isLoginPage && !isAPIRequest) {
        return NextResponse.redirect(new URL(`/${locale}/login`, url));
      }
    }

    if (session) {
      if (isLoginPage) {
        return NextResponse.redirect(new URL(`/${locale}`, url));
      }
      if (isAPIRequest) {
        return NextResponse.next();
      }
    } else {
      if (isAPIRequest) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!isLoginPage) {
        return NextResponse.redirect(new URL(`/${locale}/login`, url));
      }
    }
  } catch (err) {
    console.error("Middleware error:", err);
    // Don't block on auth errors - allow request to proceed
    if (!isLoginPage && !isAPIRequest) {
      return NextResponse.redirect(new URL(`/${locale}/login`, url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/login",
    "/en/login",
    "/es/login",
    "/((?!_next/static|_next/image|favicon.ico|.\\.(?:svg|png|jpg|jpeg|gif|webp)$).)",
    "/((?!api|_next|.\\..).*)",
  ],
};



