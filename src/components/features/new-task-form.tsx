'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ClipboardList, Loader2 } from 'lucide-react'
import { createTask } from '@/app/actions/create'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea, Select } from '@/components/ui/field'
import { cn } from '@/lib/utils'

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

    const result = await createTask({
      title,
      description: description || null,
      amount,
      status,
      project_id: projectId,
      assignee_id: assignee_id || null,
    })

    const insertError = result.error ? {message:result.error} : null
    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/projects/${projectId}`)
    router.refresh()
  }

  return (
    <Card className="p-6 md:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Field label="Task title" htmlFor="title">
          <Input id="title" name="title" type="text" required placeholder="e.g. Install electrical wiring — Floor 2" />
        </Field>

        <Field label="Description" htmlFor="description" hint="Optional — scope, materials, instructions.">
          <Textarea id="description" name="description" rows={3} placeholder="Scope of work, materials, special instructions…" />
        </Field>

        <Field label="Payment amount (USD)" htmlFor="amount">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-faint">$</span>
            <Input id="amount" name="amount" type="number" min="0" step="0.01" placeholder="0.00" className="pl-7 font-mono tabular-nums" />
          </div>
        </Field>

        {assignees.length > 0 && (
          <Field label="Assign to" htmlFor="assignee_id" hint="Optional.">
            <Select id="assignee_id" name="assignee_id" defaultValue="">
              <option value="">Unassigned</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-ink">Initial status</span>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={cn(
                  'rounded-[3px] border px-3 py-2 text-left text-sm transition-colors',
                  status === opt.value
                    ? 'border-accent bg-accent-soft font-medium text-ink'
                    : 'border-rule bg-surface text-ink-muted hover:bg-surface-sunken hover:text-ink'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-[3px] border border-rejected/30 bg-rejected-soft px-3 py-2 text-sm text-rejected">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <ClipboardList className="h-4 w-4" strokeWidth={1.75} />
                Create task
              </>
            )}
          </Button>
          <Button asChild variant="outline">
            <Link href={`/projects/${projectId}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </Card>
  )
}
