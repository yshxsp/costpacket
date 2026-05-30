import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { DeleteProjectButton } from '@/components/features/delete-project-button'
import { UpdateProjectStatusButton } from '@/components/features/update-project-status'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Stamp, statusTone, statusLabel } from '@/components/ui/status'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
  if (!project) notFound()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, amount, assignee_id')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  const { data: members } = await supabase
    .from('project_members')
    .select('user_id, role, users(id, name, email, role)')
    .eq('project_id', id)

  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, amount, status, description, task_id')
    .in('task_id', (tasks ?? []).map((t) => t.id))

  const totalTasks = tasks?.length ?? 0
  const doneTasks = tasks?.filter((t) => t.status === 'COMPLETED').length ?? 0
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const pendingExpenses = expenses?.filter((e) => e.status === 'PENDING').length ?? 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0
  const isOwner = project.owner_id === user.id

  const kpis = [
    { label: 'Budget', value: `$${Number(project.budget).toLocaleString()}` },
    { label: 'Tasks', value: `${doneTasks} / ${totalTasks}` },
    { label: 'Team', value: members?.length ?? 0 },
    { label: 'Expenses', value: `$${totalExpenses.toLocaleString()}` },
  ]

  return (
    <div className="mx-auto max-w-6xl p-6 sm:p-8">
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        All projects
      </Link>

      <div className="mb-8 flex flex-col gap-4 border-b border-rule pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl tracking-tight text-ink">{project.name}</h1>
            <Stamp tone={statusTone(project.status)}>{statusLabel(project.status)}</Stamp>
          </div>
          {project.description && <p className="mt-1 max-w-xl text-sm text-ink-muted">{project.description}</p>}
        </div>

        {isOwner && (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
            <UpdateProjectStatusButton projectId={project.id} currentStatus={project.status} />
            <Button asChild>
              <Link href={`/projects/${project.id}/tasks/new`}>
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                Add task
              </Link>
            </Button>
            <DeleteProjectButton projectId={project.id} />
          </div>
        )}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-rule bg-rule lg:grid-cols-4">
        {kpis.map((s) => (
          <div key={s.label} className="bg-surface p-5">
            <div className="label">{s.label}</div>
            <div className="mt-2 font-mono text-xl font-semibold tabular-nums text-ink">{s.value}</div>
          </div>
        ))}
      </div>

      {totalTasks > 0 && (
        <Card className="mb-8 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-ink">Project progress</span>
            <span className="font-mono text-sm tabular-nums text-ink-muted">{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
            <div className="h-full bg-accent transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex justify-between font-mono text-xs text-ink-faint">
            <span>{doneTasks} completed</span>
            <span>{totalTasks - doneTasks} remaining</span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Tasks</h2>
            {pendingExpenses > 0 && (
              <Link href="/expenses" className="text-xs text-pending transition-colors hover:underline">
                {pendingExpenses} pending expense{pendingExpenses > 1 ? 's' : ''}
              </Link>
            )}
          </div>

          {!tasks || tasks.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-muted">No tasks yet. Create the first one.</p>
          ) : (
            <div className="overflow-hidden rounded-[3px] border border-rule">
              {tasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="group flex items-center justify-between gap-3 border-b border-rule bg-surface px-4 py-3 transition-colors last:border-0 hover:bg-surface-sunken"
                >
                  <span className="truncate text-sm font-medium text-ink transition-colors group-hover:text-accent">
                    {task.title}
                  </span>
                  <div className="flex flex-shrink-0 items-center gap-3">
                    <Stamp tone={statusTone(task.status)}>{statusLabel(task.status)}</Stamp>
                    <span className="font-mono text-sm tabular-nums text-ink">${Number(task.amount).toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-5 font-display text-lg text-ink">Team</h2>
          {!members || members.length === 0 ? (
            <p className="text-sm text-ink-muted">No members assigned.</p>
          ) : (
            <div className="space-y-3">
              {members.map((m) => {
                const u = m.users as { name?: string; email?: string; role?: string } | null
                const initial = u?.name?.[0]?.toUpperCase() ?? u?.email?.[0]?.toUpperCase() ?? '?'
                const name = u?.name ?? u?.email ?? 'Unknown'
                return (
                  <div key={m.user_id} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-rule bg-surface-sunken font-mono text-sm font-semibold text-ink">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{name}</p>
                      <p className="label">{u?.role ?? m.role}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
