import { fetch_content_service } from "@/utils/supabase/data_services/data_services"

/**
 * Helper utilities to compute total sales values from `sales_history`.
 * These functions are intentionally simple (DB rows are fetched and aggregated in JS).
 * For large datasets consider adding a DB view or RPC for server-side aggregation.
 */

export interface TotalSalesResult {
  patientId: number | string
  total: number
  count: number
}

/**
 * Get total sales for a single patient (sums `final_price` or `total` if present).
 * Returns 0 when no rows exist.
 */
export async function getTotalSalesForPatient(patientId: number | string) {
  if (patientId === undefined || patientId === null) return 0

  const rows: any[] = await fetch_content_service({
    table: "sales_history",
    selectParam: "",
    matchCase: { key: "patient_id", value: patientId },
  }).catch(() => [])

  const total = rows.reduce((sum, r) => {
    const v = Number(r.final_price ?? r.total ?? r.amount ?? 0)
    return sum + (isNaN(v) ? 0 : v)
  }, 0)

  return total
}

/**
 * Get total sales for multiple patients in a single query and return a map patientId -> total
 * For small lists this fetches matching sales rows and aggregates in JS.
 */
export async function getTotalSalesForPatients(patientIds: Array<number | string>) {
  if (!Array.isArray(patientIds) || patientIds.length === 0) return {}

  // fetch all sales_history rows for these patients
  const rows: any[] = await fetch_content_service({
    table: "sales_history",
    selectParam: "",
    matchCase: null,
    filterOptions: [
      { column: "patient_id", operator: "in", value: patientIds }
    ],
  }).catch(() => [])

  const map: Record<string, TotalSalesResult> = {}
  patientIds.forEach((id) => {
    map[String(id)] = { patientId: id, total: 0, count: 0 }
  })

  rows.forEach((r) => {
    const id = String(r.patient_id ?? r.patientId ?? "")
    if (!map[id]) map[id] = { patientId: id, total: 0, count: 0 }
    const v = Number(r.final_price ?? r.total ?? r.amount ?? 0)
    const add = isNaN(v) ? 0 : v
    map[id].total += add
    map[id].count += 1
  })

  return map
}

/**
 * Fetch all locations from `Locations` table.
 */
export async function fetchLocations() {
  const rows: any[] = await fetch_content_service({ table: "Locations" }).catch(() => [])
  return rows
}

/**
 * Compute today's total sales grouped by location id.
 * It sums `total_price` from `sales_history` for rows whose `date_sold` falls within the provided date (default: today).
 * If a sales row doesn't include `total_price`, it will attempt to derive a value from inventory price * quantity (requires matching inventory rows).
 */
