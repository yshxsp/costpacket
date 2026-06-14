'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { revokeInvite, resendInvite } from '@/app/actions/invites'

export function InviteActions({ inviteId }: { inviteId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function onRevoke() {
    setBusy(true)
    try {
      const res = await revokeInvite(inviteId)
      if ('error' in res && res.error) toast.error(res.error)
      else {
        toast.success('Invite revoked')
        router.refresh()
      }
    } finally {
      setBusy(false)
    }
  }

  async function onResend() {
    setBusy(true)
    try {
      const res = await resendInvite(inviteId)
      if ('error' in res && res.error) toast.error(res.error)
      else if ('delivered' in res && res.delivered) toast.success('Invite re-sent')
      else if ('link' in res && res.link) {
        navigator.clipboard.writeText(res.link)
        toast.success('Link copied (email not configured)')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={onResend}
        disabled={busy}
        className="rounded-[3px] border border-rule px-2.5 py-1 text-xs text-ink hover:bg-surface-sunken disabled:opacity-50"
      >
        Resend
      </button>
      <button
        onClick={onRevoke}
        disabled={busy}
        className="rounded-[3px] px-2.5 py-1 text-xs text-rejected hover:underline disabled:opacity-50"
      >
        Revoke
      </button>
    </div>
  )
}
