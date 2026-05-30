import * as React from 'react'

/** Dashed-rule empty state with optional action slot. */
export function EmptyState({
  title,
  description,
  children,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="border border-dashed border-rule-strong bg-surface/40 px-6 py-14 text-center">
      <p className="font-display text-lg text-ink">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
      ) : null}
      {children ? <div className="mt-6 flex justify-center">{children}</div> : null}
    </div>
  )
}
