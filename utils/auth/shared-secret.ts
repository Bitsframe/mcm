import { createHash, timingSafeEqual } from "node:crypto";

export type SharedSecretResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; code: string; message: string };

/**
 * Constant-time secret comparison.
 *
 * Both sides are hashed to a fixed-width digest first. `timingSafeEqual` throws
 * when its inputs differ in length, and guarding that with a length check would
 * itself leak the secret's length one request at a time. Digesting makes every
 * comparison the same width, so only equality is observable.
 */
function secretsMatch(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Authorises a server-to-server request carrying a shared secret in a header.
 *
 * Shared by every internal endpoint that has no user session, so they cannot
 * drift apart. Fails closed in both directions:
 *
 * - **No secret configured** -> 503, never "allow". An unset variable must not
 *   silently open the endpoint, which is what a plain
 *   `provided !== process.env.SECRET` comparison does when both sides are
 *   `undefined`.
 * - **No or wrong header** -> 401, with the same message either way. Saying
 *   which of the two failed tells an attacker whether the endpoint is guarded
 *   at all.
 *
 * The caller must never log or return the attempted value: a near-miss secret
 * in a log stream is as good as the secret itself. That is why this returns a
 * fixed message rather than anything derived from the input.
 */
export function authoriseSharedSecret(
  headerValue: string | null | undefined,
  configuredSecret: string | undefined,
): SharedSecretResult {
  const expected = configuredSecret?.trim() ?? "";

  if (!expected) {
    return {
      ok: false,
      status: 503,
      code: "SECRET_NOT_CONFIGURED",
      message: "This endpoint is not available.",
    };
  }

  const provided = headerValue?.trim() ?? "";
  if (!provided || !secretsMatch(provided, expected)) {
    return {
      ok: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "Unauthorized.",
    };
  }

  return { ok: true };
}
