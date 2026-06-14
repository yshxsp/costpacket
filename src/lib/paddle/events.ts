import type { PaddleEvent } from './verify'

/**
 * Pure mapping from a verified Paddle event to a subscription upsert. Returns
 * null for events we don't act on. The webhook stays thin: verify → map → write.
 *
 * company_id is carried in custom_data (set at checkout). Paddle echoes it back
 * on the subscription + transaction entities, so the webhook — not the browser —
 * is the source of truth for which company a subscription belongs to.
 */

export type SubStatus = 'trialing' | 'active' | 'past_due' | 'paused' | 'canceled'

export interface SubscriptionUpsert {
  companyId: string
  status: SubStatus
  subscriptionId: string | null
  customerId: string | null
  priceId: string | null
  currentPeriodEnd: string | null
}

const SUBSCRIPTION_EVENTS = new Set([
  'subscription.created',
  'subscription.activated',
  'subscription.updated',
  'subscription.past_due',
  'subscription.paused',
  'subscription.canceled',
  'subscription.resumed',
  'subscription.trialing',
])

const VALID_STATUS: ReadonlySet<string> = new Set([
  'trialing',
  'active',
  'past_due',
  'paused',
  'canceled',
])

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {}
}

function companyIdFrom(data: Record<string, unknown>): string | null {
  const custom = asRecord(data.custom_data)
  const id = custom.company_id
  return typeof id === 'string' && id.length > 0 ? id : null
}

/** Map a Paddle subscription.* event to an upsert, or null to ignore. */
export function mapSubscriptionEvent(event: PaddleEvent): SubscriptionUpsert | null {
  if (!SUBSCRIPTION_EVENTS.has(event.event_type)) return null
  const data = asRecord(event.data)

  const companyId = companyIdFrom(data)
  if (!companyId) return null // can't attribute → ignore (logged upstream)

  // data.status is authoritative; fall back to deriving from the event name.
  let status = String(data.status ?? '').toLowerCase()
  if (!VALID_STATUS.has(status)) {
    if (event.event_type === 'subscription.canceled') status = 'canceled'
    else if (event.event_type === 'subscription.past_due') status = 'past_due'
    else if (event.event_type === 'subscription.paused') status = 'paused'
    else if (event.event_type === 'subscription.resumed') status = 'active'
    else status = 'active'
  }

  const items = Array.isArray(data.items) ? (data.items as unknown[]) : []
  const firstPrice = items.length > 0 ? asRecord(asRecord(items[0]).price).id : undefined
  const period = asRecord(data.current_billing_period).ends_at

  return {
    companyId,
    status: status as SubStatus,
    subscriptionId: typeof data.id === 'string' ? data.id : null,
    customerId: typeof data.customer_id === 'string' ? data.customer_id : null,
    priceId: typeof firstPrice === 'string' ? firstPrice : null,
    currentPeriodEnd: typeof period === 'string' ? period : null,
  }
}
