import { workspace } from "@/lib/server";
import Link from "next/link";
import { MobileNav } from "@/components/features/mobile-nav";
import { DesktopSidebar } from "@/components/features/desktop-sidebar";
import { getCompanyAccess } from "@/lib/billing";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ws = await workspace();
  const { user, profile } = ws;
  const displayName = profile?.name ?? user.email?.split("@")[0] ?? "User";
  const role = profile?.role ?? "SUBCONTRACTOR";

  const access = await getCompanyAccess(ws);

  return (
    <div className="flex h-screen overflow-hidden flex-col md:flex-row">
      {/* Mobile Topbar */}
      <MobileNav displayName={displayName} role={role} />

      {/* Desktop Sidebar */}
      <DesktopSidebar displayName={displayName} role={role} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative bg-background">
        {!access.active && (
          <div className="border-b border-pending/40 bg-pending/10 px-5 py-2.5 text-sm text-ink">
            Your plan is inactive — new projects, tasks, and expenses are
            paused.{" "}
            <Link href="/billing" className="font-medium text-accent underline">
              Go to Billing
            </Link>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
