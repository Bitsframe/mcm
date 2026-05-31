import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

function getJwtRole(token: string): string | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    );
    return typeof payload?.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

/**
 * Service-role Supabase client for API routes. Created on first use only so
 * `next build` can load route modules without requiring secrets at import time.
 */
export function getServiceRoleSupabase(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    ""
  ).trim();
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (or legacy SUPABASE_SECRET_KEY)"
    );
  }
  const role = getJwtRole(key);
  if (role && role !== "service_role") {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY is set, but it is a ${role} key. Replace it with the real service_role secret from Supabase Dashboard > Settings > API.`
    );
  }
  cached = createClient(url, key);
  return cached;
}
