import { workspace } from "@/lib/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewTaskForm } from "@/components/features/new-task-form";

export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ws = await workspace();
  const { user, profile } = ws;
  const project = await ws.getProject(id);
  if (!project || (project.owner_id !== user.id && profile.role !== "ADMIN"))
    notFound();
  const assignees = (await ws.members()).map((u) => ({
    id: u.id,
    label: u.name || u.email,
  }));

  return (
    <div className="mx-auto max-w-2xl p-6 sm:p-8">
      <Link
        href={`/projects/${id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        Back to {project.name}
      </Link>

      <div className="mb-6 border-b border-rule pb-6">
        <p className="label mb-2">New task</p>
        <h1 className="font-display text-3xl text-ink">Add a task</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Create a task under {project.name}.
        </p>
      </div>

      <NewTaskForm projectId={id} assignees={assignees} />
    </div>
  );
}
