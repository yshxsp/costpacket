import { workspace } from "@/lib/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ApproveRejectButtons } from "@/components/features/approve-reject-expense";
import { ExportPdfButton } from "@/components/features/export-pdf-button";
import { PageShell, PageHeader } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty";
import { Stamp, statusTone, statusLabel } from "@/components/ui/status";
import { cn } from "@/lib/utils";

const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filterStatus } = await searchParams;
  const ws = await workspace();
  const isContractor = ws.staff;
  const expenses = (await ws.listExpenses()).filter(
    (e) => !filterStatus || e.status === filterStatus,
  );
  const signedByPath = new Map(
    expenses
      .filter((e) => e.receipt_path)
      .map((e) => [
        e.receipt_path!,
        "/api/receipts?path=" + encodeURIComponent(e.receipt_path!),
      ]),
  );
  const totals = {
    pending: expenses?.filter((e) => e.status === "PENDING").length ?? 0,
    approved: expenses?.filter((e) => e.status === "APPROVED").length ?? 0,
    total: expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0,
  };

  const summary = [
    { label: "Pending review", value: totals.pending },
    { label: "Approved", value: totals.approved },
    { label: "Total amount", value: `$${totals.total.toLocaleString()}` },
  ];

  return (
    <PageShell>
      {expenses.length === 500 && (
        <p className="mb-4 text-sm text-ink-muted">
          Showing the latest 500 entries. CSV exports include up to 10,000
          entries.
        </p>
      )}
      <PageHeader
        kicker="Inbox"
        title="Expenses"
        description={`${expenses?.length ?? 0} expense${expenses?.length !== 1 ? "s" : ""} · $${totals.total.toLocaleString()} total`}
      >
        <ExportPdfButton expenses={expenses || []} />
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- API download, not a page nav */}
        <a
          href="/api/export/expenses"
          className="inline-flex items-center gap-2 rounded-[3px] border border-rule px-3 py-2 text-sm font-medium text-ink hover:bg-surface-sunken"
        >
          Export CSV
        </a>
        <Button asChild>
          <Link href="/expenses/new">
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Submit expense
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-6 grid grid-cols-3 gap-px overflow-hidden rounded-[3px] border border-rule bg-rule">
        {summary.map((s) => (
          <div key={s.label} className="bg-surface p-5">
            <div className="label">{s.label}</div>
            <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-ink">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex w-fit items-center gap-1 rounded-[3px] border border-rule bg-surface p-1">
        <FilterLink href="?" active={!filterStatus} label="All" />
        {STATUSES.map((s) => (
          <FilterLink
            key={s}
            href={`?status=${s}`}
            active={filterStatus === s}
            label={statusLabel(s)}
          />
        ))}
      </div>

      {!expenses || expenses.length === 0 ? (
        <EmptyState
          title="No expenses found"
          description="Submit a receipt to log an expense against a task."
        >
          <Button asChild>
            <Link href="/expenses/new">
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              Submit expense
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-[3px] border border-rule bg-surface">
          {expenses.map((exp) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const task = exp.tasks as any as {
              id: string;
              title: string;
            } | null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const submitter = exp.users as any as {
              name?: string;
              email?: string;
            } | null;

            return (
              <div
                key={exp.id}
                className="flex flex-col gap-3 border-b border-rule px-5 py-4 last:border-0 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium text-ink">
                      {exp.description}
                    </p>
                    <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink">
                      ${Number(exp.amount).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-muted">
                    {exp.vendor && <span>{exp.vendor}</span>}
                    {task && (
                      <Link
                        href={`/tasks/${task.id}`}
                        className="transition-colors hover:text-accent"
                      >
                        {task.title}
                      </Link>
                    )}
                    {submitter && isContractor && (
                      <span className="text-ink-faint">
                        by {submitter.name ?? submitter.email}
                      </span>
                    )}
                    <span className="font-mono text-ink-faint">
                      {new Date(exp.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Stamp tone={statusTone(exp.status)}>
                    {statusLabel(exp.status)}
                  </Stamp>
                  {isContractor && exp.status === "PENDING" && (
                    <ApproveRejectButtons expenseId={exp.id} />
                  )}
                  {exp.receipt_path && signedByPath.get(exp.receipt_path) && (
                    <a
                      href={signedByPath.get(exp.receipt_path)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent transition-colors hover:underline"
                    >
                      Receipt
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

function FilterLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-[2px] px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-surface-sunken text-ink" : "text-ink-muted hover:text-ink",
      )}
    >
      {label}
    </Link>
  );
}
