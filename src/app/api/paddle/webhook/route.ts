import { NextRequest } from 'next/server'
import { verifyPaddleSignature } from '@/lib/paddle/verify'
import { mapSubscriptionEvent } from '@/lib/paddle/events'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * Paddle webhook — the source of truth for subscription state. Browser checkout
 * success grants nothing; access flips only when a verified event lands here.
 *
 * Flow: verify HMAC signature → record the event by event_id (idempotency) →
 * if it's a subscription.* event, upsert the company's subscription row. All
 * writes use the service role (clients cannot touch these tables).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET
  if (!secret) {
    console.error('paddle webhook: PADDLE_WEBHOOK_SECRET not configured')
    return new Response('Billing not configured', { status: 500 })
  }

  const rawBody = await request.text()
  const verified = await verifyPaddleSignature(
    rawBody,
    request.headers.get('paddle-signature'),
    secret
  )
  if (!verified.ok) {
    return new Response(verified.message, { status: verified.status })
  }

  const admin = createAdminClient()
  if (!admin) {
    console.error('paddle webhook: service role not configured')
    return new Response('Billing not configured', { status: 500 })
  }

  const { event } = verified
  const data = (event.data ?? {}) as Record<string, unknown>
  const custom = (data.custom_data ?? {}) as Record<string, unknown>
  const companyId = typeof custom.company_id === 'string' ? custom.company_id : null

  // Idempotency: the event_id unique constraint makes a replay a no-op.
  const { error: insertErr } = await admin.from('billing_events').insert({
    event_id: event.event_id,
    event_type: event.event_type,
    company_id: companyId,
    payload: event as unknown as Record<string, unknown>,
  })

  if (insertErr) {
    // 23505 = already recorded → Paddle re-delivery; acknowledge without re-applying.
    if (insertErr.code === '23505') {
      return new Response('ok (duplicate)', { status: 200 })
    }
    console.error('paddle webhook: failed to record event', insertErr.message)
    return new Response('Failed to record event', { status: 500 })
  }

  const sub = mapSubscriptionEvent(event)
  if (sub) {
    const { error: upsertErr } = await admin.from('subscriptions').upsert(
      {
        company_id: sub.companyId,
        status: sub.status,
        paddle_subscription_id: sub.subscriptionId,
        paddle_customer_id: sub.customerId,
        price_id: sub.priceId,
        current_period_end: sub.currentPeriodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'company_id' }
    )
    if (upsertErr) {
      console.error('paddle webhook: failed to upsert subscription', upsertErr.message)
      return new Response('Failed to apply subscription', { status: 500 })
    }
  }

  return new Response('ok', { status: 200 })
}
