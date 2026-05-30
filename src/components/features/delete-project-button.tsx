'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteProject } from '@/app/actions/projects'
import { cn } from '@/lib/utils'

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function handleDelete() {
    if (!confirm) {
      setConfirm(true)
      return
    }
    setLoading(true)
    try {
      const res = await deleteProject(projectId)
      if (res?.error) {
        toast.error(res.error)
        setLoading(false)
        setConfirm(false)
      }
    } catch {
      // deleteProject calls redirect(), which throws internally — this is expected
      router.push('/projects')
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={cn(
        'inline-flex h-10 items-center gap-1.5 rounded-[3px] px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        confirm
          ? 'bg-rejected text-white hover:bg-rejected/90'
          : 'border border-rule bg-surface text-ink-muted hover:border-rejected/40 hover:text-rejected'
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" strokeWidth={1.75} />}
      {confirm ? 'Confirm delete' : 'Delete'}
    </button>
  )
}
