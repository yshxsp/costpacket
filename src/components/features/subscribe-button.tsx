'use client'

import { useEffect, useState } from 'react'
import { initializePaddle, type Paddle } from '@paddle/paddle-js'
import { Loader2 } from 'lucide-react'

/**
 * Opens the Paddle.js checkout overlay. company_id rides in customData so the
 * webhook (the source of truth) can attribute the subscription — access is NOT
 * granted from the browser success callback.
 */
export function SubscribeButton({ companyId, email }: { companyId: string; email: string }) {
  const [paddle, setPaddle] = useState<Paddle>()
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
  const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID
  const environment = process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? 'production' : 'sandbox'

  useEffect(() => {
    if (!token) return
    initializePaddle({ environment, token }).then((p) => p && setPaddle(p))
  }, [token, environment])

  if (!token || !priceId) {
    return <p className="text-sm text-ink-muted">Billing is not configured yet.</p>
  }

  function checkout() {
    paddle?.Checkout.open({
      items: [{ priceId: priceId as string, quantity: 1 }],
      customer: { email },
      customData: { company_id: companyId },
      settings: { successUrl: `${window.location.origin}/billing?status=success` },
    })
  }

  return (
    <button
      onClick={checkout}
      disabled={!paddle}
      className="inline-flex items-center justify-center gap-2 rounded-[3px] bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
    >
      {!paddle ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Subscribe
    </button>
  )
}
