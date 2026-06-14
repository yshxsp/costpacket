'use client'

import { useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile } from '@/app/actions/profile'
import { useRouter } from 'next/navigation'
import { Field, Input } from '@/components/ui/field'
import { Button } from '@/components/ui/button'

export function ProfileForm({
  initialName,
  initialEmail,
  role,
}: {
  initialName: string
  initialEmail: string
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Email address">
          <Input type="text" readOnly value={initialEmail} className="cursor-not-allowed bg-surface-sunken text-ink-muted" />
        </Field>
        <Field label="Current role">
          <Input type="text" readOnly value={role} className="cursor-not-allowed bg-surface-sunken text-ink-muted" />
        </Field>
      </div>

      <hr className="border-rule" />

      <div className="space-y-4">
        <Field label="Full name" htmlFor="name">
          <Input id="name" name="name" type="text" required defaultValue={initialName} placeholder="e.g. John Smith" />
        </Field>

        {/*
          Payout account (stripe_account_id) is intentionally NOT editable here:
          it must be set from a verified Stripe Connect onboarding return, not a
          hand-typed value (RLS also locks the column server-side). A "Connect
          payout account" button belongs here once that flow is built.
        */}
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Save className="h-4 w-4" strokeWidth={1.75} />
            Save changes
          </>
        )}
      </Button>
    </form>
  )
}
