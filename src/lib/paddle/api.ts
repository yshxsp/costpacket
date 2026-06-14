/**
 * Minimal Paddle Billing REST client (plain fetch). Used server-side only — the
 * API key never reaches the browser. Currently just the customer portal session
 * for "manage subscription".
 */
const BASE = {
  sandbox: 'https://sandbox-api.paddle.com',
  production: 'https://api.paddle.com',
} as const

function baseUrl() {
  return process.env.PADDLE_ENV === 'production' ? BASE.production : BASE.sandbox
}

/** Returns a Paddle-hosted customer portal URL, or null if billing isn't configured. */
export async function createPortalSession(
  customerId: string,
  subscriptionId?: string | null
): Promise<string | null> {
  const apiKey = process.env.PADDLE_API_KEY
  if (!apiKey) return null

  const res = await fetch(`${baseUrl()}/customers/${customerId}/portal-sessions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify(subscriptionId ? { subscription_ids: [subscriptionId] } : {}),
  })
  if (!res.ok) {
    console.error('paddle portal-session failed', res.status)
    return null
  }
  const json = (await res.json().catch(() => null)) as
    | { data?: { urls?: { general?: { overview?: string } } } }
    | null
  return json?.data?.urls?.general?.overview ?? null
}
