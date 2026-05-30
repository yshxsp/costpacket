'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function updateExpenseStatus(
  expenseId: string,
  status: 'APPROVED' | 'REJECTED'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Security: Only CONTRACTOR or ADMIN can approve/reject
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role === 'SUBCONTRACTOR') {
    return { error: 'Only contractors can approve or reject expenses.' }
  }

  // Verify expense exists and is still PENDING
  const { data: expense, error: fetchError } = await supabase
    .from('expenses')
    .select('id, status')
    .eq('id', expenseId)
    .single()

  if (fetchError || !expense) {
    return { error: 'Expense not found.' }
  }

  if (expense.status !== 'PENDING') {
    return { error: 'Expense has already been reviewed.' }
  }

  const { error: updateError } = await supabase
    .from('expenses')
    .update({ status })
    .eq('id', expenseId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/expenses')
  return { success: true }
}
