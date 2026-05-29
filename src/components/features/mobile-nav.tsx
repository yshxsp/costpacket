'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, LayoutDashboard, FolderKanban, ClipboardList, Receipt, CreditCard, LogOut, Settings, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { logout } from '@/app/(auth)/actions'
import { useTranslation } from '@/lib/i18n'
import { SettingsModal } from './settings-modal'

export function MobileNav({ displayName, role }: { displayName: string, role: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
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
    <div className="md:hidden">
      <div className="flex items-center justify-between p-4 border-b border-border bg-[#11120e]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-foreground text-sm tracking-tight">
            CostPacket
          </span>
        </Link>
        <button onClick={() => setOpen(true)} className="p-2 text-zinc-400 hover:text-foreground">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 flex flex-col bg-background border-l border-border"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-bold text-foreground">Menu</span>
              <button onClick={() => setOpen(false)} className="p-2 text-zinc-400 hover:text-foreground">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg text-zinc-300 hover:text-foreground hover:bg-muted/40 transition-all text-base font-medium"
                >
                  <Icon className="w-5 h-5 flex-shrink-0 text-zinc-400" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="px-4 py-6 border-t border-border bg-card m-4 rounded-lg">
              <div className="mb-4">
                <p className="text-base font-medium text-foreground truncate">{displayName}</p>
                <p className="text-sm text-zinc-500 mt-0.5">{role}</p>
              </div>
              <button
                onClick={() => {
                  setOpen(false)
                  setSettingsOpen(true)
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-muted/30 text-zinc-300 hover:text-foreground hover:bg-muted/60 transition-all font-medium mb-3"
              >
                <Settings className="w-5 h-5" />
                {t('settings')}
              </button>
              
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  {t('signout')}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {settingsOpen && <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
