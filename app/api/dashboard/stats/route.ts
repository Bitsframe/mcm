import { classifyError } from '@/utils/logging/safe-log';
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { resolveDashboardLocations } from '@/utils/server/dashboard-locations'
import { isSuperAdmin } from '@/utils/server/roles'

// Read fresh every load; a cached figure would be wrong the moment a sale lands.
export const dynamic = 'force-dynamic'

export type DashboardStats = {
  /** null for anyone who is not a super admin. */
  sales: { revenue_month: number; revenue_total: number; orders_month: number } | null
  appointments: { total: number; month: number; upcoming: number } | null
  patients: { total: number; month: number }
  warehouse: { products: number; stocked_items: number; out_of_stock: number } | null
  locations_counted: number
  /** true when the caller may only see their own patient count. */
  restricted: boolean
}

/**
 * Dashboard KPIs for the locations the signed-in user may see.
 *
 * The allowed set comes from user_locations and is resolved here rather than
 * trusted from the query string — otherwise any caller could total up a clinic
 * they have no access to, or omit the parameter and get company-wide figures.
 * With no location_id the answer covers every location they are granted, which
 * is what the dashboard shows by default.
 *
 * The aggregation itself lives in the dashboard_stats SQL function: PostgREST
 * caps a select at 1000 rows, so summing sales_history or inventory over the
 * wire silently truncates the total.
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    const resolved = await resolveDashboardLocations(supabase, user.id, req.url)
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status })
    }
    const locationIds = resolved.locationIds

    // Only a super admin sees company figures. Everyone else gets the patient
    // count for the clinics assigned to them and nothing else — no revenue, no
    // order counts, no stock. Decided here, not in the browser, because the
    // response is the thing worth protecting.
    const full = await isSuperAdmin(supabase, user.id)

    // No grants means nothing to total up, and `= any('{}')` would match nothing
    // anyway — answer explicitly instead of running the query.
    if (locationIds.length === 0) {
      return NextResponse.json({
        data: {
          sales: full ? { revenue_month: 0, revenue_total: 0, orders_month: 0 } : null,
          appointments: full ? { total: 0, month: 0, upcoming: 0 } : null,
          patients: { total: 0, month: 0 },
          warehouse: full ? { products: 0, stocked_items: 0, out_of_stock: 0 } : null,
          locations_counted: 0,
          restricted: !full,
        } satisfies DashboardStats,
      })
    }

    const { data, error } = await supabase.rpc('dashboard_stats', {
      p_location_ids: locationIds,
    })
    if (error) throw error

    const stats = data as DashboardStats

    if (!full) {
      // Build a fresh object rather than deleting keys, so nothing withheld can
      // survive by accident if the SQL gains a field later.
      return NextResponse.json({
        data: {
          sales: null,
          appointments: null,
          warehouse: null,
          patients: {
            total: stats?.patients?.total ?? 0,
            month: stats?.patients?.month ?? 0,
          },
          locations_counted: stats?.locations_counted ?? locationIds.length,
          restricted: true,
        } satisfies DashboardStats,
      })
    }

    return NextResponse.json({ data: { ...stats, restricted: false } })
  } catch (err) {
    console.error('[api/dashboard/stats]', classifyError(err))
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load dashboard stats' },
      { status: 500 }
    )
  }
}
