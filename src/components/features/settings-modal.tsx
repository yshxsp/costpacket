'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, X, Moon, Sun, Monitor, AppWindow } from 'lucide-react'
import { useAppStore, ThemeType, LangType } from '@/lib/store'
import { useTheme } from 'next-themes'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { setTheme: setNextTheme } = useTheme()
  const { theme, setTheme, lang, setLang } = useAppStore()

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme)
    
    // Using next-themes for html class manipulation
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

  const themes: { value: ThemeType; label: string; icon: React.FC<any> }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark (Gray)', icon: Moon },
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">App Settings</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 -mr-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-8">
              {/* Theme Settings */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Appearance</h3>
                <div className="grid grid-cols-2 gap-3">
                  {themes.map((t) => {
                    const active = theme === t.value
                    return (
                      <button
                        key={t.value}
                        onClick={() => handleThemeChange(t.value)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          active 
                            ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' 
                            : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                        }`}
                      >
                        <t.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{t.label}</span>
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Language Settings */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Language</h3>
                <div className="grid grid-cols-2 gap-3">
                  {langs.map((l) => {
                    const active = lang === l.value
                    return (
                      <button
                        key={l.value}
                        onClick={() => setLang(l.value)}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          active 
                            ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' 
                            : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                        }`}
                      >
                        <span className="text-sm font-medium">{l.label}</span>
                      </button>
                    )
                  })}
                </div>
              </section>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02]">
              <p className="text-xs text-zinc-500 text-center">Settings are saved locally on this device.</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