export async function getTodaySalesGroupedByLocation(opts?: { date?: Date, locationIds?: Array<number | string> }) {
  // Default date: use today when no date is provided
  const date = opts?.date ? new Date(opts.date) : new Date()

  // build day start/end in ISO format
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  const startISO = start.toISOString()
  const endISO = end.toISOString()

  // fetch sales rows for the day
  const filterOptions: any[] = [
    { column: "date_sold", operator: "gte", value: startISO },
    { column: "date_sold", operator: "lte", value: endISO },
  ]

  // If caller supplied locationIds, we cannot filter sales_history by location directly
  // because sales_history doesn't have a location column; instead fetch inventory ids
  // for those locations and filter sales by inventory_id.
  if (opts?.locationIds && opts.locationIds.length > 0) {
    // try fetching inventory rows that belong to the provided locations
    let invForLocations: any[] = []
    try {
      invForLocations = await fetch_content_service({
        table: 'inventory',
        filterOptions: [{ column: 'location_id', operator: 'in', value: opts.locationIds }],
        selectParam: ',inventory_id',
      }).catch(() => [])
    } catch (e) {
      // fallback to alternative column name if available
      invForLocations = await fetch_content_service({
        table: 'inventory',
        filterOptions: [{ column: 'locationid', operator: 'in', value: opts.locationIds }],
        selectParam: ',inventory_id',
      }).catch(() => [])
    }

    const invIdsForLocations = Array.from(new Set(invForLocations.map(ir => ir.inventory_id ?? ir.inventoryid ?? ir.id).filter(Boolean)))
    console.log('[totalSales] inventory ids for provided locations:', invIdsForLocations)
    if (invIdsForLocations.length > 0) {
      filterOptions.push({ column: 'inventory_id', operator: 'in', value: invIdsForLocations })
    } else {
      // No inventory found for these locations -> no sales
      console.log('[totalSales] no inventory found for provided locations, returning empty result')
      return {}
    }
  }

  const salesRows: any[] = await fetch_content_service({
    table: "sales_history",
    filterOptions,
  }).catch(() => [])

  console.log('[totalSales] getTodaySalesGroupedByLocation fetched sales rows:', salesRows.length, salesRows.slice(0,5))

  // collect inventory ids from sales rows (sales_history uses `inventory_id` column)
  const inventoryIds = Array.from(new Set(salesRows.map(r => r.inventory_id ?? r.inventoryid).filter(Boolean)))

  // We'll build maps for inventory price and inventory -> location
  let inventoryPriceMap: Record<string, number> = {}
  let inventoryLocationMap: Record<string, string | number> = {}
  if (inventoryIds.length > 0) {
    // note: inventory table uses `inventory_id` or `id` depending on schema
    const invRows: any[] = await fetch_content_service({
      table: "inventory",
      filterOptions: [{ column: "inventory_id", operator: "in", value: inventoryIds }],
    }).catch(() => [])
    console.log('[totalSales] fetched inventory rows:', invRows.length, invRows.slice(0,5))
    invRows.forEach(ir => {
      const id = String(ir.inventory_id ?? ir.inventoryid ?? ir.id ?? "")
      inventoryPriceMap[id] = Number(ir.price ?? 0)
      // inventory table has location_id which indicates the inventory's location
      inventoryLocationMap[id] = ir.location_id ?? ir.locationid ?? ir.locationId ?? ""
    })
    console.log('[totalSales] built inventoryPriceMap:', inventoryPriceMap)
    console.log('[totalSales] built inventoryLocationMap:', inventoryLocationMap)
  }

  const result: Record<string, { locationId: string | number, total: number, count: number }> = {}

  salesRows.forEach(r => {
    // Determine inventory id referenced by the sale
    const invId = String(r.inventory_id ?? r.inventoryid ?? r.inventoryId ?? "")
    // Determine location via inventory's location_id first, fall back to any location on the sale row
    const loc = inventoryLocationMap[invId] ?? r.location_id ?? r.locationid ?? r.locationId ?? "unknown"
    const locKey = String(loc)
    if (!result[locKey]) result[locKey] = { locationId: loc, total: 0, count: 0 }

    // Prefer the explicit total_price from sales_history; if missing, derive from price * quantity
    let value = Number(r.total_price ?? r.totalprice ?? r.total ?? 0)
    if ((!value || value === 0) && (r.quantity_sold || r.quantity)) {
      const price = inventoryPriceMap[invId] ?? Number(r.price ?? 0)
      value = Number(price) * Number(r.quantity_sold ?? r.quantity ?? 0)
    }

    const add = isNaN(Number(value)) ? 0 : Number(value)
    result[locKey].total += add
    result[locKey].count += 1
  })

  console.log('[totalSales] grouped totals by location:', result)
  return result
}

/**
 * Debug helper: fetch sales_history for given date (default 2025-10-22) and fetch inventory rows
 * referenced by those sales rows, then console.log results (useful to inspect field names/values).
 */
export async function fetchAndLogSalesAndInventory(opts?: { date?: Date }) {
  const date = opts?.date ? new Date(opts.date) : new Date('2025-10-22')
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  const startISO = start.toISOString()
  const endISO = end.toISOString()

  const salesRows: any[] = await fetch_content_service({
    table: 'sales_history',
    filterOptions: [
      { column: 'date_sold', operator: 'gte', value: startISO },
      { column: 'date_sold', operator: 'lte', value: endISO },
    ],
  }).catch(() => [])

  console.log('[debug] fetched sales_history rows:', salesRows.length)
  console.log('[debug] sample sales row:', salesRows[0] ?? null)

  const inventoryIds = Array.from(new Set(salesRows.map(r => r.inventory_id ?? r.inventoryid).filter(Boolean)))
  console.log('[debug] inventoryIds referenced by sales rows:', inventoryIds)

  let invRows: any[] = []
  if (inventoryIds.length > 0) {
    invRows = await fetch_content_service({
      table: 'inventory',
      filterOptions: [{ column: 'inventory_id', operator: 'in', value: inventoryIds }],
    }).catch(() => [])
  }

  console.log('[debug] fetched inventory rows count:', invRows.length)
  console.log('[debug] sample inventory row:', invRows[0] ?? null)

  return { salesRows, invRows }
}

/**
 * Fetch ALL rows from `sales_history` and `inventory` and console.log basic info.
 * Use this when you just want to inspect the full tables (no filters).
 */
export async function fetchAllSalesAndInventory() {
  const salesRows: any[] = await fetch_content_service({ table: 'sales_history' }).catch(() => [])
  console.log('[fetchAll] sales_history rows count:', salesRows.length)
  console.log('[fetchAll] sample sales row:', salesRows[0] ?? null)

  const invRows: any[] = await fetch_content_service({ table: 'inventory' }).catch(() => [])
  console.log('[fetchAll] inventory rows count:', invRows.length)
  console.log('[fetchAll] sample inventory row:', invRows[0] ?? null)

  return { salesRows, invRows }
}

export default {
  getTotalSalesForPatient,
  getTotalSalesForPatients,
  fetchLocations,
  getTodaySalesGroupedByLocation,
  // debugging helper
  fetchAndLogSalesAndInventory,
  // full-table debug helper
  fetchAllSalesAndInventory,
}
