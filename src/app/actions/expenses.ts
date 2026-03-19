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

export async function deleteExpense(expenseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Only the submitter or a contractor can delete a PENDING expense
  const { data: expense } = await supabase
    .from('expenses')
    .select('id, status, submitted_by_id')
    .eq('id', expenseId)
    .single()

  if (!expense) return { error: 'Expense not found.' }

  const isSubmitter = expense.submitted_by_id === user.id
  if (!isSubmitter) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'SUBCONTRACTOR') {
      return { error: 'You can only delete your own expenses.' }
    }
  }

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)

  if (error) return { error: error.message }

  revalidatePath('/expenses')
  return { success: true }
}
