import { authoriseSharedSecret, type SharedSecretResult } from "./shared-secret";

/** Header an internal server-to-server caller must present. */
export const INTERNAL_KEY_HEADER = "x-internal-key";

export type InternalAuthResult = SharedSecretResult;

/**
 * Authorises an internal (server-to-server) request carrying `INTERNAL_API_KEY`.
 *
 * Replaces a direct `provided !== process.env.INTERNAL_API_KEY` comparison that
 * was neither constant-time nor fail-closed, and which logged the supplied key
 * on failure — writing credential guesses into the production log stream, since
 * `console.warn` is deliberately preserved by `compiler.removeConsole`.
 *
 * See `./shared-secret` for the comparison and fail-closed behaviour.
 */
export function authoriseInternalRequest(
  headerValue: string | null | undefined,
  configuredSecret: string | undefined = process.env.INTERNAL_API_KEY,
): InternalAuthResult {
  return authoriseSharedSecret(headerValue, configuredSecret);
}
