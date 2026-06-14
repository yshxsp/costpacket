import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { toCsv, type CsvCell } from '@/lib/csv'

export const dynamic = 'force-dynamic'

/**
 * CSV export for accounting. Runs under the caller's session, so RLS scopes rows
 * to their company (and a subcontractor only sees their own). Supports
 * /api/export/expenses and /api/export/payments.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  let filename: string
  let headers: string[]
  let rows: CsvCell[][]

  if (type === 'expenses') {
    const { data } = await supabase
      .from('expenses')
      .select('created_at, vendor, description, amount, status')
      .order('created_at', { ascending: false })
    filename = 'expenses.csv'
    headers = ['Date', 'Vendor', 'Description', 'Amount', 'Status']
    rows = (data ?? []).map((e) => [
      new Date(e.created_at).toISOString().slice(0, 10),
      e.vendor,
      e.description,
      Number(e.amount),
      e.status,
    ])
  } else if (type === 'payments') {
    const { data } = await supabase
      .from('payments')
      .select('created_at, amount, status, reference, paid_at, tasks(title), users(name, email)')
      .order('created_at', { ascending: false })
    filename = 'payouts.csv'
    headers = ['Date', 'Task', 'Recipient', 'Amount', 'Status', 'Reference', 'Paid at']
    rows = (data ?? []).map((p) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const task = (p.tasks as any) as { title?: string } | null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rcpt = (p.users as any) as { name?: string; email?: string } | null
      return [
        new Date(p.created_at).toISOString().slice(0, 10),
        task?.title ?? '',
        rcpt?.name ?? rcpt?.email ?? '',
        Number(p.amount),
        p.status,
        p.reference ?? '',
        p.paid_at ? new Date(p.paid_at).toISOString().slice(0, 10) : '',
      ]
    })
  } else {
    return new Response('Unknown export type', { status: 404 })
  }

  return new Response(toCsv(headers, rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  })
}
