'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { requireActiveAccess } from '@/lib/billing'

/**
 * Manual payout ledger (beta).
 *
 * Automatic Stripe Connect transfers are deferred — moving money to connected
 * accounts needs a reviewed Connect/KYC setup. For beta we record payouts and an
 * ADMIN/owner confirms them by hand:
 *   createPayment  → records a PENDING payout (no money moves)
 *   markPayoutPaid → ADMIN/owner confirms it as MARKED_PAID (server-side, audited)
 *   cancelPayout   → ADMIN/owner cancels a pending payout
 *
 * A payout is NEVER PAID without an explicit admin confirmation.
 */

export async function createPayment(taskId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const gate = await requireActiveAccess(supabase)
  if (gate) return gate

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'CONTRACTOR') {
    return { error: 'Only contractors can record payouts.' }
  }

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('*, projects!project_id(owner_id), users!assignee_id(*)')
    .eq('id', taskId)
    .single()

  if (taskError || !task) {
    return { error: 'Task not found.' }
  }

  // Caller must own the project the task belongs to.
  const project = task.projects as { owner_id?: string } | null
  if (project?.owner_id !== user.id) {
    return { error: 'Unauthorized. You do not own the project for this task.' }
  }

  if (task.status !== 'COMPLETED') {
    return { error: 'Cannot record a payout because the task is not marked as completed.' }
  }

  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('task_id', taskId)
    .maybeSingle()

  if (existingPayment) {
    return { error: 'A payout already exists for this task.' }
  }

  const assignee = task.users as { id: string } | null
  if (!assignee || Array.isArray(assignee)) {
    return { error: 'Task has no valid assignee to pay.' }
  }

  const payoutAmount = task.amount
  if (!payoutAmount || payoutAmount <= 0) {
    return { error: 'Task has no valid amount configured.' }
  }

  // Record-only: no money moves here. The row stays PENDING until an ADMIN/owner
  // confirms it via markPayoutPaid, so the UI never claims someone was paid.
  const { error: insertError } = await supabase.from('payments').insert({
    amount: payoutAmount,
    status: 'PENDING',
    user_id: assignee.id,
    task_id: taskId,
  })

  if (insertError) {
    console.error('Payout record error:', insertError)
    return { error: 'Failed to record payout.' }
  }

  revalidatePath('/payments')
  revalidatePath(`/tasks/${taskId}`)
  return { success: true, status: 'PENDING' as const }
}

/**
 * Confirm a payout as paid by hand. Authorization (ADMIN/owner of the payout's
 * company), tenant scoping, and idempotency are all enforced server-side by the
 * mark_payout_paid SECURITY DEFINER function.
 */
export async function markPayoutPaid(paymentId: string, reference?: string, note?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase.rpc('mark_payout_paid', {
    p_payment_id: paymentId,
    p_reference: reference?.trim() || null,
    p_note: note?.trim() || null,
  })

  if (error) {
    console.error('mark_payout_paid error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/payments')
  return { success: true, status: data as string }
}

/** Cancel a pending payout (ADMIN/owner only, enforced server-side). */
export async function cancelPayout(paymentId: string, note?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase.rpc('cancel_payout', {
    p_payment_id: paymentId,
    p_note: note?.trim() || null,
  })

  if (error) {
    console.error('cancel_payout error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/payments')
  return { success: true, status: data as string }
}
