"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FolderKanban, Loader2 } from "lucide-react";
import { createProject } from "@/app/actions/create";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active", desc: "Currently in progress" },
  { value: "ON_HOLD", label: "On Hold", desc: "Temporarily paused" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("ACTIVE");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string).trim();
    const description = (fd.get("description") as string).trim();
    const budget = parseFloat((fd.get("budget") as string) || "0");

    if (!name) {
      setError("Project name is required.");
      setLoading(false);
      return;
    }

    const result = await createProject({
      name,
      description: description || null,
      budget,
      status,
    });
    const insertError = result.error ? { message: result.error } : null;

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/projects");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl p-6 sm:p-8">
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        Back to projects
      </Link>

      <div className="mb-6 border-b border-rule pb-6">
        <p className="label mb-2">New project</p>
        <h1 className="font-display text-3xl text-ink">Create a project</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Fill in the details to start a new job.
        </p>
      </div>

      <Card className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="Project name" htmlFor="name">
            <Input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Downtown Office Renovation"
            />
          </Field>

          <Field label="Description" htmlFor="description" hint="Optional.">
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Brief summary of this project…"
            />
          </Field>

          <Field label="Budget (USD)" htmlFor="budget">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-faint">
                $
              </span>
              <Input
                id="budget"
                name="budget"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="pl-7 font-mono tabular-nums"
              />
            </div>
          </Field>

          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-ink">
              Initial status
            </span>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={cn(
                    "rounded-[3px] border p-3 text-left transition-colors",
                    status === opt.value
                      ? "border-accent bg-accent-soft text-ink"
                      : "border-rule bg-surface text-ink-muted hover:bg-surface-sunken hover:text-ink",
                  )}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="mt-0.5 text-xs opacity-100">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-[3px] border border-rejected/30 bg-rejected-soft px-3 py-2 text-sm text-rejected">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <FolderKanban className="h-4 w-4" strokeWidth={1.75} />
                  Create project
                </>
              )}
            </Button>
            <Button asChild variant="outline">
              <Link href="/projects">Cancel</Link>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
