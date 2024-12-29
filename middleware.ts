import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from './utils/supabase/middleware'
import { createClient } from './utils/supabase/server';

export async function middleware(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession();

  const { url, nextUrl } = request;
  const pathname = nextUrl.pathname

  // Retrieve user session
  const path_start_with = pathname.startsWith('/login')

  // if (pathname.startsWith('/set-password')) {
  //   return NextResponse.next()
  // }

  // await updateSession(request);

  if (session) {
    if (path_start_with) {
      return NextResponse.redirect(new URL('/', url));
    }
    return NextResponse.next()
  }
  else{
    if (!path_start_with) {
      return NextResponse.redirect(new URL('/login', url));
    }
    return NextResponse.next()
  }


  // return 

  // return NextResponse.next(); // Pass through for non-protected routes or with valid session



}

export const config = {
  matcher: [
    '/login',
    '/',
    // '/dashboard',
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}



