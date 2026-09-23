import { classifyError } from '@/utils/logging/safe-log';
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { keepPortalLocations } from '@/utils/server/portal-locations'

export const dynamic = 'force-dynamic'

const PAGES = ['patients', 'appointments', 'sales', 'inventory', 'warehouse'] as const
export type StatsPage = (typeof PAGES)[number]

/**
 * Stat tiles for one screen.
 *
 * Which locations count is resolved from user_locations for the signed-in user,
 * never taken from the query string — otherwise a caller could total up a clinic
 * they have no access to. An explicit location_id narrows within that grant.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const page = url.searchParams.get('page')
    if (!page || !PAGES.includes(page as StatsPage)) {
      return NextResponse.json(
        { error: `page must be one of: ${PAGES.join(', ')}` },
        { status: 400 }
      )
    }

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

    const allowed = await keepPortalLocations(
      supabase,
      Array.from(
        new Set(
          (grants ?? [])
            .map((row: { location_id: number | null }) => Number(row.location_id))
            .filter((id) => Number.isFinite(id))
        )
      )
    )

    const raw = url.searchParams.get('location_id')
    let locationIds = allowed
    if (raw && raw !== 'all') {
      const requested = Number(raw)
      if (!Number.isFinite(requested)) {
        return NextResponse.json({ error: 'location_id must be a number' }, { status: 400 })
      }
      if (!allowed.includes(requested)) {
        return NextResponse.json({ error: 'No access to that location' }, { status: 403 })
      }
      locationIds = [requested]
    }

    if (locationIds.length === 0) {
      return NextResponse.json({ data: {}, locations_counted: 0 })
    }

    const { data, error } = await supabase.rpc('page_stats', {
      p_page: page,
      p_location_ids: locationIds,
    })
    if (error) throw error

    return NextResponse.json({
      data: (data ?? {}) as Record<string, number>,
      locations_counted: locationIds.length,
    })
  } catch (err) {
    console.error('[api/stats]', classifyError(err))
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load stats' },
      { status: 500 }
    )
  }
}
