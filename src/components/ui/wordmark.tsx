import Link from 'next/link'
import { cn } from '@/lib/utils'

/** CostPacket wordmark — clean editorial serif lockup, no badge. */
export function Wordmark({
  size = 'md',
  href = '/',
  className,
}: {
  size?: 'sm' | 'md'
  href?: string
  className?: string
}) {
  const text = size === 'sm' ? 'text-base' : 'text-lg'
  return (
    <Link
      href={href}
      className={cn('font-display font-semibold tracking-tight text-ink', text, className)}
    >
      CostPacket
    </Link>
  )
}
