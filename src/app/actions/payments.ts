'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import Stripe from 'stripe'

// Initialize Stripe gracefully, so the application won't crash if the key is missing in .env
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' as any })
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
  if ((task.projects as any)?.owner_id !== user.id) {
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

  const assignee = task.users
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

  try {
    if (stripe && assignee.stripe_account_id) {
      // Real Stripe Connect Transfer (example logic for custom connected accounts)
      // Transfer to the connected account:
      const transfer = await stripe.transfers.create({
        amount: Math.round(payoutAmount * 100), // convert to cents
        currency: 'usd',
        destination: assignee.stripe_account_id,
        description: `Payout for task: ${task.title}`,
      })
      stripePayoutId = transfer.id
      paymentStatus = 'PAID'
    } else {
      // Mock / Sandbox fallback
      console.warn("No STRIPE_SECRET_KEY or stripe_account_id found. Creating a mock successful payout.")
    }
  } catch (stripeErr: any) {
    console.error("Stripe error:", stripeErr)
    paymentStatus = 'FAILED'
    errorMsg = stripeErr.message || "Failed to communicate with Stripe."
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
