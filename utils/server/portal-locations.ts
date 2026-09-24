/**
 * Server-side counterpart of utils/locations.ts.
 *
 * A location is part of this app only while `location_configurations.portal_enabled`
 * is true; a location without a row is off. API routes that total figures over
 * "the user's locations" pass their granted ids through here so a location that
 * is switched off for the portal never counts, whatever user_locations says.
 */
export async function keepPortalLocations(
  supabase: { from: (table: string) => any },
  ids: number[]
): Promise<number[]> {
  if (ids.length === 0) return ids
  const { data, error } = await supabase
    .from('location_configurations')
    .select('location_id')
    .eq('portal_enabled', true)
    .in('location_id', ids)
  if (error) throw error
  const enabled = new Set((data ?? []).map((row: { location_id: number }) => Number(row.location_id)))
  return ids.filter((id) => enabled.has(id))
}
