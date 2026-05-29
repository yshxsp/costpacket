'use client'

import { useState } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateProjectStatus } from '@/app/actions/projects'

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
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleUpdate(status: string) {
    if (status === currentStatus) { setOpen(false); return }
    setLoading(true)
    setOpen(false)
    try {
      const res = await updateProjectStatus(projectId, status)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Project status updated!')
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border text-zinc-300 text-sm font-medium hover:bg-muted/60 transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Status
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-40 rounded-lg bg-card border border-border shadow-xl z-10 overflow-hidden">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleUpdate(opt.value)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                opt.value === currentStatus
                  ? 'text-primary bg-primary/10'
                  : 'text-zinc-300 hover:bg-muted/40'
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
