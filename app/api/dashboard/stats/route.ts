import { classifyError } from '@/utils/logging/safe-log';
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Read fresh every load; a cached figure would be wrong the moment a sale lands.
export const dynamic = 'force-dynamic'

export type DashboardStats = {
  sales: { revenue_month: number; revenue_total: number; orders_month: number }
  appointments: { total: number; month: number; upcoming: number }
  patients: { total: number; month: number }
  warehouse: { products: number; stocked_items: number; out_of_stock: number }
  locations_counted: number
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

    const { data: grants, error: grantsError } = await supabase
      .from('user_locations')
      .select('location_id')
      .eq('profile_id', user.id)
    if (grantsError) throw grantsError

    const allowed = Array.from(
      new Set(
        (grants ?? [])
          .map((row: { location_id: number | null }) => Number(row.location_id))
          .filter((id) => Number.isFinite(id))
      )
    )

    const raw = new URL(req.url).searchParams.get('location_id')
    const wantsOne = raw !== null && raw !== '' && raw !== 'all'

    let locationIds = allowed
    if (wantsOne) {
      const requested = Number(raw)
      if (!Number.isFinite(requested)) {
        return NextResponse.json({ error: 'location_id must be a number' }, { status: 400 })
      }
      if (!allowed.includes(requested)) {
        return NextResponse.json({ error: 'No access to that location' }, { status: 403 })
      }
      locationIds = [requested]
    }

    // No grants means nothing to total up, and `= any('{}')` would match nothing
    // anyway — answer explicitly instead of running the query.
    if (locationIds.length === 0) {
      return NextResponse.json({
        data: {
          sales: { revenue_month: 0, revenue_total: 0, orders_month: 0 },
          appointments: { total: 0, month: 0, upcoming: 0 },
          patients: { total: 0, month: 0 },
          warehouse: { products: 0, stocked_items: 0, out_of_stock: 0 },
          locations_counted: 0,
        } satisfies DashboardStats,
      })
    }

    const { data, error } = await supabase.rpc('dashboard_stats', {
      p_location_ids: locationIds,
    })
    if (error) throw error

    return NextResponse.json({ data: data as DashboardStats })
  } catch (err) {
    console.error('[api/dashboard/stats]', classifyError(err))
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load dashboard stats' },
      { status: 500 }
    )
  }
}
