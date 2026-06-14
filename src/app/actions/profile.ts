'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const name = formData.get('name') as string

  if (!name || name.trim() === '') {
    return { error: 'Name cannot be empty' }
  }

  // Only `name` is client-writable (RLS grants update(name) on users). The
  // payout account (stripe_account_id) is intentionally NOT set here — it must
  // come from a server-side Stripe Connect onboarding return, not a hand-typed
  // form field, so funds can't be misrouted to an unverified account.
  const { error } = await supabase
    .from('users')
    .update({ name: name.trim() })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { success: true }
}
