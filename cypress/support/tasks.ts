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
   * Poll allpatients table until a row with the given email appears.
   * Returns ALL relevant columns when found, or null after maxAttempts.
   */
  async waitForPatientInDB({
    email,
    maxAttempts = 20,
    intervalMs = 2000,
  }: {
    email: string;
    maxAttempts?: number;
    intervalMs?: number;
  }): Promise<Record<string, unknown> | null> {
    for (let i = 0; i < maxAttempts; i++) {
      const { data, error } = await supabase
        .from("allpatients")
        .select("id, firstname, lastname, email, phone, gender, locationid, address, dob, onsite")
        .eq("email", email)
        .limit(1);

      if (!error && data && data.length > 0) {
        return data[0];
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }
    return null;
  },

  /**
   * Verify an order no longer exists in the orders table.
   * Returns false if deleted, true if still present.
   */
  async verifyOrderDeleted({ orderId }: { orderId: number }): Promise<boolean> {
    const { data, error } = await supabase
      .from("orders")
      .select("order_id")
      .eq("order_id", orderId)
      .limit(1);

    if (error) return false;
    return !!(data && data.length > 0);
  },
  /**
   * Returns count of patients for a given locationid.
   * Used to decide whether "no rows on screen" is a real failure or expected empty state.
   */
  async getPatientsCountByLocation({
    locationid,
  }: {
    locationid: number;
  }): Promise<number> {
    const { count, error } = await supabase
      .from("allpatients")
      .select("id", { count: "exact", head: true })
      .eq("locationid", locationid);

    if (error) return 0;
    return count ?? 0;
  },
};
