/**
 * Server-side client for mcm-bridge.
 *
 * Server-only by convention rather than by the `server-only` package: this repo has a
 * pre-existing peer conflict that blocks adding one. BRIDGE_API_KEY has no
 * NEXT_PUBLIC_ prefix, so Next never bundles it into client code.
 *
 * The bridge owns both Supabase projects and the rules for which one a record
 * belongs in. Its API key is a server secret, so browser code must never call it
 * directly — requests go through this app's own /api routes.
 */

export class BridgeError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown
  ) {
    super(message)
    this.name = 'BridgeError'
  }
}

function bridgeConfig(): { baseUrl: string; apiKey: string } {
  const baseUrl = process.env.BRIDGE_URL?.trim().replace(/\/$/, '')
  const apiKey = process.env.BRIDGE_API_KEY?.trim()

  if (!baseUrl || !apiKey) {
    throw new BridgeError('Bridge is not configured (BRIDGE_URL / BRIDGE_API_KEY)', 500)
  }
  return { baseUrl, apiKey }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const { baseUrl, apiKey } = bridgeConfig()

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { ...(init.headers ?? {}), 'x-bridge-key': apiKey },
      cache: 'no-store',
    })
  } catch (err) {
    throw new BridgeError(
      `Bridge unreachable: ${err instanceof Error ? err.message : String(err)}`,
      502
    )
  }

  const text = await response.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = { message: text }
  }

  if (!response.ok) {
    const record = (body ?? {}) as { message?: unknown; error?: unknown }
    const raw = record.message ?? record.error
    const message = Array.isArray(raw)
      ? raw.join(', ')
      : typeof raw === 'string'
        ? raw
        : `Bridge request failed (${response.status})`
    throw new BridgeError(message, response.status, body)
  }

  return body as T
}

export function bridgeGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' })
}

export function bridgePost<T>(path: string, payload: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function bridgePatch<T>(path: string, payload: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export type PatientStoreResult = {
  store: string
  ok: boolean
  id?: string
  action?: 'created' | 'updated'
  reason?: string
}

export type PatientCreateResult = {
  source: string
  stores: PatientStoreResult[]
}
