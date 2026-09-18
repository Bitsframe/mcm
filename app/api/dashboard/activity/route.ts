import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export type DashboardActivity = {
  sales_trend: { day: string; label: string; revenue: number; items: number }[]
  upcoming: {
    id: number
    date: string | null
    time: string | null
    patient: string | null
    service: string | null
    location: string | null
    approved: boolean
  }[]
  stock_by_location: {
    location: string
    stocked: number
    out_of_stock: number
    low_stock: number
  }[]
  returns: {
    total: number
    quantity: number
    this_month: number
    latest: string | null
    by_reason: { reason: string; count: number; quantity: number }[]
  }
  attention: { pending_approvals: number; out_of_stock: number; low_stock: number }
}

/**
 * The dashboard's lower half — trend, what is booked next, stock, returns.
 *
 * Locations come from user_locations for the signed-in user, never the query
 * string, so the panels can only ever show clinics the viewer may see.
 */
export async function GET() {
  try {
    const supabase = createClient()
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

    const locationIds = Array.from(
      new Set(
        (grants ?? [])
          .map((row: { location_id: number | null }) => Number(row.location_id))
          .filter((id) => Number.isFinite(id))
      )
    )
    if (locationIds.length === 0) {
      return NextResponse.json({ data: null, locations_counted: 0 })
    }

    const { data, error } = await supabase.rpc('dashboard_activity', {
      p_location_ids: locationIds,
    })
    if (error) throw error

    return NextResponse.json({ data: data as DashboardActivity })
  } catch (err) {
    console.error('[api/dashboard/activity]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load dashboard activity' },
      { status: 500 }
    )
  }
}
