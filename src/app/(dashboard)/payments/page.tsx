import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { PageShell, PageHeader } from '@/components/ui/page'
import { EmptyState } from '@/components/ui/empty'
import { Stamp, statusTone, statusLabel } from '@/components/ui/status'
import { cn } from '@/lib/utils'

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

  const summary = [
    { label: 'Total paid', value: `$${totalPaid.toLocaleString()}` },
    { label: 'Pending', value: `$${totalPending.toLocaleString()}` },
    { label: 'Transactions', value: payments?.length ?? 0 },
    { label: 'Paid count', value: payments?.filter((p) => p.status === 'PAID').length ?? 0 },
  ]

  return (
    <PageShell>
      <PageHeader
        kicker="Payouts"
        title="Payments"
        description={role === 'SUBCONTRACTOR' ? 'Your payment history' : 'All subcontractor payouts'}
      />

      <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-rule bg-rule lg:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className="bg-surface p-5">
            <div className="label">{s.label}</div>
            <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-ink">{s.value}</div>
          </div>
        ))}
      </div>

      {!payments || payments.length === 0 ? (
        <EmptyState
          title="No payments yet"
          description="Payouts appear here once tasks are completed and approved."
        />
      ) : (
        <div className="overflow-hidden rounded-[3px] border border-rule bg-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rule">
                <Th>Task</Th>
                {role !== 'SUBCONTRACTOR' && <Th className="hidden md:table-cell">Recipient</Th>}
                <Th>Status</Th>
                <Th className="hidden sm:table-cell">Date</Th>
                <Th className="text-right">Amount</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {payments.map((pmt) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const task = (pmt.tasks as any) as { id: string; title: string } | null
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const recipient = (pmt.users as any) as { name?: string; email?: string } | null
                return (
                  <tr key={pmt.id} className="transition-colors hover:bg-surface-sunken">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-ink">{task?.title ?? '—'}</p>
                      {pmt.stripe_payout_id && (
                        <p className="mt-0.5 max-w-[180px] truncate font-mono text-xs text-ink-faint">
                          {pmt.stripe_payout_id}
                        </p>
                      )}
                    </td>
                    {role !== 'SUBCONTRACTOR' && (
                      <td className="hidden px-5 py-4 md:table-cell">
                        <span className="text-sm text-ink-muted">{recipient?.name ?? recipient?.email ?? '—'}</span>
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <Stamp tone={statusTone(pmt.status)}>{statusLabel(pmt.status)}</Stamp>
                    </td>
                    <td className="hidden px-5 py-4 sm:table-cell">
                      <span className="font-mono text-xs text-ink-muted">
                        {new Date(pmt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-sm font-semibold tabular-nums text-ink">
                      ${Number(pmt.amount).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn('label px-5 py-3 text-left', className)}>{children}</th>
}
