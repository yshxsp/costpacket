'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Hammer, LayoutDashboard, FolderKanban, ClipboardList, Receipt, CreditCard, Settings, LogOut, User } from 'lucide-react'
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
      <aside className="hidden md:flex w-60 flex-shrink-0 border-r border-white/5 flex-col bg-black/40 backdrop-blur-md">
        <div className="px-5 py-5 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Hammer className="w-4 h-4 text-orange-500" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">
              BuildOps <span className="text-indigo-400">Lite</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium group"
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/5">
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all text-sm font-medium mb-2"
          >
            <Settings className="w-4 h-4" />
            {t('settings')}
          </button>
          
          <div className="px-3 py-2 mb-1 border-t border-white/5 pt-3">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{role}</p>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all text-sm font-medium"
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
