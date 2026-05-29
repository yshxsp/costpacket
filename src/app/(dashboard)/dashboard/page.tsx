import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import {
  FolderKanban, CheckCircle2, Clock, DollarSign,
  TrendingUp, AlertCircle, ArrowUpRight
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'SUBCONTRACTOR'

  // Fetch stats based on role
  let projectsCount = 0
  let tasksTotal = 0
  let tasksDone = 0
  let expensesPending = 0
  let paymentsTotal = 0

  if (role === 'CONTRACTOR' || role === 'ADMIN') {
    const { count: pc } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id)
    projectsCount = pc ?? 0

    const { count: tt } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
    tasksTotal = tt ?? 0

    const { count: td } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'COMPLETED')
    tasksDone = td ?? 0

    const { count: ep } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING')
    expensesPending = ep ?? 0

    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'PAID')
    paymentsTotal = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0
  } else {
    // Subcontractor: only their assigned tasks and earnings
    const { count: tt } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assignee_id', user.id)
    tasksTotal = tt ?? 0

    const { count: td } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assignee_id', user.id)
      .eq('status', 'COMPLETED')
    tasksDone = td ?? 0

    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('user_id', user.id)
      .eq('status', 'PAID')
    paymentsTotal = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0
  }

  const completionRate = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0

  const stats = role !== 'SUBCONTRACTOR'
    ? [
        { label: 'Active Projects', value: projectsCount, icon: FolderKanban, color: 'text-indigo-400', bg: 'bg-indigo-500/10', href: '/projects' },
        { label: 'Tasks Completed', value: `${tasksDone} / ${tasksTotal}`, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', href: '/tasks' },
        { label: 'Pending Expenses', value: expensesPending, icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', href: '/expenses' },
        { label: 'Total Paid Out', value: `$${paymentsTotal.toLocaleString()}`, icon: DollarSign, color: 'text-orange-400', bg: 'bg-orange-500/10', href: '/payments' },
      ]
    : [
        { label: 'My Tasks', value: tasksTotal, icon: ClipboardList2, color: 'text-indigo-400', bg: 'bg-indigo-500/10', href: '/tasks' },
        { label: 'Completed', value: tasksDone, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', href: '/tasks' },
        { label: 'Completion Rate', value: `${completionRate}%`, icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/10', href: '/tasks' },
        { label: 'Total Earned', value: `$${paymentsTotal.toLocaleString()}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10', href: '/payments' },
      ]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-zinc-400 text-sm">
          Here&apos;s what&apos;s happening across your workspace today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group p-5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md hover:bg-white/8 hover:border-white/10 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-xs text-zinc-500 font-medium">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Progress bar section — only for contractor/admin */}
      {role !== 'SUBCONTRACTOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Task completion */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Task Completion</h2>
              <span className="text-sm text-zinc-400">{completionRate}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-700"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-zinc-500">
              <span>{tasksDone} done</span>
              <span>{tasksTotal - tasksDone} remaining</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
            <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Create new project', href: '/projects/new', color: 'text-indigo-400' },
                { label: 'Review pending expenses', href: '/expenses', color: 'text-yellow-400' },
                { label: 'Process payments', href: '/payments', color: 'text-green-400' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`flex items-center gap-2 text-sm ${action.color} hover:underline transition-all`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state nudge if no data */}
      {tasksTotal === 0 && (
        <div className="mt-8 p-8 rounded-2xl border border-dashed border-white/10 text-center">
          <Clock className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">No data yet</p>
          <p className="text-zinc-600 text-sm mt-1">
            {role !== 'SUBCONTRACTOR'
              ? 'Create your first project to get started.'
              : 'You have no tasks assigned yet.'}
          </p>
          {role !== 'SUBCONTRACTOR' && (
            <Link
              href="/projects/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-all"
            >
              <FolderKanban className="w-4 h-4" />
              New Project
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

// Inline fallback icon (not exported from lucide as ClipboardList2)
function ClipboardList2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
    </svg>
  )
}
