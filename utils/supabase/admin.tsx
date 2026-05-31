import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getJwtRole(token: string): string | null {
  const parts = token.split('.')
  if (parts.length < 2) return null

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    )
    return typeof payload?.role === 'string' ? payload.role : null
  } catch {
    return null
  }
}

// Admin client for operations that require elevated privileges
// Only use this for specific admin operations that need to bypass RLS
export const createAdminClient = () => {
  const cookieStore = cookies()

  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? '').trim()
  const role = key ? getJwtRole(key) : null
  if (role && role !== 'service_role') {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY is set, but it is a ${role} key. Replace it with the real service_role secret from Supabase Dashboard > Settings > API.`
    )
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },

        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Server Components cannot set cookies
            // Middleware refreshes the session
          }
        },

        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Same as above
          }
        },
      },
    }
  )
}