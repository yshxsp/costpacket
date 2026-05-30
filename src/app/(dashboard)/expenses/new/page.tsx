'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Receipt, Loader2, ImagePlus, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/field'

export default function NewExpensePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTaskId = searchParams.get('task_id') ?? ''

  const [loading, setLoading] = useState(false)
  const [parsingAI, setParsingAI] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<{ id: string; title: string }[]>([])
  const [tasksLoaded, setTasksLoaded] = useState(false)

  const [formDataState, setFormDataState] = useState({ description: '', vendor: '', amount: '' })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setParsingAI(true)
    setError(null)

    try {
      const data = new FormData()
      data.append('file', file)

      const { parseReceipt } = await import('@/app/actions/parse-receipt')
      const res = await parseReceipt(data)

      if (res.receiptUrl) setReceiptUrl(res.receiptUrl)
      if (res.error) {
        setError(res.error)
      } else if (res.parsedData) {
        setFormDataState({
          description: res.parsedData.description,
          vendor: res.parsedData.vendor,
          amount: res.parsedData.amount.toString(),
        })
      }
    } catch {
      setError('Failed to process image')
    } finally {
      setParsingAI(false)
    }
  }

  async function loadTasks() {
    if (tasksLoaded) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('assignee_id', user.id)
      .neq('status', 'COMPLETED')
      .order('title')
    setTasks(data ?? [])
    setTasksLoaded(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const description = (fd.get('description') as string).trim()
    const vendor = (fd.get('vendor') as string).trim()
    const amount = parseFloat((fd.get('amount') as string) || '0')
    const task_id = fd.get('task_id') as string

    if (!description || !amount) {
      setError('Description and amount are required.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { error: insertError } = await supabase.from('expenses').insert({
      description,
      vendor: vendor || null,
      amount,
      task_id: task_id || null,
      receipt_url: receiptUrl,
      submitted_by_id: user.id,
      status: 'PENDING',
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    if (task_id) {
      router.push(`/tasks/${task_id}`)
    } else {
      router.push('/expenses')
    }
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl p-6 sm:p-8">
      <Link
        href="/expenses"
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        Back to expenses
      </Link>

      <div className="mb-6 border-b border-rule pb-6">
        <p className="label mb-2">New expense</p>
        <h1 className="font-display text-3xl text-ink">Submit an expense</h1>
        <p className="mt-1 text-sm text-ink-muted">Attach a receipt to auto-fill, then log it for review.</p>
      </div>

      <Card className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Receipt dropzone */}
          <div className="relative overflow-hidden rounded-[3px] border border-dashed border-rule-strong bg-surface-sunken">
            {parsingAI && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-surface/95">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
                <span className="label text-accent">Scanning receipt…</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              disabled={parsingAI}
            />
            <div className="pointer-events-none flex flex-col items-center justify-center gap-2 px-6 py-8 text-center">
              {!receiptUrl ? (
                <>
                  <ImagePlus className="h-7 w-7 text-ink-faint" strokeWidth={1.5} />
                  <h3 className="font-medium text-ink">Upload receipt</h3>
                  <p className="max-w-xs text-xs leading-relaxed text-ink-muted">
                    Attach a photo and we&apos;ll prefill vendor, amount, and description.
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-7 w-7 text-approved" strokeWidth={1.5} />
                  <h3 className="font-medium text-ink">Receipt attached</h3>
                  <p className="text-xs font-medium text-approved">Click to upload a different image.</p>
                </>
              )}
            </div>
          </div>

          <Field label="Description" htmlFor="description">
            <Input
              id="description"
              name="description"
              type="text"
              required
              value={formDataState.description}
              onChange={(e) => setFormDataState((s) => ({ ...s, description: e.target.value }))}
              placeholder="e.g. Copper wiring — 200ft"
            />
          </Field>

          <Field label="Vendor / store" htmlFor="vendor" hint="Optional.">
            <Input
              id="vendor"
              name="vendor"
              type="text"
              value={formDataState.vendor}
              onChange={(e) => setFormDataState((s) => ({ ...s, vendor: e.target.value }))}
              placeholder="e.g. Home Depot"
            />
          </Field>

          <Field label="Amount (USD)" htmlFor="amount">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-faint">$</span>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={formDataState.amount}
                onChange={(e) => setFormDataState((s) => ({ ...s, amount: e.target.value }))}
                placeholder="0.00"
                className="pl-7 font-mono tabular-nums"
              />
            </div>
          </Field>

          <Field label="Linked task" htmlFor="task_id" hint="Optional.">
            <Select id="task_id" name="task_id" defaultValue={defaultTaskId} onFocus={loadTasks}>
              <option value="">No task</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
          </Field>

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
                  Submitting…
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4" strokeWidth={1.75} />
                  Submit expense
                </>
              )}
            </Button>
            <Button asChild variant="outline">
              <Link href="/expenses">Cancel</Link>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
