'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
]

export function UpdateProjectStatusButton({
  projectId,
  currentStatus,
}: {
  projectId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function updateStatus(status: string) {
    if (status === currentStatus) { setOpen(false); return }
    setLoading(true)
    setOpen(false)
    const supabase = createClient()
    await supabase.from('projects').update({ status }).eq('id', projectId)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium hover:bg-white/10 transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Status
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-40 rounded-xl bg-zinc-900 border border-white/10 shadow-xl z-10 overflow-hidden">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateStatus(opt.value)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                opt.value === currentStatus
                  ? 'text-orange-400 bg-orange-500/10'
                  : 'text-zinc-300 hover:bg-white/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
