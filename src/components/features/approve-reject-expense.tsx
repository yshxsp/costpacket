'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateExpenseStatus } from '@/app/actions/expenses'

export function ApproveRejectButtons({ expenseId }: { expenseId: string }) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  async function update(status: 'APPROVED' | 'REJECTED') {
    setLoading(status === 'APPROVED' ? 'approve' : 'reject')
    try {
      const res = await updateExpenseStatus(expenseId, status)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Expense ${status.toLowerCase()}!`)
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => update('APPROVED')}
        disabled={!!loading}
        title="Approve"
        className="w-8 h-8 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 flex items-center justify-center transition-all disabled:opacity-50"
      >
        {loading === 'approve' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CheckCircle className="w-4 h-4" />
        )}
      </button>
      <button
        onClick={() => update('REJECTED')}
        disabled={!!loading}
        title="Reject"
        className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all disabled:opacity-50"
      >
        {loading === 'reject' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <XCircle className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}
