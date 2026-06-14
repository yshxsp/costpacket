'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { markPayoutPaid } from '@/app/actions/payments'

/**
 * Admin/owner control on a PENDING payout. Reveals a reference field, then
 * confirms via the server action. Confirmation is what flips a payout to
 * MARKED_PAID — nothing is paid automatically.
 */
export function MarkPaidButton({ paymentId }: { paymentId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)

  async function confirm() {
    setLoading(true)
    try {
      const res = await markPayoutPaid(paymentId, reference)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Payout marked as paid', {
          description: 'Recorded as paid manually — no funds moved through CostPacket.',
        })
        setOpen(false)
        router.refresh()
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-[3px] border border-rule px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-surface-sunken"
      >
        Mark paid
      </button>
    )
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="Reference (optional)"
        className="w-36 rounded-[3px] border border-rule bg-surface px-2 py-1 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <button
        onClick={confirm}
        disabled={loading}
        className="flex items-center gap-1 rounded-[3px] bg-approved px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-approved/90 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        Confirm
      </button>
      <button
        onClick={() => setOpen(false)}
        className="rounded-[3px] px-2 py-1.5 text-xs text-ink-muted hover:text-ink"
      >
        Cancel
      </button>
    </div>
  )
}
