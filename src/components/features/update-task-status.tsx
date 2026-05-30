'use client'

import { useState } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateTaskStatus } from '@/app/actions/projects'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', dot: 'bg-pending', text: 'text-pending' },
  { value: 'IN_PROGRESS', label: 'In Progress', dot: 'bg-pending', text: 'text-pending' },
  { value: 'REVIEW', label: 'In Review', dot: 'bg-accent', text: 'text-accent' },
  { value: 'COMPLETED', label: 'Completed', dot: 'bg-approved', text: 'text-approved' },
]

export function UpdateTaskStatusSelect({
  taskId,
  currentStatus,
}: {
  taskId: string
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
      const res = await updateTaskStatus(taskId, status)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Task status updated!')
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const current = STATUS_OPTIONS.find((o) => o.value === currentStatus) ?? STATUS_OPTIONS[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="inline-flex h-10 items-center gap-2 rounded-[3px] border border-rule bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-sunken disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-ink-muted" />
        ) : (
          <span className={cn('h-2 w-2 rounded-full', current.dot)} />
        )}
        <span className={current.text}>{current.label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-faint" strokeWidth={1.75} />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-[3px] border border-rule bg-surface shadow-[0_20px_50px_-20px_rgba(27,26,22,0.5)]">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleUpdate(opt.value)}
              className={cn(
                'flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-sunken',
                opt.value === currentStatus && 'bg-surface-sunken'
              )}
            >
              <span className={cn('h-2 w-2 flex-shrink-0 rounded-full', opt.dot)} />
              <span className={opt.text}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
