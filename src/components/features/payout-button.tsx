'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createPayment } from '@/app/actions/payments'

export function PayoutButton({ taskId }: { taskId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handlePayout() {
    setLoading(true)
    try {
      const res = await createPayment(taskId)
      if (res.error) {
        toast.error(res.error)
      } else {
        // Recorded as PENDING — no money moved. An admin confirms it manually.
        toast.success('Payout recorded as pending', {
          description: 'An admin can mark it paid once the transfer is made.',
        })
        router.refresh()
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePayout}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-[3px] bg-approved px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-approved/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {loading ? 'Processing…' : 'Record payout'}
    </button>
  )
}
