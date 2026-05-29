import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ClipboardList, FolderKanban, Receipt,
  DollarSign, User, CheckCircle2, Clock, CircleDot, Eye,
} from 'lucide-react'
import { UpdateTaskStatusSelect } from '@/components/features/update-task-status'
import { PayoutButton } from '@/components/features/payout-button'
import { TaskVerification } from '@/components/features/task-verification'

const statusConfig = {
  PENDING: { label: 'Pending', color: 'text-zinc-400', bg: 'bg-zinc-500/10', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: CircleDot },
  REVIEW: { label: 'In Review', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: Eye },
  COMPLETED: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle2 },
} as const

const expenseStatusConfig = {
  PENDING: { label: 'Pending', color: 'text-yellow-400' },
  APPROVED: { label: 'Approved', color: 'text-green-400' },
  REJECTED: { label: 'Rejected', color: 'text-red-400' },
} as const

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch task with relations
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

  // Fetch expenses for this task
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

  const cfg = statusConfig[task.status as keyof typeof statusConfig] ?? statusConfig.PENDING
  const isOwner = project?.owner_id === user.id
  const isAssignee = task.assignee_id === user.id
  const canEditStatus = isOwner || isAssignee
  const totalExpenses = expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Back */}
      <Link
        href="/tasks"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        All Tasks
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
            <cfg.icon className={`w-6 h-6 ${cfg.color}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{task.title}</h1>
            {project && (
              <Link
                href={`/projects/${project.id}`}
                className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-indigo-400 transition-colors"
              >
                <FolderKanban className="w-4 h-4" />
                {project.name}
              </Link>
            )}
          </div>
        </div>

        {canEditStatus && (
          <UpdateTaskStatusSelect taskId={task.id} currentStatus={task.status} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          {task.description && (
            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
              <h2 className="text-sm font-medium text-zinc-400 mb-2">Description</h2>
              <p className="text-white text-sm leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* AI Task Verification (BuildOps Pro) */}
          <TaskVerification 
            taskId={task.id} 
            taskTitle={task.title}
            existingImageUrl={task.verification_image_url}
            aiStatus={task.ai_verification_status}
            aiConfidence={task.ai_confidence}
          />

          {/* Expenses */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Expenses</h2>
              {isAssignee && (
                <Link
                  href={`/expenses/new?task_id=${task.id}`}
                  className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors font-medium"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  Submit Expense
                </Link>
              )}
            </div>

            {!expenses || expenses.length === 0 ? (
              <p className="text-zinc-500 text-sm py-2">No expenses submitted yet.</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((exp) => {
                  const eCfg = expenseStatusConfig[exp.status as keyof typeof expenseStatusConfig] ?? expenseStatusConfig.PENDING
                  return (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate">{exp.description}</p>
                        {exp.vendor && <p className="text-xs text-zinc-500">{exp.vendor}</p>}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                        <span className={`text-xs font-medium ${eCfg.color}`}>{eCfg.label}</span>
                        <span className="text-sm font-semibold text-white">${Number(exp.amount).toLocaleString()}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          {[
            { label: 'Task Amount', value: `$${Number(task.amount).toLocaleString()}`, icon: DollarSign, color: 'text-orange-400', bg: 'bg-orange-500/10' },
            { label: 'Expenses Logged', value: `$${totalExpenses.toLocaleString()}`, icon: Receipt, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{s.value}</div>
                <div className="text-xs text-zinc-500">{s.label}</div>
              </div>
            </div>
          ))}

          {/* Assignee */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
            <h3 className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wide">Assignee</h3>
            {assignee ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center text-indigo-300 text-sm font-bold flex-shrink-0">
                  {assignee.name?.[0]?.toUpperCase() ?? assignee.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="text-sm text-white">{assignee.name ?? assignee.email}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-zinc-500">
                <User className="w-4 h-4" />
                <span className="text-sm">Unassigned</span>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md space-y-3">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Status</span>
                <span className={cfg.color}>{cfg.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Created</span>
                <span className="text-zinc-300">
                  {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
            
            {/* Payout Actions */}
            {isOwner && task.status === 'COMPLETED' && (
              <div className="pt-3 border-t border-white/5 mt-3">
                {existingPayment ? (
                  <div className="w-full flex justify-center py-2.5 rounded-lg bg-green-500/10 text-green-400 text-sm font-medium border border-green-500/20">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Payment {existingPayment.status}
                  </div>
                ) : (
                  <PayoutButton taskId={task.id} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
