import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ClipboardList, ArrowUpRight, CheckCircle2,
  Clock, CircleDot, Eye, FolderKanban,
} from 'lucide-react'

const statusConfig = {
  PENDING: { label: 'Pending', color: 'text-zinc-400', bg: 'bg-zinc-500/10', dot: 'bg-zinc-400', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10', dot: 'bg-blue-400', icon: CircleDot },
  REVIEW: { label: 'In Review', color: 'text-orange-400', bg: 'bg-orange-500/10', dot: 'bg-orange-400', icon: Eye },
  COMPLETED: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10', dot: 'bg-green-400', icon: CheckCircle2 },
} as const

type StatusKey = keyof typeof statusConfig
const ALL_STATUSES = Object.keys(statusConfig) as StatusKey[]

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; project?: string }>
}) {
  const { status: filterStatus, project: filterProject } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  const role = profile?.role ?? 'SUBCONTRACTOR'

  // Build query
  let query = supabase
    .from('tasks')
    .select(`
      id, title, status, amount, created_at,
      project_id,
      projects (id, name),
      assignee_id,
      users (id, name, email)
    `)
    .order('created_at', { ascending: false })

  if (role === 'SUBCONTRACTOR') {
    query = query.eq('assignee_id', user.id)
  }
  if (filterStatus && ALL_STATUSES.includes(filterStatus as StatusKey)) {
    query = query.eq('status', filterStatus)
  }
  if (filterProject) {
    query = query.eq('project_id', filterProject)
  }

  const { data: tasks } = await query

  // Unique projects for filter dropdown
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .order('name')

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Tasks</h1>
          <p className="text-zinc-400 text-sm">
            {tasks?.length ?? 0} task{tasks?.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Status filter */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
          <FilterLink href="?" active={!filterStatus} label="All" />
          {ALL_STATUSES.map((s) => (
            <FilterLink
              key={s}
              href={`?status=${s}${filterProject ? `&project=${filterProject}` : ''}`}
              active={filterStatus === s}
              label={statusConfig[s].label}
              color={statusConfig[s].color}
            />
          ))}
        </div>

        {/* Project filter */}
        {projects && projects.length > 0 && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
            <FilterLink
              href={filterStatus ? `?status=${filterStatus}` : '?'}
              active={!filterProject}
              label="All Projects"
            />
            {projects.map((p) => (
              <FilterLink
                key={p.id}
                href={`?project=${p.id}${filterStatus ? `&status=${filterStatus}` : ''}`}
                active={filterProject === p.id}
                label={p.name}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tasks table */}
      {!tasks || tasks.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Task</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden md:table-cell">Project</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden sm:table-cell">Assignee</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Amount</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tasks.map((task) => {
                const cfg = statusConfig[task.status as StatusKey] ?? statusConfig.PENDING
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const project = (task.projects as any) as { id: string; name: string } | null
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const assignee = (task.users as any) as { name?: string; email?: string } | null
                return (
                  <tr key={task.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-white group-hover:text-orange-300 transition-colors">{task.title}</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      {project ? (
                        <Link
                          href={`/projects/${project.id}`}
                          className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-indigo-400 transition-colors"
                        >
                          <FolderKanban className="w-3 h-3" />
                          {project.name}
                        </Link>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-xs text-zinc-400">
                        {assignee ? (assignee.name ?? assignee.email) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-medium text-white">${Number(task.amount).toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Open
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FilterLink({
  href,
  active,
  label,
  color,
}: {
  href: string
  active: boolean
  label: string
  color?: string
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active
          ? 'bg-white/10 text-white'
          : `text-zinc-500 hover:text-zinc-300 ${color ?? ''}`
      }`}
    >
      {label}
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="mt-4 p-12 rounded-2xl border border-dashed border-white/10 text-center flex flex-col items-center">
      <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
        <ClipboardList className="w-8 h-8 text-orange-400" />
      </div>
      <p className="text-white font-semibold mb-1">No tasks found</p>
      <p className="text-zinc-500 text-sm">Try adjusting your filters or create a task from a project.</p>
    </div>
  )
}
