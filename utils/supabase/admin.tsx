import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Admin client for operations that require elevated privileges
// Only use this for specific admin operations that need to bypass RLS
export const createAdminClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!, // Use secret key for admin operations
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