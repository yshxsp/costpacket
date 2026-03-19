'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Receipt, Loader2, ChevronDown, ImagePlus, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

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
  
  // Use uncontrolled refs or state for form fields to handle auto-fill
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
    } catch (err) {
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
    if (!user) { router.push('/login'); return }

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
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/expenses"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Expenses
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Submit Expense</h1>
          <p className="text-zinc-400 text-sm">Log an expense for review and payout</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AI Parsing Upload */}
          <div className="p-5 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5 relative overflow-hidden transition-all duration-300">
            {parsingAI && (
              <div className="absolute inset-0 bg-indigo-500/10 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                <span className="text-sm font-medium text-indigo-300">AI is scanning receipt...</span>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              disabled={parsingAI}
            />
            <div className="flex flex-col items-center justify-center text-center gap-2 pointer-events-none">
              {!receiptUrl ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-1">
                    <ImagePlus className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-white font-medium">Upload Receipt (Magic Autofill)</h3>
                  <p className="text-zinc-400 text-xs max-w-xs leading-relaxed">
                    Upload a photo of your receipt and our AI will instantly extract the vendor, amount, and details.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-1">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-white font-medium">Receipt Processing Complete</h3>
                  <p className="text-green-400 text-xs font-medium">Click here to upload a different image.</p>
                </>
              )}
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-medium text-zinc-300">
              Description <span className="text-orange-500">*</span>
            </label>
            <input
              id="description"
              name="description"
              type="text"
              required
              value={formDataState.description}
              onChange={(e) => setFormDataState(s => ({ ...s, description: e.target.value }))}
              placeholder="e.g. Copper wiring — 200ft"
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
            />
          </div>

          {/* Vendor */}
          <div className="space-y-1.5">
            <label htmlFor="vendor" className="text-sm font-medium text-zinc-300">
              Vendor / Store <span className="text-zinc-600">(optional)</span>
            </label>
            <input
              id="vendor"
              name="vendor"
              type="text"
              value={formDataState.vendor}
              onChange={(e) => setFormDataState(s => ({ ...s, vendor: e.target.value }))}
              placeholder="e.g. Home Depot"
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
            />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label htmlFor="amount" className="text-sm font-medium text-zinc-300">
              Amount (USD) <span className="text-orange-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
              <input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={formDataState.amount}
                onChange={(e) => setFormDataState(s => ({ ...s, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full pl-7 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
              />
            </div>
          </div>

          {/* Task */}
          <div className="space-y-1.5">
            <label htmlFor="task_id" className="text-sm font-medium text-zinc-300">
              Linked Task <span className="text-zinc-600">(optional)</span>
            </label>
            <div className="relative">
              <select
                id="task_id"
                name="task_id"
                defaultValue={defaultTaskId}
                onFocus={loadTasks}
                className="w-full appearance-none px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all pr-9"
              >
                <option value="" className="bg-zinc-900">No task</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id} className="bg-zinc-900">{t.title}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
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
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-orange-500 text-white font-medium text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  Submit Expense
                </>
              )}
            </button>
            <Link
              href="/expenses"
              className="px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 text-sm font-medium transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
