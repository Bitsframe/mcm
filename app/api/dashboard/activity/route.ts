import { classifyError } from '@/utils/logging/safe-log';
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { resolveDashboardLocations } from '@/utils/server/dashboard-locations'
import { isSuperAdmin } from '@/utils/server/roles'

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
 * Locations come from user_locations for the signed-in user; an optional
 * location_id narrows to one, but only after it is checked against that grant,
 * so the panels can only ever show clinics the viewer may see.
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

    // Every panel below the tiles is a company figure: revenue trend, stock
    // levels, pending approvals. None of it is shown to anyone but a super
    // admin, so the query is not even run.
    if (!(await isSuperAdmin(supabase, user.id))) {
      return NextResponse.json({ data: null, restricted: true })
    }

    if (locationIds.length === 0) {
      return NextResponse.json({ data: null, locations_counted: 0 })
    }

    const { data, error } = await supabase.rpc('dashboard_activity', {
      p_location_ids: locationIds,
    })
    if (error) throw error

    return NextResponse.json({ data: data as DashboardActivity })
  } catch (err) {
    console.error('[api/dashboard/activity]', classifyError(err))
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load dashboard activity' },
      { status: 500 }
    )
  }
}
