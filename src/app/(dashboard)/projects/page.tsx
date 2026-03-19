import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  FolderKanban, Plus, ArrowUpRight,
  Clock, CheckCircle2, PauseCircle,
  DollarSign, ClipboardList,
} from 'lucide-react'

const statusConfig = {
  ACTIVE: { label: 'Active', icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10', dot: 'bg-orange-400' },
  COMPLETED: { label: 'Completed', icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', dot: 'bg-green-400' },
  ON_HOLD: { label: 'On Hold', icon: PauseCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', dot: 'bg-yellow-400' },
} as const

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'SUBCONTRACTOR'

  // Fetch projects based on role
  let projectsQuery = supabase
    .from('projects')
    .select('id, name, description, budget, status, created_at, owner_id')
    .order('created_at', { ascending: false })

  if (role === 'CONTRACTOR') {
    projectsQuery = projectsQuery.eq('owner_id', user.id)
  }
  // ADMIN sees all, SUBCONTRACTOR sees projects they're members of (handled by RLS)

  const { data: projects } = await projectsQuery

  // Fetch task counts per project
  const projectIds = projects?.map((p) => p.id) ?? []
  const { data: taskCounts } = await supabase
    .from('tasks')
    .select('project_id, status')
    .in('project_id', projectIds)

  const tasksByProject = (taskCounts ?? []).reduce<
    Record<string, { total: number; done: number }>
  >((acc, t) => {
    if (!acc[t.project_id]) acc[t.project_id] = { total: 0, done: 0 }
    acc[t.project_id].total++
    if (t.status === 'COMPLETED') acc[t.project_id].done++
    return acc
  }, {})

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Projects</h1>
          <p className="text-zinc-400 text-sm">
            {projects?.length ?? 0} project{projects?.length !== 1 ? 's' : ''} in your workspace
          </p>
        </div>
        {role !== 'SUBCONTRACTOR' && (
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        )}
      </div>

      {/* Projects Grid */}
      {!projects || projects.length === 0 ? (
        <EmptyState role={role} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((project) => {
            const cfg = statusConfig[project.status as keyof typeof statusConfig] ?? statusConfig.ACTIVE
            const tasks = tasksByProject[project.id] ?? { total: 0, done: 0 }
            const pct = tasks.total > 0 ? Math.round((tasks.done / tasks.total) * 100) : 0

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md hover:bg-white/8 hover:border-white/10 transition-all flex flex-col gap-4"
              >
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="w-5 h-5 text-indigo-400" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                </div>

                {/* Name + description */}
                <div>
                  <h2 className="font-semibold text-white text-base leading-tight mb-1 group-hover:text-orange-300 transition-colors">
                    {project.name}
                  </h2>
                  {project.description && (
                    <p className="text-zinc-500 text-xs line-clamp-2">{project.description}</p>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    ${Number(project.budget).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5" />
                    {tasks.done}/{tasks.total} tasks
                  </span>
                </div>

                {/* Progress bar */}
                {tasks.total > 0 && (
                  <div className="space-y-1">
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-600">{pct}% complete</p>
                  </div>
                )}

                {/* Status badge */}
                <div className="pt-1 border-t border-white/5 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                  <span className="text-xs text-zinc-600">
                    {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EmptyState({ role }: { role: string }) {
  return (
    <div className="mt-4 p-12 rounded-2xl border border-dashed border-white/10 text-center flex flex-col items-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
        <FolderKanban className="w-8 h-8 text-indigo-400" />
      </div>
      <p className="text-white font-semibold mb-1">No projects yet</p>
      <p className="text-zinc-500 text-sm mb-6 max-w-xs">
        {role !== 'SUBCONTRACTOR'
          ? 'Create your first project and start assigning tasks to your team.'
          : 'You have not been added to any projects yet.'}
      </p>
      {role !== 'SUBCONTRACTOR' && (
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </Link>
      )}
    </div>
  )
}
