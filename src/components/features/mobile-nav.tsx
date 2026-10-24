"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Users,
  Wallet,
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  Receipt,
  CreditCard,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";
import { logout } from "@/app/(auth)/actions";
import { useTranslation } from "@/lib/i18n";
import { Wordmark } from "@/components/ui/wordmark";
import { SettingsModal } from "./settings-modal";
import { cn } from "@/lib/utils";

export function MobileNav({
  displayName,
  role,
}: {
  displayName: string;
  role: string;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/projects", label: t("projects"), icon: FolderKanban },
    { href: "/tasks", label: t("tasks"), icon: ClipboardList },
    { href: "/expenses", label: t("expenses"), icon: Receipt },
    { href: "/payments", label: t("payments"), icon: CreditCard },
    ...(["ADMIN", "CONTRACTOR"].includes(role)
      ? [
          { href: "/members", label: "Members", icon: Users },
          { href: "/billing", label: "Billing", icon: Wallet },
        ]
      : []),
    { href: "/settings", label: "Profile", icon: User },
  ];

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between border-b border-rule bg-surface p-4">
        <Wordmark href="/dashboard" />
        <button
          aria-label="Open navigation"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="p-2 text-ink-muted hover:text-ink"
        >
          <Menu className="h-6 w-6" strokeWidth={1.75} />
        </button>
      </div>

      {open && (
        <AccessibleDialog
          label="Navigation"
          onClose={() => setOpen(false)}
          className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none flex-col border-0 bg-background p-0 text-ink open:flex"
        >
          <div className="flex items-center justify-between border-b border-rule p-4">
            <h2 className="font-display text-lg text-ink">Menu</h2>
            <button
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
              className="p-2 text-ink-muted hover:text-ink"
            >
              <X className="h-6 w-6" strokeWidth={1.75} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-6">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/dashboard"
                  ? pathname === href
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-4 rounded-[3px] px-4 py-3 text-base font-medium transition-colors",
                    active
                      ? "bg-surface-sunken text-ink"
                      : "text-ink-muted hover:bg-surface-sunken hover:text-ink",
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.75} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="m-4 rounded-[3px] border border-rule bg-surface p-4">
            <div className="mb-4">
              <p className="truncate text-base font-medium text-ink">
                {displayName}
              </p>
              <p className="label mt-0.5">{role}</p>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                setSettingsOpen(true);
              }}
              className="mb-3 flex w-full items-center justify-center gap-3 rounded-[3px] bg-surface-sunken px-4 py-3 font-medium text-ink-muted transition-colors hover:text-ink"
            >
              <Settings className="h-5 w-5" strokeWidth={1.75} />
              {t("settings")}
            </button>

            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-[3px] border border-rejected/30 bg-rejected-soft px-4 py-3 font-medium text-rejected transition-colors hover:bg-rejected/15"
              >
                <LogOut className="h-5 w-5" strokeWidth={1.75} />
                {t("signout")}
              </button>
            </form>
          </div>
        </AccessibleDialog>
      )}

      {settingsOpen && (
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
