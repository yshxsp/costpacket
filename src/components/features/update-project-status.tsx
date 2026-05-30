'use client'

import { useState } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateProjectStatus } from '@/app/actions/projects'
import { cn } from '@/lib/utils'

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
    if (status === currentStatus) {
      setOpen(false)
      return
    }
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
        className="inline-flex h-10 items-center gap-1.5 rounded-[3px] border border-rule bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-sunken disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Status
        <ChevronDown className="h-3.5 w-3.5 text-ink-faint" strokeWidth={1.75} />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-[3px] border border-rule bg-surface shadow-[0_20px_50px_-20px_rgba(27,26,22,0.5)]">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleUpdate(opt.value)}
              className={cn(
                'w-full px-4 py-2.5 text-left text-sm transition-colors',
                opt.value === currentStatus
                  ? 'bg-accent-soft text-accent'
                  : 'text-ink hover:bg-surface-sunken'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
