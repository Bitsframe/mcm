import { authoriseSharedSecret, type SharedSecretResult } from "./shared-secret";

/** Header a scheduled caller must present. */
export const CRON_SECRET_HEADER = "x-cron-secret";

export type CronAuthResult = SharedSecretResult;

/**
 * Authorises a scheduled (server-to-server) request to the reports cron.
 *
 * `CRON_SECRET` is read server-side only. It must never be exposed as
 * `NEXT_PUBLIC_*`, and Supabase's service key is deliberately not used here —
 * an authentication credential and a database credential should not be the
 * same value.
 *
 * See `./shared-secret` for the comparison and fail-closed behaviour.
 */
export function authoriseCronRequest(
  headerValue: string | null | undefined,
  configuredSecret: string | undefined = process.env.CRON_SECRET,
): CronAuthResult {
  return authoriseSharedSecret(headerValue, configuredSecret);
}
