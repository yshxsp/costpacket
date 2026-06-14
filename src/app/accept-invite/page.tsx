import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function Shell({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-[3px] border border-rule bg-surface p-8 text-center">
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm text-ink-muted">{body}</p>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </main>
  )
}

function friendly(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('different email')) return 'This invite was sent to a different email address. Sign in with that address to accept.'
  if (m.includes('expired') || m.includes('already used') || m.includes('not found')) {
    return 'This invite is no longer valid — it may have expired or already been used. Ask for a new one.'
  }
  return 'We could not accept this invite. Ask the company admin to re-send it.'
}

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  if (!token) {
    return <Shell title="Invalid invite" body="This invite link is missing its token." />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const next = encodeURIComponent(`/accept-invite?token=${token}`)
    return (
      <Shell
        title="Sign in to accept"
        body="Sign in or create an account with the invited email address to join the company."
      >
        <Link
          href={`/login?next=${next}`}
          className="inline-block rounded-[3px] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/90"
        >
          Go to sign in
        </Link>
      </Shell>
    )
  }

  const { error } = await supabase.rpc('redeem_invite', { p_token: token })
  if (!error) redirect('/dashboard')

  return <Shell title="Couldn't accept invite" body={friendly(error.message)} />
}
