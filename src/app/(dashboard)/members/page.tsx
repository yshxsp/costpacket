import { workspace } from "@/lib/server";
import { redirect } from "next/navigation";
import { PageShell, PageHeader } from "@/components/ui/page";
import { EmptyState } from "@/components/ui/empty";
import { Stamp } from "@/components/ui/status";
import { InviteForm } from "@/components/features/invite-form";
import { InviteActions } from "@/components/features/invite-actions";
import { cn } from "@/lib/utils";

export default async function MembersPage() {
  const ws = await workspace();
  const { profile } = ws;
  const role = profile.role;
  if (!ws.staff) redirect("/dashboard");
  const members = await ws.members();
  const invites = await ws.pendingInvites();
  // Server component renders once per request; reading the clock for an
  // expired-badge is intentional and stable here.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <PageShell>
      <PageHeader
        kicker="Company"
        title="Members"
        description="Teammates and pending invitations."
      />

      <div className="mb-8 max-w-md">
        <InviteForm canInviteAdmin={role === "ADMIN"} />
      </div>

      <h2 className="label mb-3">Active members</h2>
      <div className="mb-10 overflow-hidden rounded-[3px] border border-rule bg-surface">
        <table className="w-full">
          <thead>
            <tr className="border-b border-rule">
              <Th>Name</Th>
              <Th className="hidden sm:table-cell">Email</Th>
              <Th className="text-right">Role</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {(members ?? []).map((m) => (
              <tr key={m.id}>
                <td className="px-5 py-4 text-sm font-medium text-ink">
                  {m.name ?? "—"}
                </td>
                <td className="hidden px-5 py-4 text-sm text-ink-muted sm:table-cell">
                  {m.email}
                </td>
                <td className="px-5 py-4 text-right">
                  <Stamp tone="neutral">{m.role}</Stamp>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="label mb-3">Pending invites</h2>
      {!invites || invites.length === 0 ? (
        <EmptyState
          title="No pending invites"
          description="Invite a teammate using the form above."
        />
      ) : (
        <div className="overflow-hidden rounded-[3px] border border-rule bg-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rule">
                <Th>Email</Th>
                <Th className="hidden sm:table-cell">Role</Th>
                <Th className="hidden md:table-cell">Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {invites.map((inv) => {
                const expired = new Date(inv.expires_at).getTime() < now;
                return (
                  <tr key={inv.id}>
                    <td className="px-5 py-4 text-sm font-medium text-ink">
                      {inv.email}
                    </td>
                    <td className="hidden px-5 py-4 text-sm text-ink-muted sm:table-cell">
                      {inv.role}
                    </td>
                    <td className="hidden px-5 py-4 md:table-cell">
                      <Stamp tone={expired ? "rejected" : "pending"}>
                        {expired ? "Expired" : "Pending"}
                      </Stamp>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <InviteActions inviteId={inv.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={cn("label px-5 py-3 text-left", className)}>{children}</th>
  );
}
