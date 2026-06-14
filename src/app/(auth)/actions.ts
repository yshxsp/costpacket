'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

// Login and signup run client-side in (auth)/login/page.tsx and
// (auth)/signup/page.tsx via supabase.auth.*. There is intentionally no signup
// server action here: role/company are assigned by the handle_new_user DB
// trigger (a public signup is always a new company's ADMIN). A second signup
// path that forwarded a client-sent role lived here and was removed — never
// trust the client for authorization fields.

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
