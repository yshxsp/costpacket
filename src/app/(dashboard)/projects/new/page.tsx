'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Hammer, ArrowLeft, FolderKanban, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', desc: 'Currently in progress' },
  { value: 'ON_HOLD', label: 'On Hold', desc: 'Temporarily paused' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('ACTIVE')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const name = (fd.get('name') as string).trim()
    const description = (fd.get('description') as string).trim()
    const budget = parseFloat((fd.get('budget') as string) || '0')

    if (!name) {
      setError('Project name is required.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: insertError } = await supabase.from('projects').insert({
      name,
      description: description || null,
      budget,
      status,
      owner_id: user.id,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/projects')
    router.refresh()
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <FolderKanban className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">New Project</h1>
          <p className="text-zinc-400 text-sm">Fill in the details to create a new project</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-zinc-300">
              Project Name <span className="text-orange-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Downtown Office Renovation"
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
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
              placeholder="Brief summary of this project…"
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all resize-none"
            />
          </div>

          {/* Budget */}
          <div className="space-y-1.5">
            <label htmlFor="budget" className="text-sm font-medium text-zinc-300">
              Budget (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
              <input
                id="budget"
                name="budget"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full pl-7 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Initial Status</label>
            <div className="grid grid-cols-2 gap-3">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    status === opt.value
                      ? 'border-orange-500/60 bg-orange-500/10 text-white'
                      : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs mt-0.5 opacity-70">{opt.desc}</div>
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
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-orange-500 text-white font-medium text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <FolderKanban className="w-4 h-4" />
                  Create Project
                </>
              )}
            </button>
            <Link
              href="/projects"
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
