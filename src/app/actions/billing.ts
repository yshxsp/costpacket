'use server'

import { createClient } from '@/lib/supabase-server'
import { createPortalSession } from '@/lib/paddle/api'

/**
 * Returns a Paddle customer-portal URL for the caller's company subscription, so
 * the owner can update payment method / cancel. Read path uses the user's own
 * session (RLS) to find their company's paddle_customer_id.
 */
export async function getPortalUrl() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.company_id) return { error: 'No company found.' }
  if (profile.role !== 'ADMIN') return { error: 'Only an admin can manage billing.' }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('paddle_customer_id, paddle_subscription_id')
    .eq('company_id', profile.company_id)
    .maybeSingle()

  if (!sub?.paddle_customer_id) {
    return { error: 'No active subscription to manage yet.' }
  }

  const url = await createPortalSession(sub.paddle_customer_id, sub.paddle_subscription_id)
  if (!url) return { error: 'Billing portal is not available right now.' }
  return { url }
}
