import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from './utils/supabase/server';
import { i18nRouter } from "next-i18n-router";
import i18nConfig from "./i18config";

export async function middleware(request: NextRequest) {

  const lang = request.nextUrl.searchParams.get("lng");
  console.log("Detected Language:", lang);



    const supabase = createClient();
    const { url, nextUrl } = request;
    const pathname = nextUrl.pathname;
    const isLoginPage = pathname.startsWith('/login');

    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Error fetching session:', error.message);
        }

        if (session) {
            if (isLoginPage) {
                return NextResponse.redirect(new URL('/', url));
            }
        } else {
            if (!isLoginPage) {
                console.log('No session found, redirecting to login');
                return NextResponse.redirect(new URL('/login', url));
            }
        }
    } catch (err) {
        console.error('Unexpected error in middleware:', err);
        return NextResponse.redirect(new URL('/login', url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/login",
        "/",
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
        "/((?!api|_next|.*\\..*).*)"
    ],
};
