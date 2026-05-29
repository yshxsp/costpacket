import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { MobileNav } from '@/components/features/mobile-nav'
import { DesktopSidebar } from '@/components/features/desktop-sidebar'
import { PageTransition } from '@/components/providers/page-transition'

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

  return (
    <div className="flex h-screen overflow-hidden flex-col md:flex-row">
      {/* Mobile Topbar */}
      <MobileNav displayName={displayName} role={role} />

      {/* Desktop Sidebar */}
      <DesktopSidebar displayName={displayName} role={role} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative bg-background">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  )
}
