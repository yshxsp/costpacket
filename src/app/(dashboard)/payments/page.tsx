import { workspace } from "@/lib/server";
import { PageShell, PageHeader } from "@/components/ui/page";
import { EmptyState } from "@/components/ui/empty";
import { Stamp, statusTone, statusLabel } from "@/components/ui/status";
import { MarkPaidButton } from "@/components/features/mark-paid-button";
import { cn } from "@/lib/utils";

const SETTLED = ["PAID", "MARKED_PAID"];

export default async function PaymentsPage() {
  const ws = await workspace();
  const { profile } = ws;
  const role = profile.role;
  const canConfirm = profile.role === "ADMIN";
  const payments = await ws.listPayments();
  const totalPaid =
    payments
      ?.filter((p) => SETTLED.includes(p.status))
      .reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const totalPending =
    payments
      ?.filter((p) => p.status === "PENDING")
      .reduce((s, p) => s + Number(p.amount), 0) ?? 0;

  const summary = [
    { label: "Total paid", value: `$${totalPaid.toLocaleString()}` },
    { label: "Pending", value: `$${totalPending.toLocaleString()}` },
    { label: "Transactions", value: payments?.length ?? 0 },
    {
      label: "Paid count",
      value: payments?.filter((p) => SETTLED.includes(p.status)).length ?? 0,
    },
  ];

  return (
    <PageShell>
      {payments.length === 500 && (
        <p className="mb-4 text-sm text-ink-muted">
          Showing the latest 500 entries. CSV exports include up to 10,000
          entries.
        </p>
      )}
      <PageHeader
        kicker="Payouts"
        title="Payments"
        description={
          role === "SUBCONTRACTOR"
            ? "Your payment history"
            : "All subcontractor payouts"
        }
      />

      {payments && payments.length > 0 && (
        <div className="mb-6">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- API download, not a page nav */}
          <a
            href="/api/export/payments"
            className="inline-flex items-center gap-2 rounded-[3px] border border-rule px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-sunken"
          >
            Export CSV
          </a>
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-rule bg-rule lg:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className="bg-surface p-5">
            <div className="label">{s.label}</div>
            <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-ink">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {!payments || payments.length === 0 ? (
        <EmptyState
          title="No payments yet"
          description="Payouts appear here once tasks are completed and approved."
        />
      ) : (
        <div className="overflow-hidden rounded-[3px] border border-rule bg-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rule">
                <Th>Task</Th>
                {role !== "SUBCONTRACTOR" && (
                  <Th className="hidden md:table-cell">Recipient</Th>
                )}
                <Th>Status</Th>
                <Th className="hidden sm:table-cell">Date</Th>
                <Th className="text-right">Amount</Th>
                {canConfirm && <Th className="text-right">Action</Th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {payments.map((pmt) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const task = pmt.tasks as any as {
                  id: string;
                  title: string;
                } | null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const recipient = pmt.users as any as {
                  name?: string;
                  email?: string;
                } | null;
                return (
                  <tr
                    key={pmt.id}
                    className="transition-colors hover:bg-surface-sunken"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-ink">
                        {task?.title ?? "—"}
                      </p>
                      {pmt.status === "MARKED_PAID" && (
                        <p className="mt-0.5 max-w-[200px] truncate text-xs text-ink-faint">
                          Recorded as paid manually
                          {pmt.reference ? ` · ${pmt.reference}` : ""}
                        </p>
                      )}
                    </td>
                    {role !== "SUBCONTRACTOR" && (
                      <td className="hidden px-5 py-4 md:table-cell">
                        <span className="text-sm text-ink-muted">
                          {recipient?.name ?? recipient?.email ?? "—"}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <Stamp tone={statusTone(pmt.status)}>
                        {statusLabel(pmt.status)}
                      </Stamp>
                    </td>
                    <td className="hidden px-5 py-4 sm:table-cell">
                      <span className="font-mono text-xs text-ink-muted">
                        {new Date(pmt.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-sm font-semibold tabular-nums text-ink">
                      ${Number(pmt.amount).toLocaleString()}
                    </td>
                    {canConfirm && (
                      <td className="px-5 py-4 text-right">
                        {pmt.status === "PENDING" ? (
                          <MarkPaidButton paymentId={pmt.id} />
                        ) : null}
                      </td>
                    )}
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
