import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/wordmark'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-ink">
      {/* Masthead */}
      <header className="border-b border-rule-strong">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Wordmark />
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-[3px] px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
            >
              Log in
            </Link>
            <Button asChild size="sm">
              <Link href="/signup">Start free</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <p className="reveal label flex items-center gap-2" style={{ animationDelay: '40ms' }}>
              <span className="inline-block h-px w-6 bg-rule-strong" />
              Expense ledger for small contractors
            </p>
            <h1
              className="reveal mt-5 font-display text-5xl leading-[0.98] tracking-tight text-ink md:text-7xl"
              style={{ animationDelay: '120ms' }}
            >
              Every job cost{' '}
              <em className="font-normal italic text-accent">starts with the receipt.</em>
            </h1>
            <p
              className="reveal mt-6 max-w-xl text-lg leading-8 text-ink-muted"
              style={{ animationDelay: '200ms' }}
            >
              CostPacket ties receipts, task expenses, approvals, and payout records to
              the right job — and hands you a clean PDF packet before the back office
              turns into a week of message-chasing.
            </p>
            <div
              className="reveal mt-8 flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: '280ms' }}
            >
              <Button asChild size="lg">
                <Link href="/signup">Build a packet →</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Open workspace</Link>
              </Button>
            </div>
            <p
              className="reveal mt-5 font-mono text-xs text-ink-faint"
              style={{ animationDelay: '340ms' }}
            >
              No card to start · Receipts parsed on upload · Export anytime
            </p>
          </div>

          {/* Packet mock */}
          <div className="reveal" style={{ animationDelay: '420ms' }}>
            <PacketMock />
          </div>
        </section>

        {/* What lands in a packet */}
        <section className="border-t border-rule bg-surface/60">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <div className="flex items-end justify-between border-b border-rule pb-4">
              <h2 className="font-display text-2xl text-ink">What lands in a packet</h2>
              <span className="label hidden sm:block">Job · Kitchen remodel</span>
            </div>
            <dl className="mt-2 divide-y divide-rule">
              {[
                ['Receipt', 'Lumber yard — framing + trim', 'Parsed from photo', '$426.18'],
                ['Receipt', 'Hardware supplies', 'Parsed from photo', '$119.42'],
                ['Task expense', 'Cabinet install — labor', 'Approved by you', '$1,800.00'],
                ['Payout', 'Subcontractor transfer', 'Stripe · tr_1P…', '$1,800.00'],
              ].map(([kind, label, meta, amount]) => (
                <div
                  key={label}
                  className="grid grid-cols-[7rem_1fr_auto] items-baseline gap-x-4 gap-y-1 py-4 sm:grid-cols-[8rem_1fr_10rem_auto]"
                >
                  <span className="label">{kind}</span>
                  <span className="text-sm text-ink">{label}</span>
                  <span className="hidden font-mono text-xs text-ink-faint sm:block">{meta}</span>
                  <span className="text-right font-mono text-sm tabular-nums text-ink">{amount}</span>
                </div>
              ))}
              <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 py-4">
                <span className="font-display text-lg text-ink">Packet total</span>
                <span className="text-right font-mono text-lg font-semibold tabular-nums text-ink">
                  $4,145.60
                </span>
              </div>
            </dl>
          </div>
        </section>

        {/* Three plain value props, as ledger entries */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-px overflow-hidden rounded-[3px] border border-rule bg-rule md:grid-cols-3">
            {[
              ['01', 'Receipts land on the job', 'Snap a receipt, get vendor and amount parsed, and keep the image tied to the task that created the cost.'],
              ['02', 'Approvals stay explicit', 'Review pending expenses and approve or reject them before they become payout or bookkeeping noise.'],
              ['03', 'Packets leave clean', 'Export a job’s receipts, approvals, and payouts as one PDF when a client or accountant asks for the paper trail.'],
            ].map(([num, title, body]) => (
              <div key={num} className="bg-background p-7">
                <span className="font-mono text-sm text-accent">{num}</span>
                <h3 className="mt-3 font-display text-xl text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-rule-strong">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <Wordmark size="sm" />
          <p className="font-mono text-xs text-ink-faint">
            © {new Date().getFullYear()} CostPacket · Job-costed expense packets
          </p>
        </div>
      </footer>
    </div>
  )
}

function PacketMock() {
  return (
    <div className="relative">
      {/* tear-off top edge */}
      <div className="h-3 rounded-t-[3px] border-x border-t border-dashed border-rule-strong bg-surface" />
      <div className="border border-rule-strong bg-surface px-6 pb-6 pt-5 shadow-[0_24px_60px_-30px_rgba(27,26,22,0.5)]">
        <div className="flex items-start justify-between border-b border-rule pb-4">
          <div>
            <p className="label">Packet № 0312</p>
            <h3 className="mt-1 font-display text-xl text-ink">Kitchen remodel — March</h3>
          </div>
          <span className="stamp -rotate-6 text-approved">✓ Approved</span>
        </div>

        <div className="divide-y divide-rule">
          {[
            ['Task', 'Cabinet install', '$1,800.00'],
            ['Receipt', 'Lumber yard', '$426.18'],
            ['Receipt', 'Hardware supplies', '$119.42'],
            ['Payout', 'Subcontractor', '$1,800.00'],
          ].map(([kind, label, amount]) => (
            <div key={label} className="grid grid-cols-[5rem_1fr_auto] items-baseline gap-3 py-3">
              <span className="label">{kind}</span>
              <span className="text-sm text-ink">{label}</span>
              <span className="text-right font-mono text-sm tabular-nums text-ink">{amount}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-[3px] border border-rule bg-rule text-center">
          {[
            ['Receipts', '12'],
            ['Pending', '$545'],
            ['Packet', 'PDF'],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface-sunken px-2 py-3">
              <p className="label">{k}</p>
              <p className="mt-1 font-mono text-base font-semibold tabular-nums text-ink">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
