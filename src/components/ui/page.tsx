import * as React from 'react'
import { cn } from '@/lib/utils'

/** Standard padded, max-width page container. */
export function PageShell({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto max-w-6xl p-6 sm:p-8', className)} {...props} />
}

/** Page title + optional description, with an actions slot, over a ledger rule. */
export function PageHeader({
  title,
  description,
  kicker,
  children,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  kicker?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-rule pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {kicker ? <p className="label mb-2">{kicker}</p> : null}
        <h1 className="font-display text-3xl tracking-tight text-ink">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        ) : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-3">{children}</div> : null}
    </div>
  )
}
