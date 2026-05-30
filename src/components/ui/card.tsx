import * as React from 'react'
import { cn } from '@/lib/utils'

/** A sheet of paper — the base surface for grouped content. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-[3px] border border-rule bg-surface', className)}
      {...props}
    />
  )
}

/** Number-forward metric block (no decorative icon tile). */
export function Stat({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('border border-rule bg-surface p-5', className)}>
      <div className="label">{label}</div>
      <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-ink">
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-ink-muted">{hint}</div> : null}
    </div>
  )
}
