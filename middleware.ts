import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from './utils/supabase/server';

export async function middleware(request: NextRequest) {
  const supabase = createClient();
  const { url, nextUrl } = request;
  const pathname = nextUrl.pathname;

  const isLoginPage = pathname.startsWith('/login');

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // console.log('session:', session);

    if (error) {
      console.error('Error fetching session:', error.message);
    }

    if (session) {
      // If logged in and on the login page, redirect to home
      if (isLoginPage) {
        return NextResponse.redirect(new URL('/', url));
      }
      return NextResponse.next(); // Allow access to the requested page
    } else {
      if (!isLoginPage) {
        console.log('No session found, redirecting to login');
        return NextResponse.redirect(new URL('/login', url));
      }
      return NextResponse.next(); // Allow access to the login page
    }
  } catch (err) {
    console.error('Unexpected error in middleware:', err);
    return NextResponse.redirect(new URL('/login', url));
  }
}

export const config = {
  matcher: [
    '/login',
    '/',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
