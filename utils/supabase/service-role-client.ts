import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Secret-key Supabase client for API routes (bypasses RLS). Created on first use only so
 * `next build` can load route modules without requiring secrets at import time.
 *
 * Server-only — never import from a client component.
 */
export function getServiceRoleSupabase(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (process.env.SUPABASE_SECRET_KEY ?? "").trim();
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY (sb_secret_...)"
    );
  }
  if (key.startsWith("eyJ")) {
    throw new Error(
      "SUPABASE_SECRET_KEY is a legacy service_role JWT. Use the secret key (sb_secret_...) from Supabase Dashboard > Settings > API Keys."
    );
  }
  cached = createClient(url, key);
  return cached;
}
