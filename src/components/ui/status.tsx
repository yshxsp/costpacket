import * as React from 'react'
import { cn } from '@/lib/utils'

export type Tone = 'approved' | 'pending' | 'rejected' | 'neutral' | 'info'

const toneClass: Record<Tone, string> = {
  approved: 'text-approved',
  pending: 'text-pending',
  rejected: 'text-rejected',
  neutral: 'text-ink-muted',
  info: 'text-accent',
}

/** Rubber-stamp status chip. Border + text share the tone color via currentColor. */
export function Stamp({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone
  className?: string
  children: React.ReactNode
}) {
  return <span className={cn('stamp', toneClass[tone], className)}>{children}</span>
}

/** Map common status strings (expenses, tasks, projects, payments) to a tone. */
export function statusTone(status: string): Tone {
  switch (status?.toUpperCase()) {
    case 'APPROVED':
    case 'COMPLETED':
    case 'PAID':
    case 'ACTIVE':
      return 'approved'
    case 'PENDING':
    case 'IN_PROGRESS':
    case 'ON_HOLD':
      return 'pending'
    case 'REJECTED':
    case 'CANCELLED':
    case 'FAILED':
      return 'rejected'
    case 'TODO':
    case 'REVIEW':
    case 'PROCESSING':
      return 'info'
    default:
      return 'neutral'
  }
}

/** Title-case a SCREAMING_SNAKE status for display. */
export function statusLabel(status: string): string {
  return (status ?? '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
