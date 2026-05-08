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
   * Count archived inventory records for a given location.
   */
  async getArchivedInventoryCount({ locationId }: { locationId: number }): Promise<number> {
    const { count, error } = await supabase
      .from("inventory")
      .select("inventory_id", { count: "exact", head: true })
      .eq("location_id", locationId)
      .eq("archived", true);
    if (error) return 0;
    return count ?? 0;
  },
  async getInventoryRecord({ inventoryId }: { inventoryId: number }): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .from("inventory")
      .select("inventory_id, quantity, archived, location_id, product_id")
      .eq("inventory_id", inventoryId)
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0];
  },
  async getInventoryByProductName({
    productName,
    locationId,
  }: {
    productName: string;
    locationId: number;
  }): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .from("inventory")
      .select("inventory_id, quantity, archived, location_id, product_id")
      .eq("location_id", locationId)
      .eq("archived", false)
      .limit(20);

    if (error || !data) return null;

    // Filter by product name via products join
    const { data: products } = await supabase
      .from("products")
      .select("id, product_name")
      .ilike("product_name", `%${productName}%`);

    if (!products || products.length === 0) return null;

    const productIds = products.map((p: any) => p.id);
    const match = data.find((inv: any) => productIds.includes(inv.product_id));
    return match || null;
  },

  /**
   * Get count of active (non-archived) products.
   */
  async getActiveProductsCount(): Promise<number> {
    const { count, error } = await supabase
      .from("products")
      .select("product_id", { count: "exact", head: true })
      .eq("archived", false);
    if (error) return 0;
    return count ?? 0;
  },

  /**
   * Get the first active product (for use in tests).
   */
  async getFirstActiveProduct(): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .from("products")
      .select("product_id, product_name, price, stock, unlimited, bonus_eligible, category_id, categories(category_name)")
      .eq("archived", false)
      .order("product_id", { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0];
  },

  /**
   * Get count of active (non-archived) categories.
   */
  async getActiveCategoriesCount(): Promise<number> {
    const { count, error } = await supabase
      .from("categories")
      .select("category_id", { count: "exact", head: true })
      .eq("archived", false);
    if (error) return 0;
    return count ?? 0;
  },

  /**
   * Get a product by name (exact or partial match).
   */
  async getProductByName({ name }: { name: string }): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .from("products")
      .select("product_id, product_name, price, stock, unlimited, bonus_eligible, category_id, archived")
      .ilike("product_name", `%${name}%`)
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0];
  },

  /**
   * Get inventory record by product_id and location_id.
   * Handles rows where archived may be null (treated as false).
   */
  async getInventoryByProductAndLocation({
    productId,
    locationId,
  }: {
    productId: number;
    locationId: number;
  }): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .from("inventory")
      .select("inventory_id, quantity, archived, location_id, product_id")
      .eq("product_id", productId)
      .eq("location_id", locationId)
      .or("archived.eq.false,archived.is.null")
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0];
  },

  /**
   * Find a product that has inventory (quantity > 0, non-unlimited) at any location.
   * Returns { product_id, product_name, category_id, category_name, from_location_id,
   *           from_location_title, quantity, inventory_id } or null.
   * Criteria: non-archived inventory row, quantity > 0, product is non-unlimited and non-archived,
   *           at least 2 locations exist so a transfer destination is available.
   */
  async getTransferableInventoryItem(): Promise<Record<string, unknown> | null> {
    // Step 1: get all locations
    const { data: locs } = await supabase
      .from("Locations")
      .select("id, title");

    if (!locs || locs.length < 2) return null; // need at least 2 locations to transfer

    const locMap = new Map((locs || []).map((l: any) => [l.id, l.title]));

    // Step 2: get non-archived inventory rows with quantity > 0
    const { data: invRows, error: invError } = await supabase
      .from("inventory")
      .select("inventory_id, quantity, location_id, product_id")
      .or("archived.eq.false,archived.is.null")
      .gt("quantity", 0)
      .limit(50);

    if (invError || !invRows || invRows.length === 0) return null;

    // Step 3: for each inventory row, check the product is non-unlimited and non-archived
    for (const row of invRows as any[]) {
      const fromTitle = locMap.get(row.location_id);
      if (!fromTitle) continue;

      const { data: prod } = await supabase
        .from("products")
        .select("product_id, product_name, unlimited, archived, category_id, categories(category_id, category_name)")
        .eq("product_id", row.product_id)
        .eq("unlimited", false)
        .eq("archived", false)
        .limit(1);

      if (!prod || prod.length === 0) continue;

      const p = prod[0] as any;
      return {
        inventory_id: row.inventory_id,
        quantity: row.quantity,
        from_location_id: row.location_id,
        from_location_title: fromTitle,
        product_id: p.product_id,
        product_name: p.product_name,
        category_id: p.category_id,
        category_name: p.categories?.category_name ?? "",
      };
    }
    return null;
  },

  /**
   * Get all locations (table name is "Locations" with capital L).
   */
  async getAllLocations(): Promise<Record<string, unknown>[]> {
    const { data, error } = await supabase
      .from("Locations")
      .select("id, title")
      .order("id", { ascending: true });
    if (error || !data) return [];
    return data;
  },

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

  /**
   * Get the latest active bonus_config_history row for a location
   * (where effective_to IS NULL — the currently active config).
   */
  async getActiveBonusConfig({
    locationId,
  }: {
    locationId: number;
  }): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .from("bonus_config_history")
      .select("id, location_id, flat_percentage, value, bonus_threshold, effective_from, effective_to")
      .eq("location_id", locationId)
      .is("effective_to", null)
      .order("effective_from", { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0];
  },

  /**
   * Get the bonus row for a specific location and date from the bonus table.
   * Returns fields: id, location_id, date, total_sales, bonus_eligibility, bonus_amount, paid, paid_date.
   */
  async getBonusRowForLocationAndDate({
    locationId,
    date,
  }: {
    locationId: number;
    date: string;
  }): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .from("bonus")
      .select("id, location_id, date, total_sales, bonus_eligibility, bonus_amount, paid, paid_date, bonus_sales")
      .eq("location_id", locationId)
      .eq("date", date)
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0];
  },

  /**
   * Get all bonus_config_history rows for a location ordered by effective_from desc.
   * Useful for verifying a new config was inserted after a Set limits save.
   */
  async getBonusConfigHistory({
    locationId,
  }: {
    locationId: number;
  }): Promise<Record<string, unknown>[]> {
    const { data, error } = await supabase
      .from("bonus_config_history")
      .select("id, location_id, flat_percentage, value, bonus_threshold, effective_from, effective_to")
      .eq("location_id", locationId)
      .order("effective_from", { ascending: false })
      .limit(10);
    if (error || !data) return [];
    return data;
  },

  /**
   * Get all bonus rows for a location ordered by date desc.
   * Useful for verifying bonus_eligibility, bonus_amount, bonus_sales after calculation.
   */
  async getBonusRowsForLocation({
    locationId,
    limit,
  }: {
    locationId: number;
    limit?: number;
  }): Promise<Record<string, unknown>[]> {
    const { data, error } = await supabase
      .from("bonus")
      .select("id, location_id, date, total_sales, bonus_sales, bonus_eligibility, bonus_amount, paid, paid_date")
      .eq("location_id", locationId)
      .order("date", { ascending: false })
      .limit(limit ?? 10);
    if (error || !data) return [];
    return data;
  },
};
