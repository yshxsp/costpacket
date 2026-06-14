import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/ui/page'
import { Card } from '@/components/ui/card'
import { ProfileForm } from '@/components/features/profile-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, email, role, stripe_account_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="mx-auto max-w-2xl p-6 sm:p-8">
      <PageHeader
        kicker="Account"
        title="Profile"
        description="Manage your profile and payout details"
      />

      <Card className="p-6 md:p-8">
        <ProfileForm
          initialName={profile.name ?? ''}
          initialEmail={profile.email ?? ''}
          role={profile.role ?? 'SUBCONTRACTOR'}
        />
      </Card>
    </div>
  )
}
