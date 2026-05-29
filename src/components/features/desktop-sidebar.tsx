'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutDashboard, FolderKanban, ClipboardList, Receipt, CreditCard, Settings, LogOut, User } from 'lucide-react'
import { logout } from '@/app/(auth)/actions'
import { useTranslation } from '@/lib/i18n'
import { SettingsModal } from './settings-modal'

export function DesktopSidebar({ displayName, role }: { displayName: string, role: string }) {
  const { t } = useTranslation()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const navItems = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/projects', label: t('projects'), icon: FolderKanban },
    { href: '/tasks', label: t('tasks'), icon: ClipboardList },
    { href: '/expenses', label: t('expenses'), icon: Receipt },
    { href: '/payments', label: t('payments'), icon: CreditCard },
    { href: '/settings', label: 'Profile', icon: User },
  ]

  return (
    <>
      <aside className="hidden md:flex w-60 flex-shrink-0 border-r border-border flex-col bg-[#11120e]">
        <div className="px-5 py-5 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold text-foreground text-sm tracking-tight">
              CostPacket
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-foreground hover:bg-muted/40 transition-all text-sm font-medium group"
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-500 hover:text-secondary hover:bg-secondary/10 transition-all text-sm font-medium mb-2"
          >
            <Settings className="w-4 h-4" />
            {t('settings')}
          </button>
          
          <div className="px-3 py-2 mb-1 border-t border-border pt-3">
            <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{role}</p>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              {t('signout')}
            </button>
          </form>
        </div>
      </aside>

      {settingsOpen && <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />}
    </>
  )
}
