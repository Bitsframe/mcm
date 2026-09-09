import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Admin client for operations that require elevated privileges
// Only use this for specific admin operations that need to bypass RLS
export const createAdminClient = () => {
  const cookieStore = cookies()

  const key = (process.env.SUPABASE_SECRET_KEY ?? '').trim()
  if (!key) {
    throw new Error('Missing SUPABASE_SECRET_KEY (sb_secret_...)')
  }
  if (key.startsWith('eyJ')) {
    throw new Error(
      'SUPABASE_SECRET_KEY is a legacy service_role JWT. Use the secret key (sb_secret_...) from Supabase Dashboard > Settings > API Keys.'
    )
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
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