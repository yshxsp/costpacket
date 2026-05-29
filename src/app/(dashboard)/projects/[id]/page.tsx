import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, FolderKanban, ClipboardList, Users, DollarSign,
  CheckCircle2, Clock, CircleDot, Eye, Plus, Receipt,
} from 'lucide-react'
import { DeleteProjectButton } from '@/components/features/delete-project-button'
import { UpdateProjectStatusButton } from '@/components/features/update-project-status'

const taskStatusConfig = {
  PENDING: { label: 'Pending', color: 'text-zinc-400', bg: 'bg-zinc-500/10', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: CircleDot },
  REVIEW: { label: 'In Review', color: 'text-primary', bg: 'bg-primary/10', icon: Eye },
  COMPLETED: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle2 },
} as const

const projectStatusConfig = {
  ACTIVE: { label: 'Active', color: 'text-primary', dot: 'bg-primary' },
  COMPLETED: { label: 'Completed', color: 'text-green-400', dot: 'bg-green-400' },
  ON_HOLD: { label: 'On Hold', color: 'text-yellow-400', dot: 'bg-yellow-400' },
} as const

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) notFound()

  // Fetch tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, amount, assignee_id')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  // Fetch members
  const { data: members } = await supabase
    .from('project_members')
    .select('user_id, role, users(id, name, email, role)')
    .eq('project_id', id)

  // Fetch expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, amount, status, description, task_id')
    .in('task_id', (tasks ?? []).map((t) => t.id))

  const totalTasks = tasks?.length ?? 0
  const doneTasks = tasks?.filter((t) => t.status === 'COMPLETED').length ?? 0
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const pendingExpenses = expenses?.filter((e) => e.status === 'PENDING').length ?? 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0

  const pStatus = projectStatusConfig[project.status as keyof typeof projectStatusConfig] ?? projectStatusConfig.ACTIVE
  const isOwner = project.owner_id === user.id

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Back */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        All Projects
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
            <FolderKanban className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${pStatus.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pStatus.dot}`} />
                {pStatus.label}
              </span>
            </div>
            {project.description && (
              <p className="text-zinc-400 text-sm max-w-xl">{project.description}</p>
            )}
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <UpdateProjectStatusButton projectId={project.id} currentStatus={project.status} />
            <Link
              href={`/projects/${project.id}/tasks/new`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-[#c96c4f] transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </Link>
            <DeleteProjectButton projectId={project.id} />
          </div>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Budget', value: `$${Number(project.budget).toLocaleString()}`, icon: DollarSign, color: 'text-secondary', bg: 'bg-secondary/10' },
          { label: 'Tasks', value: `${doneTasks} / ${totalTasks}`, icon: ClipboardList, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Team Members', value: members?.length ?? 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Expenses', value: `$${totalExpenses.toLocaleString()}`, icon: Receipt, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-lg bg-card border border-border">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="text-xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="p-5 rounded-lg bg-card border border-border mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Project Progress</span>
            <span className="text-sm text-zinc-400">{pct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-[#e2a083] transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-zinc-500">
            <span>{doneTasks} completed</span>
            <span>{totalTasks - doneTasks} remaining</span>
          </div>
        </div>
      )}

      {/* Tasks + Members grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks list */}
        <div className="lg:col-span-2 p-6 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-foreground">Tasks</h2>
            {pendingExpenses > 0 && (
              <Link
                href="/expenses"
                className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                {pendingExpenses} pending expense{pendingExpenses > 1 ? 's' : ''}
              </Link>
            )}
          </div>

          {!tasks || tasks.length === 0 ? (
            <p className="text-zinc-500 text-sm py-4 text-center">No tasks yet. Create the first one!</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const cfg = taskStatusConfig[task.status as keyof typeof taskStatusConfig] ?? taskStatusConfig.PENDING
                return (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-muted/20 hover:bg-muted/60 border border-border transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                        <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      </div>
                      <span className="text-sm text-foreground font-medium group-hover:text-primary transition-colors">
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium ${cfg.color} hidden sm:block`}>{cfg.label}</span>
                      <span className="text-xs text-zinc-500">${Number(task.amount).toLocaleString()}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Team members */}
        <div className="p-6 rounded-lg bg-card border border-border">
          <h2 className="font-semibold text-foreground mb-5">Team</h2>
          {!members || members.length === 0 ? (
            <p className="text-zinc-500 text-sm">No members assigned.</p>
          ) : (
            <div className="space-y-3">
              {members.map((m) => {
                const u = m.users as { name?: string; email?: string; role?: string } | null
                const initial = u?.name?.[0]?.toUpperCase() ?? u?.email?.[0]?.toUpperCase() ?? '?'
                const name = u?.name ?? u?.email ?? 'Unknown'
                return (
                  <div key={m.user_id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary text-sm font-bold flex-shrink-0">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground font-medium truncate">{name}</p>
                      <p className="text-xs text-zinc-500">{u?.role ?? m.role}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
