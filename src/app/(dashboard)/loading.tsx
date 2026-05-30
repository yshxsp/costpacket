import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4">
      <Loader2 className="h-7 w-7 animate-spin text-ink-faint" />
      <p className="label">Loading…</p>
    </div>
  )
}
