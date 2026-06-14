/**
 * Paddle webhook signature verification (WebCrypto only — runs on the Edge /
 * Cloudflare Workers runtime OpenNext targets; no node:crypto).
 *
 * Header shape:  paddle-signature: ts=<unix-seconds>;h1=<hmac-hex>
 * The signed payload is `${ts}:${rawBody}` HMAC-SHA256'd with the webhook secret.
 * Re-deliveries are re-signed with a fresh ts, so timestamp tolerance bounds
 * replay without breaking legitimate retries.
 */

export interface PaddleEvent {
  event_id: string
  event_type: string
  data?: Record<string, unknown>
  [k: string]: unknown
}

export type VerifyResult =
  | { ok: true; event: PaddleEvent; rawBody: string }
  | { ok: false; status: number; message: string }

export async function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  opts: { toleranceSeconds?: number; now?: () => number } = {}
): Promise<VerifyResult> {
  const toleranceSeconds = opts.toleranceSeconds ?? 300
  const now = opts.now ?? (() => Date.now())

  if (!signatureHeader) return { ok: false, status: 400, message: 'No paddle-signature header' }
  const parsed = parseSignatureHeader(signatureHeader)
  if (!parsed) return { ok: false, status: 400, message: 'Malformed paddle-signature header' }

  const ts = Number(parsed.ts)
  if (!Number.isFinite(ts) || Math.abs(now() / 1000 - ts) > toleranceSeconds) {
    return { ok: false, status: 400, message: 'paddle-signature timestamp outside tolerance' }
  }

  const expected = await hmacSha256Hex(secret, `${parsed.ts}:${rawBody}`)
  if (!timingSafeEqualHex(expected, parsed.h1)) {
    return { ok: false, status: 400, message: 'Invalid signature' }
  }

  let event: PaddleEvent
  try {
    event = JSON.parse(rawBody) as PaddleEvent
  } catch {
    return { ok: false, status: 400, message: 'Body is not valid JSON' }
  }
  if (typeof event?.event_id !== 'string' || typeof event?.event_type !== 'string') {
    return { ok: false, status: 400, message: 'Body is not a Paddle event notification' }
  }
  return { ok: true, event, rawBody }
}

export function parseSignatureHeader(header: string): { ts: string; h1: string } | null {
  let ts: string | undefined
  let h1: string | undefined
  for (const part of header.split(';')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    const key = part.slice(0, eq).trim()
    const value = part.slice(eq + 1).trim()
    if (key === 'ts') ts = value
    else if (key === 'h1' && !h1) h1 = value // first h1 wins during secret rotation
  }
  return ts && h1 ? { ts, h1 } : null
}

export async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Constant-time-ish comparison — never early-exits on a mismatched byte. */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
