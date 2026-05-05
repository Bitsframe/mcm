import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | undefined;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  ).trim();
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or PUBLISHABLE_KEY)"
    );
  }
  _client = createClient(url, key);
  return _client;
}

/** Default export: lazy Supabase client (safe for `next build` module load). */
const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getClient() as unknown as Record<string | symbol, unknown>;
    const v = c[prop as string];
    if (typeof v === "function") {
      return (v as (...args: unknown[]) => unknown).bind(c);
    }
    return v;
  },
});

const testConnection = async () => {
  try {
    const { data, error } = await getClient()
      .from("Locations")
      .select("count", { count: "exact" });
    if (error) throw error;
    console.log("Supabase connection successful, found data:", data);
    return true;
  } catch (error) {
    console.error("Error connecting to Supabase:", error);
    return false;
  }
};

if (typeof window !== "undefined") {
  testConnection();
}

export default supabase;
