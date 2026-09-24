import { keepPortalLocations } from '@/utils/server/portal-locations'

/**
 * Which locations a dashboard request may total up.
 *
 * Both dashboard routes need the same answer, and getting it wrong in one of
 * them would leak another clinic's figures, so the rule lives here once:
 *
 *   1. start from what user_locations grants the signed-in user,
 *   2. drop anything switched off for the portal,
 *   3. if the caller asked for a single location, it must be inside that set.
 *
 * The requested id is never trusted on its own — an unknown or ungranted id is
 * refused rather than quietly widened back to "everything the user can see".
 */
export type DashboardLocations =
  | { ok: true; locationIds: number[] }
  | { ok: false; status: 400 | 403; error: string }

export async function resolveDashboardLocations(
  supabase: { from: (table: string) => any },
  userId: string,
  requestUrl: string
): Promise<DashboardLocations> {
  const { data: grants, error: grantsError } = await supabase
    .from('user_locations')
    .select('location_id')
    .eq('profile_id', userId)
  if (grantsError) throw grantsError

  const allowed = await keepPortalLocations(
    supabase,
    Array.from(
      new Set(
        (grants ?? [])
          .map((row: { location_id: number | null }) => Number(row.location_id))
          .filter((id: number) => Number.isFinite(id))
      )
    )
  )

  const raw = new URL(requestUrl).searchParams.get('location_id')
  const wantsOne = raw !== null && raw !== '' && raw !== 'all'
  if (!wantsOne) return { ok: true, locationIds: allowed }

  const requested = Number(raw)
  if (!Number.isFinite(requested)) {
    return { ok: false, status: 400, error: 'location_id must be a number' }
  }
  if (!allowed.includes(requested)) {
    return { ok: false, status: 403, error: 'No access to that location' }
  }
  return { ok: true, locationIds: [requested] }
}
