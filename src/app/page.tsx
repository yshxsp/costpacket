import Link from 'next/link'
import type { ComponentType, SVGProps } from 'react'
import { ArrowRight, BarChart3, CheckCircle, Receipt } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f100d] text-stone-50">
      <header className="border-b border-stone-800/80 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#d97757]/15 text-[#d97757]">
              <Receipt className="h-4 w-4" />
            </span>
            CostPacket
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-stone-300 transition-colors hover:text-white">
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-md bg-[#d97757] px-4 py-2 text-sm font-semibold text-[#141413] transition-colors hover:bg-[#e68a6b]"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <p className="mb-5 w-fit border-l-2 border-[#d97757] bg-stone-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-stone-300">
              Job-costed expense packets
            </p>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-normal text-stone-50 md:text-7xl">
              Every job cost starts with the receipt.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-300">
              CostPacket keeps receipts, task expenses, approvals, payout records,
              and PDF backup tied to the right project before bookkeeping turns
              into a week of message chasing.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#d97757] px-5 py-3 text-sm font-bold text-[#141413] transition-colors hover:bg-[#e68a6b]"
              >
                Build a packet
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-stone-700 px-5 py-3 text-sm font-semibold text-stone-100 transition-colors hover:border-stone-500 hover:bg-stone-900"
              >
                Open workspace
              </Link>
            </div>
          </div>

          <div className="border border-stone-800 bg-[#171813] p-5 shadow-2xl shadow-black/30">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500">Packet</p>
                <h2 className="text-xl font-bold">Kitchen remodel - March</h2>
              </div>
              <span className="rounded-sm bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-300">
                Approved
              </span>
            </div>
            <div className="divide-y divide-stone-800">
              {[
                ['Task', 'Cabinet install', '$1,800'],
                ['Receipt', 'Lumber yard', '$426.18'],
                ['Receipt', 'Hardware supplies', '$119.42'],
                ['Payout', 'Subcontractor transfer', '$1,800'],
              ].map(([kind, label, amount]) => (
                <div key={label} className="grid grid-cols-[96px_1fr_auto] gap-3 py-4 text-sm">
                  <span className="font-mono text-xs uppercase text-stone-500">{kind}</span>
                  <span className="text-stone-200">{label}</span>
                  <span className="font-semibold text-stone-50">{amount}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="bg-stone-900 p-3">
                <p className="text-xs text-stone-500">Receipts</p>
                <p className="text-lg font-bold">12</p>
              </div>
              <div className="bg-stone-900 p-3">
                <p className="text-xs text-stone-500">Pending</p>
                <p className="text-lg font-bold">$545</p>
              </div>
              <div className="bg-stone-900 p-3">
                <p className="text-xs text-stone-500">Packet</p>
                <p className="text-lg font-bold">PDF</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-stone-800 bg-[#141413]">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 py-10 md:grid-cols-3">
            <Feature
              icon={Receipt}
              title="Receipts land on the job"
              text="Upload a receipt, parse the amount, and keep the backup tied to the task that created the cost."
            />
            <Feature
              icon={CheckCircle}
              title="Approvals stay explicit"
              text="Contractors review pending expenses before they become payout or bookkeeping noise."
            />
            <Feature
              icon={BarChart3}
              title="Packets leave cleanly"
              text="Export expense packets when a client, accountant, or subcontractor needs the paper trail."
            />
          </div>
        </section>
      </main>
    </div>
  )
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  title: string
  text: string
}) {
  return (
    <div className="border border-stone-800 bg-[#181914] p-5">
      <Icon className="mb-4 h-5 w-5 text-[#d97757]" />
      <h3 className="font-bold text-stone-50">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-stone-400">{text}</p>
    </div>
  )
}
