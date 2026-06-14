import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Wordmark } from '@/components/ui/wordmark'

export const metadata: Metadata = {
  title: 'Privacy — CostPacket',
  description: 'What CostPacket stores, where it lives, and what it never collects.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-ink">
      <header className="border-b border-rule-strong">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Wordmark />
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[680px] px-6 py-12 text-[15px] leading-7 text-ink-muted">
        <p className="label">Legal</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-ink">Privacy</h1>
        <p className="mt-2 font-mono text-xs text-ink-faint">Last updated 2026-05-30</p>

        <p className="mt-8">
          CostPacket is a job-costing tool for small contractors — receipts, expense
          approvals, and subcontractor payouts. Here is exactly what it stores, in plain
          language. No fine-print games.
        </p>

        <Section title="What this site collects about you">
          Nothing for advertising. No analytics, no third-party trackers, no ad cookies.
          The only cookie we set is the session cookie that keeps you signed in (handled by
          Supabase Auth).
        </Section>

        <Section title="What the product needs to work">
          Your email and password to create an account, and the data you enter — projects,
          tasks, expenses, and any receipt images you upload. When you use AI receipt
          parsing, the uploaded image is sent to Google Gemini to read the vendor, amount,
          and description; we store that result on the expense.
        </Section>

        <Section title="Where your data lives">
          Your account, job data, and receipt images are stored on{' '}
          <strong className="font-medium text-ink">Supabase</strong> (managed PostgreSQL and
          file storage).{' '}
          {/* TODO: state the exact Supabase region once confirmed, e.g. "in the EU (Frankfurt)". */}
          We do not sell or share your data with third parties. The only companies that
          process it on our behalf are: Supabase (database, file storage, sign-in), Google
          Gemini (reading text from receipt images), and Paddle (subscription billing).
        </Section>

        <Section title="Payments">
          Your CostPacket subscription is billed by Paddle, our Merchant of Record, which
          handles card details — we never see or store them. Subcontractor payouts are tracked
          as a manual ledger: you record when and how you paid (e.g. a bank transfer
          reference). CostPacket does not move those funds.
        </Section>

        <Section title="Receipts">
          Receipt images, and the vendor / amount / description extracted from them, are kept
          in your account until you delete them.
        </Section>

        <Section title="How to delete your data">
          Delete individual projects and expenses directly in the app. To delete your entire
          account and everything tied to it, email us and we will remove it.
        </Section>

        <Section title="Not professional advice">
          CostPacket helps you keep records. It is not accounting, tax, or legal advice.
        </Section>

        <Section title="Contact">
          {/* TODO: replace hello@example.com with the real mailbox once <BRAND> domain + Zoho are live */}
          Questions about your data? Email{' '}
          <a href="mailto:hello@example.com" className="font-medium text-accent hover:underline">
            hello@example.com
          </a>
          .
        </Section>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <p className="mt-2">{children}</p>
    </section>
  )
}
