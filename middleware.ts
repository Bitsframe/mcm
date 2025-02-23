import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "./utils/supabase/server";
import { i18nRouter } from "next-i18n-router";
import i18nConfig from "./i18config";

export async function middleware(request: NextRequest) {
  const supabase = createClient();
  const { url, nextUrl } = request;
  const pathname = nextUrl.pathname;

  const localeMatch = pathname.match(/^\/(en|es)/);
  const locale = localeMatch ? localeMatch[1] : i18nConfig.defaultLocale || "en";

  const isLoginPage = pathname === "/login" || pathname.startsWith(`/${locale}/login`);

  const i18nResponse = await i18nRouter(request, i18nConfig);
  const response = i18nResponse || NextResponse.next();

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error fetching session:", error.message);
    }

    if (session) {
      if (isLoginPage) {
        return NextResponse.redirect(new URL(`/${locale}`, url));
      }
    } else {
      if (!isLoginPage) {
        return NextResponse.redirect(new URL(`/${locale}/login`, url));
      }
    }
  } catch (err) {
    return NextResponse.redirect(new URL(`/${locale}/login`, url));
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