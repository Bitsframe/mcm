/**
 * PHI-safe logging.
 *
 * `compiler.removeConsole` strips `console.log` from production but deliberately
 * keeps `warn` and `error`, because losing those would leave production
 * undiagnosable. That makes every surviving `warn`/`error` a potential disclosure
 * channel, and this app has written patient names, emails, phone numbers,
 * appointment ids and whole upstream response bodies through it.
 *
 * The rule these helpers enforce:
 *
 *   allowed   operational status, error classification, HTTP status,
 *             correlation id, counts
 *   forbidden patient data, appointment data, email/phone/name/DOB,
 *             request or response bodies, tokens, API keys, secrets
 *
 * The point is not to log less, it is to log the same *events* without the
 * payloads. A count of failed sends and an error code diagnose an outage just
 * as well as the recipient list, and cannot leak.
 */

/** Fields safe to emit. Deliberately narrow — anything not listed is excluded. */
export interface SafeFields {
  /** Stable, non-identifying classification, e.g. "EMAIL_SEND_FAILED". */
  code?: string;
  /** HTTP status from an upstream call. */
  status?: number;
  /** Request or job correlation id, if one exists. */
  correlationId?: string;
  /** How many items were affected — an aggregate, never an identifier. */
  count?: number;
}

const ALLOWED: (keyof SafeFields)[] = ["code", "status", "correlationId", "count"];

/**
 * Keeps only whitelisted, scalar fields.
 *
 * A whitelist rather than a denylist: a field added to a call site later is
 * dropped by default instead of silently logged. Non-scalars are rejected even
 * when the key is allowed, so an object cannot ride in on `code`.
 */
function pick(fields: SafeFields | undefined): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (!fields) return out;
  for (const key of ALLOWED) {
    const value = fields[key];
    if (typeof value === "string" || typeof value === "number") out[key] = value;
  }
  return out;
}

/**
 * Classifies an unknown thrown value without exposing its contents.
 *
 * Supabase's `PostgrestError` carries `details` and `hint`, which routinely
 * embed row values — "Key (email)=(a@b.com) already exists" — so the message is
 * never included. Only the error's `code` (when it is a short, non-identifying
 * token) and its constructor name come through.
 */
export function classifyError(err: unknown): { code: string; kind: string } {
  const kind =
    err instanceof Error ? err.constructor.name
    : err === null ? "null"
    : typeof err;

  const raw = (err as { code?: unknown } | null)?.code;
  const code =
    typeof raw === "string" && raw.length <= 32 && /^[A-Za-z0-9_.-]+$/.test(raw)
      ? raw
      : "UNKNOWN";

  return { code, kind };
}

/** Logs an operational error. Never accepts a payload. */
export function logError(event: string, fields?: SafeFields): void {
  console.error(event, pick(fields));
}

/** Logs an operational warning. Never accepts a payload. */
export function logWarn(event: string, fields?: SafeFields): void {
  console.warn(event, pick(fields));
}
