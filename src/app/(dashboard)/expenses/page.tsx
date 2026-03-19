import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Receipt, Plus, ArrowUpRight, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { ApproveRejectButtons } from '@/components/features/approve-reject-expense'

const statusConfig = {
  PENDING: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-500/10', dot: 'bg-yellow-400', icon: Clock },
  APPROVED: { label: 'Approved', color: 'text-green-400', bg: 'bg-green-500/10', dot: 'bg-green-400', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-400', icon: XCircle },
} as const

type StatusKey = keyof typeof statusConfig

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: filterStatus } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  const role = profile?.role ?? 'SUBCONTRACTOR'
  const isContractor = role !== 'SUBCONTRACTOR'

  let query = supabase
    .from('expenses')
    .select(`
      id, amount, description, vendor, status, receipt_url, created_at,
      task_id,
      tasks (id, title, project_id, projects(id, name)),
      submitted_by_id,
      users (id, name, email)
    `)
    .order('created_at', { ascending: false })

  if (!isContractor) {
    query = query.eq('submitted_by_id', user.id)
  }
  if (filterStatus && Object.keys(statusConfig).includes(filterStatus)) {
    query = query.eq('status', filterStatus)
  }

  const { data: expenses } = await query

  const totals = {
    pending: expenses?.filter((e) => e.status === 'PENDING').length ?? 0,
    approved: expenses?.filter((e) => e.status === 'APPROVED').length ?? 0,
    total: expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0,
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Expenses</h1>
          <p className="text-zinc-400 text-sm">
            {expenses?.length ?? 0} expense{expenses?.length !== 1 ? 's' : ''} · ${totals.total.toLocaleString()} total
          </p>
        </div>
        <Link
          href="/expenses/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          Submit Expense
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Pending Review', value: totals.pending, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Approved', value: totals.approved, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Total Amount', value: `$${totals.total.toLocaleString()}`, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-2xl bg-white/5 border border-white/5">
            <div className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</div>
            <div className="text-xs text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/5 w-fit mb-6">
        <FilterLink href="?" active={!filterStatus} label="All" />
        {(Object.keys(statusConfig) as StatusKey[]).map((s) => (
          <FilterLink
            key={s}
            href={`?status=${s}`}
            active={filterStatus === s}
            label={statusConfig[s].label}
            color={statusConfig[s].color}
          />
        ))}
      </div>

      {/* Expense list */}
      {!expenses || expenses.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-white/10 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-4">
            <Receipt className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-white font-semibold mb-1">No expenses found</p>
          <p className="text-zinc-500 text-sm mb-5">Submit a receipt to log expenses against a task.</p>
          <Link
            href="/expenses/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-all"
          >
            <Plus className="w-4 h-4" />
            Submit Expense
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((exp) => {
            const cfg = statusConfig[exp.status as StatusKey] ?? statusConfig.PENDING
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const task = (exp.tasks as any) as { id: string; title: string; projects: { id: string; name: string } | null } | null
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const submitter = (exp.users as any) as { name?: string; email?: string } | null

            return (
              <div
                key={exp.id}
                className="p-5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                  <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-white text-sm">{exp.description}</p>
                    <span className="text-base font-bold text-white flex-shrink-0">${Number(exp.amount).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {exp.vendor && <span className="text-xs text-zinc-500">{exp.vendor}</span>}
                    {task && (
                      <Link href={`/tasks/${task.id}`} className="text-xs text-zinc-500 hover:text-indigo-400 flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        {task.title}
                      </Link>
                    )}
                    {submitter && isContractor && (
                      <span className="text-xs text-zinc-600">by {submitter.name ?? submitter.email}</span>
                    )}
                    <span className="text-xs text-zinc-600">
                      {new Date(exp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${cfg.color} flex items-center gap-1`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                  {isContractor && exp.status === 'PENDING' && (
                    <ApproveRejectButtons expenseId={exp.id} />
                  )}
                  {exp.receipt_url && (
                    <a
                      href={exp.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      View Receipt
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterLink({ href, active, label, color }: { href: string; active: boolean; label: string; color?: string }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active ? 'bg-white/10 text-white' : `text-zinc-500 hover:text-zinc-300 ${color ?? ''}`
      }`}
    >
      {label}
    </Link>
  )
}
