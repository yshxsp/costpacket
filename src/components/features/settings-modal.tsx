'use client'

import type { ComponentType, SVGProps } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Moon, Sun, Monitor, AppWindow } from 'lucide-react'
import { useAppStore, ThemeType, LangType } from '@/lib/store'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { setTheme: setNextTheme } = useTheme()
  const { theme, setTheme, lang, setLang } = useAppStore()

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme)
    if (newTheme === 'oled') {
      setNextTheme('oled')
    } else if (newTheme === 'light') {
      setNextTheme('light')
    } else if (newTheme === 'system') {
      setNextTheme('system')
    } else {
      setNextTheme('dark')
    }
  }

  const themes: { value: ThemeType; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
    { value: 'light', label: 'Light (Paper)', icon: Sun },
    { value: 'dark', label: 'Dark (Carbon)', icon: Moon },
    { value: 'oled', label: 'OLED Black', icon: Monitor },
    { value: 'system', label: 'System', icon: AppWindow },
  ]

  const langs: { value: LangType; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'ru', label: 'Русский' },
    { value: 'uk', label: 'Українська' },
    { value: 'cs', label: 'Čeština' },
    { value: 'de', label: 'Deutsch' },
  ]

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            className="relative w-full max-w-md overflow-hidden rounded-[3px] border border-rule-strong bg-surface shadow-[0_30px_80px_-30px_rgba(27,26,22,0.55)]"
          >
            <div className="flex items-center justify-between border-b border-rule px-6 py-4">
              <h2 className="font-display text-lg text-ink">Settings</h2>
              <button
                onClick={onClose}
                className="-mr-2 rounded-[3px] p-2 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="space-y-8 p-6">
              <section className="space-y-3">
                <h3 className="label">Appearance</h3>
                <div className="grid grid-cols-2 gap-2">
                  {themes.map((t) => {
                    const active = theme === t.value
                    return (
                      <button
                        key={t.value}
                        onClick={() => handleThemeChange(t.value)}
                        className={cn(
                          'flex items-center gap-3 rounded-[3px] border p-3 transition-colors',
                          active
                            ? 'border-accent bg-accent-soft text-ink'
                            : 'border-rule bg-background text-ink-muted hover:bg-surface-sunken hover:text-ink'
                        )}
                      >
                        <t.icon className="h-4 w-4" strokeWidth={1.75} />
                        <span className="text-sm font-medium">{t.label}</span>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="label">Language</h3>
                <div className="grid grid-cols-2 gap-2">
                  {langs.map((l) => {
                    const active = lang === l.value
                    return (
                      <button
                        key={l.value}
                        onClick={() => setLang(l.value)}
                        className={cn(
                          'rounded-[3px] border p-3 text-left transition-colors',
                          active
                            ? 'border-accent bg-accent-soft text-ink'
                            : 'border-rule bg-background text-ink-muted hover:bg-surface-sunken hover:text-ink'
                        )}
                      >
                        <span className="text-sm font-medium">{l.label}</span>
                      </button>
                    )
                  })}
                </div>
              </section>
            </div>

            <div className="border-t border-rule bg-surface-sunken px-6 py-4">
              <p className="text-center text-xs text-ink-faint">
                Settings are saved locally on this device.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
