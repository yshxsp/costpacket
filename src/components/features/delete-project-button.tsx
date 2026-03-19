'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function handleDelete() {
    if (!confirm) { setConfirm(true); return }
    setLoading(true)
    const supabase = createClient()
    await supabase.from('projects').delete().eq('id', projectId)
    router.push('/projects')
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        confirm
          ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'
          : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-500/30'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
      {confirm ? 'Confirm Delete' : 'Delete'}
    </button>
  )
}
