import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeType = 'light' | 'dark' | 'oled' | 'system'
export type LangType = 'en' | 'ru' | 'uk' | 'cs' | 'de'

interface AppState {
  theme: ThemeType
  setTheme: (theme: ThemeType) => void
  lang: LangType
  setLang: (lang: LangType) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      lang: 'en',
      setLang: (lang) => set({ lang }),
    }),
    {
      name: 'buildops-lite-settings',
    }
  )
)
