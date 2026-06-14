import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side subscription gate. The Paddle webhook owns subscription state in
 * the `subscriptions` table; new companies get a short free trial measured from
 * company.created_at until they subscribe. Paid features are gated on this —
 * never on a browser checkout-success redirect.
 */
export const TRIAL_DAYS = 14

export interface CompanyAccess {
  companyId: string | null
  /** May create/approve paid work. */
  active: boolean
  /** active | trialing | trial | past_due | paused | canceled | none */
  status: string
  isTrial: boolean
  trialEndsAt: string | null
  currentPeriodEnd: string | null
}

const INACTIVE: CompanyAccess = {
  companyId: null,
  active: false,
  status: 'none',
  isTrial: false,
  trialEndsAt: null,
  currentPeriodEnd: null,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCompanyAccess(supabase: SupabaseClient<any>): Promise<CompanyAccess> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return INACTIVE

  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()
  const companyId = profile?.company_id ?? null
  if (!companyId) return INACTIVE

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('company_id', companyId)
    .maybeSingle()

  if (sub) {
    const active = sub.status === 'active' || sub.status === 'trialing'
    return {
      companyId,
      active,
      status: sub.status,
      isTrial: sub.status === 'trialing',
      trialEndsAt: null,
      currentPeriodEnd: sub.current_period_end ?? null,
    }
  }

  // No subscription yet → free trial window from company creation.
  const { data: company } = await supabase
    .from('companies')
    .select('created_at')
    .eq('id', companyId)
    .single()

  if (company?.created_at) {
    const ends = new Date(new Date(company.created_at).getTime() + TRIAL_DAYS * 86400_000)
    if (ends.getTime() > Date.now()) {
      return {
        companyId,
        active: true,
        status: 'trial',
        isTrial: true,
        trialEndsAt: ends.toISOString(),
        currentPeriodEnd: null,
      }
    }
  }

  return { ...INACTIVE, companyId, status: 'none' }
}

/** Returns an error object for a server action when the company lacks access. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function requireActiveAccess(supabase: SupabaseClient<any>) {
  const access = await getCompanyAccess(supabase)
  if (!access.active) {
    return {
      error:
        'Your CostPacket plan is inactive. Start or renew a subscription in Billing to continue.',
    }
  }
  return null
}
