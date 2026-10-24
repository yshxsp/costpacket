import { workspace } from "@/lib/server";
import Link from "next/link";
import { PageShell, PageHeader } from "@/components/ui/page";
import { EmptyState } from "@/components/ui/empty";
import { Stamp, statusTone, statusLabel } from "@/components/ui/status";
import { cn } from "@/lib/utils";

const ALL_STATUSES = ["PENDING", "IN_PROGRESS", "REVIEW", "COMPLETED"] as const;

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; project?: string }>;
}) {
  const { status: filterStatus, project: filterProject } = await searchParams;
  const ws = await workspace();
  const tasks = (await ws.listTasks()).filter(
    (t) =>
      (!filterStatus || t.status === filterStatus) &&
      (!filterProject || t.project_id === filterProject),
  );
  const projects = await ws.listProjects();

  return (
    <PageShell>
      <PageHeader
        kicker="Ledger"
        title="Tasks"
        description={`${tasks?.length ?? 0} task${tasks?.length !== 1 ? "s" : ""} found`}
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex items-center gap-1 rounded-[3px] border border-rule bg-surface p-1">
          <FilterLink href="?" active={!filterStatus} label="All" />
          {ALL_STATUSES.map((s) => (
            <FilterLink
              key={s}
              href={`?status=${s}${filterProject ? `&project=${filterProject}` : ""}`}
              active={filterStatus === s}
              label={statusLabel(s)}
            />
          ))}
        </div>

        {projects && projects.length > 0 && (
          <div className="flex items-center gap-1 rounded-[3px] border border-rule bg-surface p-1">
            <FilterLink
              href={filterStatus ? `?status=${filterStatus}` : "?"}
              active={!filterProject}
              label="All projects"
            />
            {projects.map((p) => (
              <FilterLink
                key={p.id}
                href={`?project=${p.id}${filterStatus ? `&status=${filterStatus}` : ""}`}
                active={filterProject === p.id}
                label={p.name}
              />
            ))}
          </div>
        )}
      </div>

      {!tasks || tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description="Try adjusting your filters, or add a task from a project."
        />
      ) : (
        <div className="overflow-hidden rounded-[3px] border border-rule bg-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rule">
                <Th>Task</Th>
                <Th className="hidden md:table-cell">Project</Th>
                <Th className="hidden sm:table-cell">Assignee</Th>
                <Th>Status</Th>
                <Th className="text-right">Amount</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {tasks.map((task) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const project = task.projects as any as {
                  id: string;
                  name: string;
                } | null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const assignee = task.users as any as {
                  name?: string;
                  email?: string;
                } | null;
                return (
                  <tr
                    key={task.id}
                    className="group transition-colors hover:bg-surface-sunken"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="text-sm font-medium text-ink transition-colors group-hover:text-accent"
                      >
                        {task.title}
                      </Link>
                    </td>
                    <td className="hidden px-5 py-4 md:table-cell">
                      {project ? (
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-xs text-ink-muted transition-colors hover:text-accent"
                        >
                          {project.name}
                        </Link>
                      ) : (
                        <span className="text-xs text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="hidden px-5 py-4 sm:table-cell">
                      <span className="text-xs text-ink-muted">
                        {assignee ? (assignee.name ?? assignee.email) : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Stamp tone={statusTone(task.status)}>
                        {statusLabel(task.status)}
                      </Stamp>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-sm tabular-nums text-ink">
                      ${Number(task.amount).toLocaleString()}
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
