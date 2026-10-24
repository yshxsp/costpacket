"use client";

import type { ComponentType, SVGProps } from "react";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";
import { X, Moon, Sun, Monitor, AppWindow } from "lucide-react";
import { useAppStore, ThemeType, LangType } from "@/lib/store";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { setTheme: setNextTheme } = useTheme();
  const { theme, setTheme, lang, setLang } = useAppStore();

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
    if (newTheme === "oled") {
      setNextTheme("oled");
    } else if (newTheme === "light") {
      setNextTheme("light");
    } else if (newTheme === "system") {
      setNextTheme("system");
    } else {
      setNextTheme("dark");
    }
  };

  const themes: {
    value: ThemeType;
    label: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
  }[] = [
    { value: "light", label: "Light (Paper)", icon: Sun },
    { value: "dark", label: "Dark (Carbon)", icon: Moon },
    { value: "oled", label: "OLED Black", icon: Monitor },
    { value: "system", label: "System", icon: AppWindow },
  ];

  const langs: { value: LangType; label: string }[] = [
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
    { value: "ru", label: "Русский" },
    { value: "uk", label: "Українська" },
    { value: "cs", label: "Čeština" },
    { value: "de", label: "Deutsch" },
  ];

  if (!open) return null;
  return (
    <AccessibleDialog
      label="Settings"
      onClose={onClose}
      className="m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-[3px] border border-rule-strong bg-surface p-0 text-ink shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-rule px-6 py-4">
        <h2 className="font-display text-lg text-ink">Settings</h2>
        <button
          aria-label="Close settings"
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
              const active = theme === t.value;
              return (
                <button
                  key={t.value}
                  aria-pressed={active}
                  onClick={() => handleThemeChange(t.value)}
                  className={cn(
                    "flex items-center gap-3 rounded-[3px] border p-3 transition-colors",
                    active
                      ? "border-accent bg-accent-soft text-ink"
                      : "border-rule bg-background text-ink-muted hover:bg-surface-sunken hover:text-ink",
                  )}
                >
                  <t.icon className="h-4 w-4" strokeWidth={1.75} />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="label">Language</h3>
          <div className="grid grid-cols-2 gap-2">
            {langs.map((l) => {
              const active = lang === l.value;
              return (
                <button
                  key={l.value}
                  aria-pressed={active}
                  onClick={() => setLang(l.value)}
                  className={cn(
                    "rounded-[3px] border p-3 text-left transition-colors",
                    active
                      ? "border-accent bg-accent-soft text-ink"
                      : "border-rule bg-background text-ink-muted hover:bg-surface-sunken hover:text-ink",
                  )}
                >
                  <span className="text-sm font-medium">{l.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="border-t border-rule bg-surface-sunken px-6 py-4">
        <p className="text-center text-xs text-ink-faint">
          Settings are saved locally on this device.
        </p>
      </div>
    </AccessibleDialog>
  );
}
