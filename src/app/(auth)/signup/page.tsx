'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Wordmark } from '@/components/ui/wordmark'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      // Role is assigned server-side: a public signup creates a new company and
      // its ADMIN owner (see the handle_new_user DB trigger). Never trust a
      // client-sent role.
      options: { data: { name } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Wordmark />
        </div>

        <Card className="p-7 shadow-[0_24px_60px_-30px_rgba(27,26,22,0.45)] sm:p-8">
          <h1 className="font-display text-2xl text-ink">Create your account</h1>
          <p className="mb-6 mt-1 text-sm text-ink-muted">
            Keep receipts and approvals tied to the right job.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full name" htmlFor="name">
              <Input id="name" name="name" type="text" required placeholder="John Smith" />
            </Field>

            <Field label="Email address" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
              />
            </Field>

            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Min. 6 characters"
              />
            </Field>

            {error && (
              <div className="rounded-[3px] border border-rejected/30 bg-rejected-soft px-3 py-2 text-sm text-rejected">
                {error}
              </div>
            )}

            <Button id="signup-submit" type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Already have an account?{' '}
            <Link href="/login" className="whitespace-nowrap font-medium text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
