'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getPortalUrl } from '@/app/actions/billing'

/** Opens the Paddle customer portal (update card / cancel). */
export function ManageBillingButton() {
  const [loading, setLoading] = useState(false)

  async function open() {
    setLoading(true)
    try {
      const res = await getPortalUrl()
      if (res.error || !res.url) {
        toast.error(res.error ?? 'Billing portal unavailable.')
        return
      }
      window.location.href = res.url
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={open}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-[3px] border border-rule px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-sunken disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Manage subscription
    </button>
  )
}
