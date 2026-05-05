

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  ).trim()

  if (!url || !key) {
    return response
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        // ✅ READ cookies from the request
        get(name: string) {
          return request.cookies.get(name)?.value
        },

        // ✅ WRITE cookies ONLY to the response
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },

        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // ✅ This refreshes the session and syncs cookies correctly
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
      Run middleware on all routes except:
      - static files
      - images
      - favicon
    */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
