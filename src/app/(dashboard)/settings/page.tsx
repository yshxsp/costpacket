import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Settings } from 'lucide-react'
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
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center border border-border">
          <Settings className="w-5 h-5 text-zinc-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-zinc-400 text-sm">Manage your profile and payment details</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 md:p-8">
        <ProfileForm 
          initialName={profile.name ?? ''} 
          initialEmail={profile.email ?? ''}
          initialStripeId={profile.stripe_account_id ?? ''}
          role={profile.role ?? 'SUBCONTRACTOR'}
        />
      </div>
    </div>
  )
}
