'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const name = formData.get('name') as string
  const stripe_account_id = formData.get('stripe_account_id') as string

  if (!name || name.trim() === '') {
    return { error: 'Name cannot be empty' }
  }

  const { error } = await supabase
    .from('users')
    .update({ 
      name: name.trim(), 
      stripe_account_id: stripe_account_id ? stripe_account_id.trim() : null 
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { success: true }
}
