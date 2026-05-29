'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ClipboardList, Loader2, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'REVIEW', label: 'In Review' },
  { value: 'COMPLETED', label: 'Completed' },
]

interface Assignee {
  id: string
  label: string
}

export function NewTaskForm({
  projectId,
  assignees,
}: {
  projectId: string
  assignees: Assignee[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('PENDING')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const title = (fd.get('title') as string).trim()
    const description = (fd.get('description') as string).trim()
    const amount = parseFloat((fd.get('amount') as string) || '0')
    const assignee_id = fd.get('assignee_id') as string

    if (!title) {
      setError('Task title is required.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: insertError } = await supabase.from('tasks').insert({
      title,
      description: description || null,
      amount,
      status,
      project_id: projectId,
      assignee_id: assignee_id || null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/projects/${projectId}`)
    router.refresh()
  }

  return (
    <div className="bg-card border border-border rounded-lg p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-sm font-medium text-zinc-300">
            Task Title <span className="text-primary">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="e.g. Install electrical wiring — Floor 2"
            className="w-full px-4 py-2.5 rounded-lg bg-[#11120e] border border-border text-foreground placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium text-zinc-300">
            Description <span className="text-zinc-600">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Scope of work, materials, special instructions…"
            className="w-full px-4 py-2.5 rounded-lg bg-[#11120e] border border-border text-foreground placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none"
          />
        </div>

        {/* Payment Amount */}
        <div className="space-y-1.5">
          <label htmlFor="amount" className="text-sm font-medium text-zinc-300">
            Payment Amount (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
            <input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full pl-7 pr-4 py-2.5 rounded-lg bg-[#11120e] border border-border text-foreground placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Assignee */}
        {assignees.length > 0 && (
          <div className="space-y-1.5">
            <label htmlFor="assignee_id" className="text-sm font-medium text-zinc-300">
              Assign To <span className="text-zinc-600">(optional)</span>
            </label>
            <div className="relative">
              <select
                id="assignee_id"
                name="assignee_id"
                defaultValue=""
                className="w-full appearance-none px-4 py-2.5 rounded-lg bg-[#11120e] border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all pr-9"
              >
                <option value="" className="bg-zinc-900">Unassigned</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id} className="bg-zinc-900">
                    {a.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">Initial Status</label>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`py-2 px-3 rounded-lg border text-left text-sm transition-all ${
                  status === opt.value
                    ? 'border-primary/60 bg-primary/10 text-foreground font-medium'
                    : 'border-border bg-card text-zinc-400 hover:bg-muted/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-[#c96c4f] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <ClipboardList className="w-4 h-4" />
                Create Task
              </>
            )}
          </button>
          <Link
            href={`/projects/${projectId}`}
            className="px-5 py-2.5 rounded-lg bg-card border border-border text-zinc-400 hover:text-foreground hover:bg-muted/60 text-sm font-medium transition-all"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
