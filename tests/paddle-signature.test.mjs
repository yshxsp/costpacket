// Paddle billing unit tests (no framework — run with `npm run test:paddle`).
// Node ≥23.6 strips the type annotations from the imported .ts modules.
import assert from 'node:assert/strict'
import { verifyPaddleSignature, hmacSha256Hex } from '../src/lib/paddle/verify.ts'
import { mapSubscriptionEvent } from '../src/lib/paddle/events.ts'

const secret = 'whsec_test_secret'
const body = JSON.stringify({
  event_id: 'evt_1',
  event_type: 'subscription.activated',
  data: { id: 'sub_1', status: 'active', custom_data: { company_id: 'co_1' } },
})
const ts = Math.floor(Date.now() / 1000).toString()
const h1 = await hmacSha256Hex(secret, `${ts}:${body}`)
const goodHeader = `ts=${ts};h1=${h1}`

// --- signature verification ---
let r = await verifyPaddleSignature(body, goodHeader, secret)
assert.equal(r.ok, true, 'a correctly signed payload must verify')
assert.equal(r.ok && r.event.event_id, 'evt_1')

r = await verifyPaddleSignature(body + 'tampered', goodHeader, secret)
assert.equal(r.ok, false, 'a tampered body must fail')

r = await verifyPaddleSignature(body, goodHeader, 'wrong_secret')
assert.equal(r.ok, false, 'a wrong secret must fail')

const oldTs = (Math.floor(Date.now() / 1000) - 10000).toString()
const oldH1 = await hmacSha256Hex(secret, `${oldTs}:${body}`)
r = await verifyPaddleSignature(body, `ts=${oldTs};h1=${oldH1}`, secret)
assert.equal(r.ok, false, 'a stale timestamp must fail (replay window)')

r = await verifyPaddleSignature(body, null, secret)
assert.equal(r.ok, false, 'a missing header must fail')

// --- event mapping ---
const canceled = mapSubscriptionEvent({
  event_id: 'e',
  event_type: 'subscription.canceled',
  data: {
    id: 'sub_1',
    status: 'canceled',
    customer_id: 'ctm_1',
    custom_data: { company_id: 'co_1' },
    items: [{ price: { id: 'pri_x' } }],
    current_billing_period: { ends_at: '2026-07-01T00:00:00Z' },
  },
})
assert.equal(canceled?.companyId, 'co_1')
assert.equal(canceled?.status, 'canceled')
assert.equal(canceled?.priceId, 'pri_x')
assert.equal(canceled?.currentPeriodEnd, '2026-07-01T00:00:00Z')

assert.equal(
  mapSubscriptionEvent({ event_id: 'e', event_type: 'transaction.completed', data: { custom_data: { company_id: 'x' } } }),
  null,
  'non-subscription events are ignored'
)
assert.equal(
  mapSubscriptionEvent({ event_id: 'e', event_type: 'subscription.activated', data: { status: 'active' } }),
  null,
  'events without company_id are ignored'
)

console.log('✓ paddle signature + mapping tests passed')
