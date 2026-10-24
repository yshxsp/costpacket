import { workspace } from "@/lib/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageShell, PageHeader } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty";
import { Stamp, statusTone, statusLabel } from "@/components/ui/status";

export default async function ProjectsPage() {
  const ws = await workspace();
  const { profile } = ws;
  const role = profile.role;
  const projects = await ws.listProjects();
  const taskCounts = await ws.listTasks();
  const tasksByProject = (taskCounts ?? []).reduce<
    Record<string, { total: number; done: number }>
  >((acc, t) => {
    if (!acc[t.project_id]) acc[t.project_id] = { total: 0, done: 0 };
    acc[t.project_id].total++;
    if (t.status === "COMPLETED") acc[t.project_id].done++;
    return acc;
  }, {});

  const canCreate = role !== "SUBCONTRACTOR";

  return (
    <PageShell>
      <PageHeader
        kicker="Workspace"
        title="Projects"
        description={`${projects?.length ?? 0} project${projects?.length !== 1 ? "s" : ""} in your workspace`}
      >
        {canCreate && (
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              New project
            </Link>
          </Button>
        )}
      </PageHeader>

      {!projects || projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description={
            canCreate
              ? "Create your first project and start logging job costs against it."
              : "You have not been added to any projects yet."
          }
        >
          {canCreate && (
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                Create project
              </Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const tasks = tasksByProject[project.id] ?? { total: 0, done: 0 };
            const pct =
              tasks.total > 0
                ? Math.round((tasks.done / tasks.total) * 100)
                : 0;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group flex flex-col rounded-[3px] border border-rule bg-surface p-5 transition-colors hover:bg-surface-sunken"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-lg leading-tight text-ink transition-colors group-hover:text-accent">
                    {project.name}
                  </h2>
                  <Stamp tone={statusTone(project.status)}>
                    {statusLabel(project.status)}
                  </Stamp>
                </div>

                {project.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-ink-muted">
                    {project.description}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-3 font-mono text-xs text-ink-muted">
                  <span className="tabular-nums">
                    ${Number(project.budget).toLocaleString()}
                  </span>
                  <span className="text-rule-strong">·</span>
                  <span className="tabular-nums">
                    {tasks.done}/{tasks.total} tasks
                  </span>
                </div>

                {tasks.total > 0 && (
                  <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-sunken">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-rule pt-3 text-xs text-ink-faint">
                  <span className="tabular-nums">
                    {tasks.total > 0 ? `${pct}% complete` : "No tasks"}
                  </span>
                  <span className="font-mono">
                    {new Date(project.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
