import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client — bypasses RLS. SERVER-ONLY: never import this
 * into a client component or expose the key. Used by the Paddle webhook to write
 * subscriptions / billing_events, which clients are not permitted to touch.
 *
 * Returns null if the service-role key isn't configured, so callers can fail
 * closed instead of crashing the route.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
