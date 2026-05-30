import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageShell, PageHeader } from '@/components/ui/page'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty'

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

  let projectsCount = 0
  let tasksTotal = 0
  let tasksDone = 0
  let expensesPending = 0
  let paymentsTotal = 0

  if (role === 'CONTRACTOR' || role === 'ADMIN') {
    const [pc, tt, td, ep, pay] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('owner_id', user.id),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
      supabase.from('expenses').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase.from('payments').select('amount').eq('status', 'PAID'),
    ])
    projectsCount = pc.count ?? 0
    tasksTotal = tt.count ?? 0
    tasksDone = td.count ?? 0
    expensesPending = ep.count ?? 0
    paymentsTotal = pay.data?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0
  } else {
    const [tt, td, pay] = await Promise.all([
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assignee_id', user.id),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assignee_id', user.id).eq('status', 'COMPLETED'),
      supabase.from('payments').select('amount').eq('user_id', user.id).eq('status', 'PAID'),
    ])
    tasksTotal = tt.count ?? 0
    tasksDone = td.count ?? 0
    paymentsTotal = pay.data?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0
  }

  const completionRate = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0
  const isContractor = role !== 'SUBCONTRACTOR'

  const stats = isContractor
    ? [
        { label: 'Active projects', value: projectsCount, href: '/projects' },
        { label: 'Tasks completed', value: `${tasksDone} / ${tasksTotal}`, href: '/tasks' },
        { label: 'Pending expenses', value: expensesPending, href: '/expenses' },
        { label: 'Total paid out', value: `$${paymentsTotal.toLocaleString()}`, href: '/payments' },
      ]
    : [
        { label: 'My tasks', value: tasksTotal, href: '/tasks' },
        { label: 'Completed', value: tasksDone, href: '/tasks' },
        { label: 'Completion rate', value: `${completionRate}%`, href: '/tasks' },
        { label: 'Total earned', value: `$${paymentsTotal.toLocaleString()}`, href: '/payments' },
      ]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.name?.split(' ')[0] ?? 'there'
  const dateline = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <PageShell>
      <PageHeader
        kicker={dateline}
        title={`${greeting}, ${firstName}`}
        description="Receipt packets, approvals, and payouts at a glance."
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-rule bg-rule lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group bg-surface p-5 transition-colors hover:bg-surface-sunken"
          >
            <div className="label">{stat.label}</div>
            <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-ink">
              {stat.value}
            </div>
            <div className="mt-1 font-mono text-xs text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">
              View →
            </div>
          </Link>
        ))}
      </div>

      {isContractor && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg text-ink">Task completion</h2>
              <span className="font-mono text-sm tabular-nums text-ink-muted">{completionRate}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
              <div className="h-full bg-accent transition-all duration-700" style={{ width: `${completionRate}%` }} />
            </div>
            <div className="mt-2 flex justify-between font-mono text-xs text-ink-faint">
              <span>{tasksDone} done</span>
              <span>{tasksTotal - tasksDone} remaining</span>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 font-display text-lg text-ink">Quick actions</h2>
            <div className="divide-y divide-rule">
              {[
                { label: 'Create a new project', href: '/projects/new' },
                { label: 'Review pending expenses', href: '/expenses' },
                { label: 'Process payments', href: '/payments' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center justify-between py-2.5 text-sm text-ink transition-colors hover:text-accent"
                >
                  {action.label}
                  <span className="font-mono text-ink-faint transition-colors group-hover:text-accent">→</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tasksTotal === 0 && (
        <div className="mt-4">
          <EmptyState
            title="No data yet"
            description={
              isContractor
                ? 'Create your first project to get started.'
                : 'You have no tasks assigned yet.'
            }
          >
            {isContractor && (
              <Button asChild>
                <Link href="/projects/new">New project</Link>
              </Button>
            )}
          </EmptyState>
        </div>
      )}
    </PageShell>
  )
}
