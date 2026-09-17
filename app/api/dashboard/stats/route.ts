import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Read fresh every load; a cached figure would be wrong the moment a sale lands.
export const dynamic = 'force-dynamic'

export type DashboardStats = {
  sales: { revenue_month: number; revenue_total: number; orders_month: number }
  appointments: { total: number; month: number; upcoming: number }
  patients: { total: number; month: number }
  warehouse: { products: number; stocked_items: number; out_of_stock: number }
}

/**
 * Dashboard KPIs.
 *
 * The aggregation lives in the dashboard_stats SQL function rather than here:
 * PostgREST caps a select at 1000 rows, so summing sales_history or inventory
 * over the wire silently truncates the total.
 */
export async function GET(req: Request) {
  try {
    const raw = new URL(req.url).searchParams.get('location_id')
    const scoped = raw !== null && raw !== '' && raw !== 'all'
    const locationId = scoped ? Number(raw) : null
    if (scoped && !Number.isFinite(locationId)) {
      return NextResponse.json({ error: 'location_id must be a number' }, { status: 400 })
    }

    const supabase = createClient()
    const { data, error } = await supabase.rpc('dashboard_stats', {
      p_location_id: locationId,
    })
    if (error) throw error

    return NextResponse.json({ data: data as DashboardStats })
  } catch (err) {
    console.error('[api/dashboard/stats]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load dashboard stats' },
      { status: 500 }
    )
  }
}
