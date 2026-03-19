'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, Loader2 } from 'lucide-react'
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
        toast.success('Payout initiated successfully!', {
          description: 'The funds are on the way to the subcontractor.'
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
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <DollarSign className="w-4 h-4" />
      )}
      {loading ? 'Processing...' : 'Send Payout'}
    </button>
  )
}
