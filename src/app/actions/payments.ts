'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import Stripe from 'stripe'

// Initialize Stripe gracefully, so the application won't crash if the key is missing in .env
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' })
  : null

export async function createPayment(taskId: string) {
  const supabase = await createClient()

  // 1. Verify Authentication & Role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'CONTRACTOR') {
    return { error: 'Only contractors can initiate payments.' }
  }

  // 2. Fetch Task details
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('*, projects!project_id(owner_id), users!assignee_id(*)')
    .eq('id', taskId)
    .single()

  if (taskError || !task) {
    return { error: 'Task not found.' }
  }

  // Security Check: Ensure caller actually owns the project the task belongs to
  const project = task.projects as { owner_id?: string } | null
  if (project?.owner_id !== user.id) {
    return { error: 'Unauthorized. You do not own the project for this task.' }
  }

  if (task.status !== 'COMPLETED') {
    return { error: 'Cannot pay out because the task is not marked as completed.' }
  }

  // Check if a payment already exists for this task
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('task_id', taskId)
    .maybeSingle()

  if (existingPayment) {
    return { error: 'A payment already exists for this task.' }
  }

  const assignee = task.users as { id: string; stripe_account_id?: string | null } | null
  if (!assignee || Array.isArray(assignee)) {
    return { error: 'Task has no valid assignee to pay.' }
  }

  const payoutAmount = task.amount
  if (!payoutAmount || payoutAmount <= 0) {
    return { error: 'Task has no valid amount configured.' }
  }

  // 3. Initiate Stripe payout (or Mock if no keys)
  let stripePayoutId = 'mock_po_' + Date.now()
  let paymentStatus = 'PAID' // Mock defaults to paid
  let errorMsg = null

  // Real transfers to connected accounts are money movement (Stripe Connect
  // marketplace territory): without a reviewed Connect + KYC setup this is the
  // fastest way to get the platform account banned. Keep record-only until
  // STRIPE_PAYOUTS_ENABLED=true is set deliberately.
  const payoutsEnabled = process.env.STRIPE_PAYOUTS_ENABLED === 'true'

  try {
    if (stripe && payoutsEnabled) {
      // Real Stripe Connect transfer to the subcontractor's connected account.
      if (!assignee.stripe_account_id) {
        return {
          error:
            'This subcontractor has no Stripe account connected. Add their Stripe account ID before paying out.',
        }
      }
      const transfer = await stripe.transfers.create(
        {
          amount: Math.round(payoutAmount * 100), // convert to cents
          currency: 'usd',
          destination: assignee.stripe_account_id,
          description: `Payout for task: ${task.title}`,
        },
        // Idempotency: two concurrent payout requests can both pass the
        // existing-payment check above before either inserts the
        // unique(task_id) row. Keying the transfer by taskId makes Stripe
        // collapse them into a SINGLE money movement instead of paying twice;
        // the unique(task_id) index then keeps exactly one DB record.
        { idempotencyKey: `payout:${taskId}` }
      )
      stripePayoutId = transfer.id
      paymentStatus = 'PAID'
    } else {
      // Record-only: either no Stripe key (local/dev) or payouts deliberately off.
      console.warn(
        stripe
          ? 'STRIPE_PAYOUTS_ENABLED is not "true" — recording the payout without moving money.'
          : 'No STRIPE_SECRET_KEY configured — recording a mock payout (dev only).'
      )
    }
  } catch (stripeErr: unknown) {
    console.error("Stripe error:", stripeErr)
    paymentStatus = 'FAILED'
    errorMsg = stripeErr instanceof Error ? stripeErr.message : "Failed to communicate with Stripe."
  }

  // 4. Save Payment record in Supabase
  const { error: insertError } = await supabase.from('payments').insert({
    amount: payoutAmount,
    stripe_payout_id: stripePayoutId,
    status: paymentStatus,
    user_id: assignee.id,
    task_id: taskId,
  })

  if (insertError) {
    console.error("Payment insert error:", insertError)
    return { error: 'Failed to record payment in database.' }
  }

  if (paymentStatus === 'FAILED') {
    return { error: `Stripe error: ${errorMsg}` }
  }

  revalidatePath('/payments')
  revalidatePath(`/tasks/${taskId}`)
  return { success: true }
}
