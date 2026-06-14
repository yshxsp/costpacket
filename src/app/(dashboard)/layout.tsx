import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MobileNav } from '@/components/features/mobile-nav'
import { DesktopSidebar } from '@/components/features/desktop-sidebar'
import { getCompanyAccess } from '@/lib/billing'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user profile from public.users
  const { data: profile } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()

  const displayName = profile?.name ?? user.email?.split('@')[0] ?? 'User'
  const role = profile?.role ?? 'SUBCONTRACTOR'

  const access = await getCompanyAccess(supabase)

  return (
    <div className="flex h-screen overflow-hidden flex-col md:flex-row">
      {/* Mobile Topbar */}
      <MobileNav displayName={displayName} role={role} />

      {/* Desktop Sidebar */}
      <DesktopSidebar displayName={displayName} role={role} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative bg-background">
        {!access.active && (
          <div className="border-b border-pending/40 bg-pending/10 px-5 py-2.5 text-sm text-ink">
            Your plan is inactive — new projects, tasks, and expenses are paused.{' '}
            <Link href="/billing" className="font-medium text-accent underline">
              Go to Billing
            </Link>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
