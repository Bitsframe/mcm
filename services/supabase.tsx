import { Database } from "@/types/supabase";

import { createClient } from "@supabase/supabase-js";

/** Project URL is public; one var avoids duplicating SUPABASE_URL vs NEXT_PUBLIC_*. */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(
  supabaseUrl!,
  supabaseKey!
);
