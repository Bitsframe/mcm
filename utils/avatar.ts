/**
 * `profiles.profile_pictures` defaults, at the database level, to a storage URL
 * for a generic `user.png` placeholder — on a host next/image is not configured
 * for, so it 400s and shows nothing. Treat that placeholder (and anything blank)
 * as "no picture" so callers fall back to the bundled avatar.
 */
export function resolveAvatar(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed || /\/user\.png(\?.*)?$/i.test(trimmed)) return null;
  return trimmed;
}
