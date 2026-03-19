import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { CreditCard, CheckCircle2, Clock, AlertCircle, Loader } from 'lucide-react'

const statusConfig = {
  PENDING: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-500/10', dot: 'bg-yellow-400', icon: Clock },
  PROCESSING: { label: 'Processing', color: 'text-blue-400', bg: 'bg-blue-500/10', dot: 'bg-blue-400', icon: Loader },
  PAID: { label: 'Paid', color: 'text-green-400', bg: 'bg-green-500/10', dot: 'bg-green-400', icon: CheckCircle2 },
  FAILED: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-400', icon: AlertCircle },
} as const

type StatusKey = keyof typeof statusConfig

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  const role = profile?.role ?? 'SUBCONTRACTOR'

  let query = supabase
    .from('payments')
    .select(`
      id, amount, status, created_at, stripe_payout_id,
      task_id,
      tasks (id, title),
      user_id,
      users (id, name, email)
    `)
    .order('created_at', { ascending: false })

  if (role === 'SUBCONTRACTOR') {
    query = query.eq('user_id', user.id)
  }

  const { data: payments } = await query

  const totalPaid = payments?.filter((p) => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0) ?? 0
  const totalPending = payments?.filter((p) => p.status === 'PENDING').reduce((s, p) => s + Number(p.amount), 0) ?? 0

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Payments</h1>
        <p className="text-zinc-400 text-sm">
          {role === 'SUBCONTRACTOR' ? 'Your payment history' : 'All subcontractor payouts'}
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Paid', value: `$${totalPaid.toLocaleString()}`, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Pending', value: `$${totalPending.toLocaleString()}`, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Total Transactions', value: payments?.length ?? 0, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Paid Count', value: payments?.filter((p) => p.status === 'PAID').length ?? 0, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-2xl bg-white/5 border border-white/5">
            <div className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</div>
            <div className="text-xs text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Payments list */}
      {!payments || payments.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-white/10 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-white font-semibold mb-1">No payments yet</p>
          <p className="text-zinc-500 text-sm">Payments will appear here once tasks are completed and approved.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Task</th>
                {role !== 'SUBCONTRACTOR' && (
                  <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden md:table-cell">Recipient</th>
                )}
                <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
                <th className="text-right px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((pmt) => {
                const cfg = statusConfig[pmt.status as StatusKey] ?? statusConfig.PENDING
                const task = pmt.tasks as { id: string; title: string } | null
                const recipient = pmt.users as { name?: string; email?: string } | null
                return (
                  <tr key={pmt.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-white">{task?.title ?? '—'}</p>
                      {pmt.stripe_payout_id && (
                        <p className="text-xs text-zinc-600 font-mono mt-0.5 truncate max-w-[180px]">{pmt.stripe_payout_id}</p>
                      )}
                    </td>
                    {role !== 'SUBCONTRACTOR' && (
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-sm text-zinc-400">{recipient?.name ?? recipient?.email ?? '—'}</span>
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-xs text-zinc-500">
                        {new Date(pmt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-bold text-white">${Number(pmt.amount).toLocaleString()}</span>
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
