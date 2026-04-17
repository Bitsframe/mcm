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
   * Check if a return record exists for a given sales_id (sales_history_id).
   * Returns the return record or null.
   */
  async getReturnBySalesId({
    salesId,
  }: {
    salesId: number;
  }): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .from("returns")
      .select("return_id, quantity, reason, merge, sales_id, inventory_id")
      .eq("sales_id", salesId)
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0];
  },
  /**
   * Get the latest transaction_history record for a patient.
   */
  async getLatestTransactionForPatient({
    patientId,
    orderId,
  }: {
    patientId: number;
    orderId?: number;
  }): Promise<Record<string, unknown> | null> {
    let query = supabase
      .from("transaction_history")
      .select("id, patient_id, amount, balance, type, order_id, created_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (orderId) {
      query = supabase
        .from("transaction_history")
        .select("id, patient_id, amount, balance, type, order_id, created_at")
        .eq("patient_id", patientId)
        .eq("order_id", orderId)
        .limit(1);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) return null;
    return data[0];
  },

  /**
   * Get inventory quantity for a specific inventory_id.
   */
  async getInventoryQuantity({ inventoryId }: { inventoryId: number }): Promise<number> {
    const { data, error } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("inventory_id", inventoryId)
      .limit(1);
    if (error || !data || data.length === 0) return -1;
    return data[0].quantity as number;
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
