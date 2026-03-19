'use client'

import { useState } from 'react'
import { Loader2, Save, User, CreditCard, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile } from '@/app/actions/profile'
import { useRouter } from 'next/navigation'

export function ProfileForm({ 
  initialName, 
  initialEmail,
  initialStripeId,
  role
}: { 
  initialName: string
  initialEmail: string
  initialStripeId: string
  role: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    try {
      const res = await updateProfile(fd)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Profile updated successfully!')
        router.refresh()
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account Info: Read Only */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5 opacity-70">
          <label className="text-sm font-medium text-zinc-300">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              readOnly
              value={initialEmail}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 text-sm cursor-not-allowed"
            />
          </div>
        </div>
        
        <div className="space-y-1.5 opacity-70">
          <label className="text-sm font-medium text-zinc-300">Current Role</label>
          <div className="relative">
            <input
              type="text"
              readOnly
              value={role}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 text-sm cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      <hr className="border-white/5" />

      {/* Editable Fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-zinc-300">
            Full Name <span className="text-orange-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={initialName}
              placeholder="e.g. John Smith"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="stripe_account_id" className="text-sm font-medium text-zinc-300">
            Stripe Account ID <span className="text-zinc-500">(for payouts)</span>
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              id="stripe_account_id"
              name="stripe_account_id"
              type="text"
              defaultValue={initialStripeId}
              placeholder="acct_1Ou..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1">Needed if you are a subcontractor receiving payments.</p>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-orange-500 text-white font-medium text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  )
}
