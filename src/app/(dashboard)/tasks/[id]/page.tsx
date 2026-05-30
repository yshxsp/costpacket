import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Receipt, User, CheckCircle2 } from 'lucide-react'
import { UpdateTaskStatusSelect } from '@/components/features/update-task-status'
import { PayoutButton } from '@/components/features/payout-button'
import { Card } from '@/components/ui/card'
import { Stamp, statusTone, statusLabel } from '@/components/ui/status'

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: task } = await supabase
    .from('tasks')
    .select(`
      *,
      projects (id, name, owner_id),
      users (id, name, email)
    `)
    .eq('id', id)
    .single()

  if (!task) notFound()

  const project = task.projects as { id: string; name: string; owner_id: string } | null
  const assignee = task.users as { name?: string; email?: string } | null

  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, amount, description, vendor, status, created_at')
    .eq('task_id', id)
    .order('created_at', { ascending: false })

  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('task_id', id)
    .maybeSingle()

  const isOwner = project?.owner_id === user.id
  const isAssignee = task.assignee_id === user.id
  const canEditStatus = isOwner || isAssignee
  const totalExpenses = expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <Link
        href="/tasks"
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        All tasks
      </Link>

      <div className="mb-8 flex flex-col gap-4 border-b border-rule pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl tracking-tight text-ink">{task.title}</h1>
            <Stamp tone={statusTone(task.status)}>{statusLabel(task.status)}</Stamp>
          </div>
          {project && (
            <Link
              href={`/projects/${project.id}`}
              className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-accent"
            >
              {project.name}
            </Link>
          )}
        </div>

        {canEditStatus && <UpdateTaskStatusSelect taskId={task.id} currentStatus={task.status} />}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {task.description && (
            <Card className="p-5">
              <h2 className="label mb-2">Description</h2>
              <p className="text-sm leading-relaxed text-ink">{task.description}</p>
            </Card>
          )}

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg text-ink">Expenses</h2>
              {isAssignee && (
                <Link
                  href={`/expenses/new?task_id=${task.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:underline"
                >
                  <Receipt className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Submit expense
                </Link>
              )}
            </div>

            {!expenses || expenses.length === 0 ? (
              <p className="py-2 text-sm text-ink-muted">No expenses submitted yet.</p>
            ) : (
              <div className="overflow-hidden rounded-[3px] border border-rule">
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between gap-3 border-b border-rule bg-surface px-4 py-3 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{exp.description}</p>
                      {exp.vendor && <p className="text-xs text-ink-muted">{exp.vendor}</p>}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-3">
                      <Stamp tone={statusTone(exp.status)}>{statusLabel(exp.status)}</Stamp>
                      <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                        ${Number(exp.amount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-rule bg-rule lg:grid-cols-1">
            <div className="bg-surface p-4">
              <div className="label">Task amount</div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink">
                ${Number(task.amount).toLocaleString()}
              </div>
            </div>
            <div className="bg-surface p-4">
              <div className="label">Expenses logged</div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink">
                ${totalExpenses.toLocaleString()}
              </div>
            </div>
          </div>

          <Card className="p-4">
            <h3 className="label mb-3">Assignee</h3>
            {assignee ? (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-rule bg-surface-sunken font-mono text-sm font-semibold text-ink">
                  {assignee.name?.[0]?.toUpperCase() ?? assignee.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                <p className="text-sm text-ink">{assignee.name ?? assignee.email}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-ink-muted">
                <User className="h-4 w-4" strokeWidth={1.75} />
                <span className="text-sm">Unassigned</span>
              </div>
            )}
          </Card>

          <Card className="space-y-3 p-4">
            <h3 className="label">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">Created</span>
                <span className="font-mono text-ink">
                  {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {isOwner && task.status === 'COMPLETED' && (
              <div className="mt-3 border-t border-rule pt-3">
                {existingPayment ? (
                  <div className="flex w-full items-center justify-center gap-2 rounded-[3px] border border-approved/30 bg-approved-soft py-2.5 text-sm font-medium text-approved">
                    <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
                    Payment {existingPayment.status.toLowerCase()}
                  </div>
                ) : (
                  <PayoutButton taskId={task.id} />
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
