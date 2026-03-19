import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="w-full h-full min-h-[50vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      <p className="text-sm font-medium text-zinc-400">Loading data...</p>
    </div>
  )
}
