// import { createServerClient, type CookieOptions } from "@supabase/ssr";
// import { cookies } from "next/headers";

// export const createClient = () => {
//   const cookieStore = cookies();
//   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
//   // Prefer the service role key on the server if present (required for writes when RLS is enabled).
//   const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

//   // Note: SUPABASE_SERVICE_ROLE_KEY must be set in your server environment for elevated privileges.
//   // Do NOT expose the service role key to the browser or commit it to source control.

//   return createServerClient(
//     supabaseUrl,
//     supabaseKey,
//     {
//       cookies: {
//        async get(name: string) {
//           return (await cookieStore).get(name)?.value;
//         },
//         async   set(name: string, value: string, options: CookieOptions) {
//           try {
//             (await cookieStore).set({ name, value, ...options });
//           } catch (error) {
//             // The `set` method was called from a Server Component.
//             // This can be ignored if you have middleware refreshing
//             // user sessions.
//           }
//         },
//         async   remove(name: string, options: CookieOptions) {
//           try {
//             (await cookieStore).set({ name, value: "", ...options });
//           } catch (error) {
//             // The `delete` method was called from a Server Component.
//             // This can be ignored if you have middleware refreshing
//             // user sessions.
//           }
//         },
//       },
//     },
//   );
// };




import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // ✅ anon only
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
