/**
 * Which locations the POS can sell from.
 *
 * The source of truth is `location_configurations.portal_enabled` — this app is
 * the portal. A location with no configuration row is off. `portalIds` is the
 * set of enabled ids from fetchPortalLocationIds(); when it is null the table
 * could not be read, and every active location is shown rather than none, so a
 * transient read failure degrades to "too many" instead of an empty app.
 * Inactive locations never show.
 */
export function isPosLocation(
  location: { id?: number | string; is_active?: boolean | null },
  portalIds: Set<number> | null
): boolean {
  if (location.is_active === false) return false;
  if (portalIds) return portalIds.has(Number(location.id));
  return true;
}
