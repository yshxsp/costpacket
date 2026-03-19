'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

export function ApproveRejectButtons({ expenseId }: { expenseId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  async function update(status: 'APPROVED' | 'REJECTED') {
    setLoading(status === 'APPROVED' ? 'approve' : 'reject')
    const supabase = createClient()
    const { error } = await supabase.from('expenses').update({ status }).eq('id', expenseId)
    
    if (error) {
      toast.error('Failed to update expense: ' + error.message)
    } else {
      toast.success(`Expense ${status.toLowerCase()}!`)
    }
    
    router.refresh()
    setLoading(null)
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
