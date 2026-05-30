'use client'

import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
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
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => update('APPROVED')}
        disabled={!!loading}
        title="Approve"
        className="flex h-8 w-8 items-center justify-center rounded-[3px] border border-approved/30 bg-approved-soft text-approved transition-colors hover:bg-approved/15 disabled:opacity-50"
      >
        {loading === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={2} />}
      </button>
      <button
        onClick={() => update('REJECTED')}
        disabled={!!loading}
        title="Reject"
        className="flex h-8 w-8 items-center justify-center rounded-[3px] border border-rejected/30 bg-rejected-soft text-rejected transition-colors hover:bg-rejected/15 disabled:opacity-50"
      >
        {loading === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" strokeWidth={2} />}
      </button>
    </div>
  )
}
