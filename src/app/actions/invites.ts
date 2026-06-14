'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { sendEmail, inviteEmail } from '@/lib/email'

const ROLES = ['CONTRACTOR', 'SUBCONTRACTOR', 'ADMIN'] as const
type Role = (typeof ROLES)[number]

async function inviteLink(token: string): Promise<string> {
  const base = process.env.NEXT_PUBLIC_APP_URL
  if (base) return `${base.replace(/\/$/, '')}/accept-invite?token=${token}`
  const h = await headers()
  const origin = h.get('origin') ?? `https://${h.get('host') ?? 'costpacket.app'}`
  return `${origin}/accept-invite?token=${token}`
}

/**
 * Mint an invite (role authorization enforced server-side by create_invite) and
 * email the link. Returns the link too, so the UI can show a copyable fallback
 * when email isn't configured/delivered.
 */
export async function createInvite(email: string, role: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const trimmed = email.trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) return { error: 'Enter a valid email.' }
  if (!ROLES.includes(role as Role)) return { error: 'Invalid role.' }

  const { data: token, error } = await supabase.rpc('create_invite', {
    p_email: trimmed,
    p_role: role,
  })
  if (error) return { error: error.message }

  const link = await inviteLink(token as string)

  // company name for the email (best-effort)
  const { data: profile } = await supabase.from('users').select('company_id').eq('id', user.id).single()
  const { data: company } = profile?.company_id
    ? await supabase.from('companies').select('name').eq('id', profile.company_id).single()
    : { data: null }

  const tmpl = inviteEmail(company?.name ?? 'your company', role, link)
  const sent = await sendEmail(trimmed, tmpl.subject, tmpl.html)

  revalidatePath('/members')
  return { success: true, link, delivered: sent.delivered }
}

export async function revokeInvite(inviteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.rpc('revoke_invite', { p_invite_id: inviteId })
  if (error) return { error: error.message }

  revalidatePath('/members')
  return { success: true }
}

/** Re-send an existing pending invite's email (no DB change). */
export async function resendInvite(inviteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: inv, error } = await supabase
    .from('invites')
    .select('email, role, token, accepted_at, company_id')
    .eq('id', inviteId)
    .maybeSingle()
  if (error || !inv) return { error: 'Invite not found.' }
  if (inv.accepted_at) return { error: 'Invite already accepted.' }

  const link = await inviteLink(inv.token)
  const { data: company } = await supabase.from('companies').select('name').eq('id', inv.company_id).single()
  const tmpl = inviteEmail(company?.name ?? 'your company', inv.role, link)
  const sent = await sendEmail(inv.email, tmpl.subject, tmpl.html)

  return { success: true, link, delivered: sent.delivered }
}

/** Redeem an invite for the signed-in user (accept page). */
export async function acceptInvite(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must sign in with the invited email to accept.' }

  const { error } = await supabase.rpc('redeem_invite', { p_token: token })
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}
