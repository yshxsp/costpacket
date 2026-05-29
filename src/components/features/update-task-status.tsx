'use client'

import { useState } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateTaskStatus } from '@/app/actions/projects'

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', color: 'text-zinc-400' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'text-blue-400' },
  { value: 'REVIEW', label: 'In Review', color: 'text-primary' },
  { value: 'COMPLETED', label: 'Completed', color: 'text-green-400' },
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
    if (status === currentStatus) { setOpen(false); return }
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
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-sm font-medium transition-all hover:bg-muted/60 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
        ) : (
          <span className={`w-2 h-2 rounded-full ${current.color.replace('text-', 'bg-')}`} />
        )}
        <span className={current.color}>{current.label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 rounded-lg bg-card border border-border shadow-xl z-10 overflow-hidden">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleUpdate(opt.value)}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                opt.value === currentStatus
                  ? 'bg-muted/40'
                  : 'hover:bg-muted/40'
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.color.replace('text-', 'bg-')}`} />
              <span className={opt.color}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
