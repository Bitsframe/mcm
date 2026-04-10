// cypress/support/tasks.ts
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const supabaseTasks = {
  /**
   * Poll allpatients table until a row with the given firstname appears.
   * Returns the row when found, or null after maxAttempts.
   */
  async waitForPatientInDB({
    firstname,
    maxAttempts = 20,
    intervalMs = 2000,
  }: {
    firstname: string;
    maxAttempts?: number;
    intervalMs?: number;
  }): Promise<Record<string, unknown> | null> {
    for (let i = 0; i < maxAttempts; i++) {
      const { data, error } = await supabase
        .from("allpatients")
        .select("id, firstname, lastname, email, phone")
        .ilike("firstname", firstname)
        .limit(1);

      if (!error && data && data.length > 0) {
        return data[0];
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }
    return null;
  },
};
