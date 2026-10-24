'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, ClipboardList, Receipt, CreditCard, Settings, LogOut, User, Wallet, Users } from 'lucide-react'
import { logout } from '@/app/(auth)/actions'
import { useTranslation } from '@/lib/i18n'
import { Wordmark } from '@/components/ui/wordmark'
import { SettingsModal } from './settings-modal'
import { cn } from '@/lib/utils'

export function DesktopSidebar({ displayName, role }: { displayName: string; role: string }) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const isStaff = role === 'ADMIN' || role === 'CONTRACTOR'
  const navItems = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/projects', label: t('projects'), icon: FolderKanban },
    { href: '/tasks', label: t('tasks'), icon: ClipboardList },
    { href: '/expenses', label: t('expenses'), icon: Receipt },
    { href: '/payments', label: t('payments'), icon: CreditCard },
    ...(isStaff ? [{ href: '/members', label: 'Members', icon: Users }] : []),
    ...(isStaff ? [{ href: '/billing', label: 'Billing', icon: Wallet }] : []),
    { href: '/settings', label: 'Profile', icon: User },
  ]

  return (
    <>
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-rule bg-surface md:flex">
        <div className="border-b border-rule px-5 py-5">
          <Wordmark href="/dashboard" />
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-[3px] px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-surface-sunken text-ink'
                    : 'text-ink-muted hover:bg-surface-sunken hover:text-ink'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-rule px-3 py-4">
          <button
            onClick={() => setSettingsOpen(true)}
            className="mb-2 flex w-full items-center gap-3 rounded-[3px] px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <Settings className="h-4 w-4" strokeWidth={1.75} />
            {t('settings')}
          </button>

          <div className="mb-1 border-t border-rule px-3 pt-3">
            <p className="truncate text-sm font-medium text-ink">{displayName}</p>
            <p className="label mt-0.5">{role}</p>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-[3px] px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-rejected-soft hover:text-rejected"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              {t('signout')}
            </button>
          </form>
        </div>
      </aside>

      {settingsOpen && <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />}
    </>
  )
}
