"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Receipt,
  Loader2,
  ImagePlus,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { createExpense, loadExpenseTasks } from "@/app/actions/create";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";

type Conf = "high" | "medium" | "low";
type ReceiptField = "vendor" | "amount" | "description";

export default function NewExpensePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTaskId = searchParams.get("task_id") ?? "";

  const [loading, setLoading] = useState(false);
  const [parsingAI, setParsingAI] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<{ id: string; title: string }[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);

  const [formDataState, setFormDataState] = useState({
    description: "",
    vendor: "",
    amount: "",
  });

  // Receipt-review state: which values came from the AI, how confident it was,
  // and which fields the human has since edited (= taken ownership of). A field
  // "needs review" while it's AI-filled, below high confidence, and untouched.
  const [confidence, setConfidence] = useState<Record<
    ReceiptField,
    Conf
  > | null>(null);
  const [legible, setLegible] = useState(true);
  const [aiFilled, setAiFilled] = useState(false);
  const [touched, setTouched] = useState<Record<ReceiptField, boolean>>({
    vendor: false,
    amount: false,
    description: false,
  });

  const needsReview = (f: ReceiptField) =>
    aiFilled && !touched[f] && confidence != null && confidence[f] !== "high";

  const markTouched = (f: ReceiptField) =>
    setTouched((t) => (t[f] ? t : { ...t, [f]: true }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingAI(true);
    setError(null);

    try {
      const data = new FormData();
      data.append("file", file);

      const { parseReceipt } = await import("@/app/actions/parse-receipt");
      const res = await parseReceipt(data);

      if (res.receiptUrl) setReceiptUrl(res.receiptUrl);
      if (res.receiptPath) setReceiptPath(res.receiptPath);
      if (res.error) {
        setError(res.error);
        setAiFilled(false);
      } else if (res.parsedData) {
        setFormDataState({
          description: res.parsedData.description,
          vendor: res.parsedData.vendor,
          amount: res.parsedData.amount.toString(),
        });
        setConfidence(res.confidence ?? null);
        setLegible(res.legible ?? true);
        setAiFilled(true);
        setTouched({ vendor: false, amount: false, description: false });
      }
    } catch {
      setError("Failed to process image");
    } finally {
      setParsingAI(false);
    }
  };

  async function loadTasks() {
    if (tasksLoaded) return;
    setTasks(await loadExpenseTasks());
    setTasksLoaded(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const description = (fd.get("description") as string).trim();
    const vendor = (fd.get("vendor") as string).trim();
    const amount = parseFloat((fd.get("amount") as string) || "0");
    const task_id = fd.get("task_id") as string;

    if (!description || !amount) {
      setError("Description and amount are required.");
      setLoading(false);
      return;
    }

    const result = await createExpense({
      description,
      vendor: vendor || null,
      amount,
      task_id: task_id || null,
      receipt_path: receiptPath,
    });
    const insertError = result.error ? { message: result.error } : null;

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    if (task_id) {
      router.push(`/tasks/${task_id}`);
    } else {
      router.push("/expenses");
    }
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl p-6 sm:p-8">
      <Link
        href="/expenses"
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        Back to expenses
      </Link>

      <div className="mb-6 border-b border-rule pb-6">
        <p className="label mb-2">New expense</p>
        <h1 className="font-display text-3xl text-ink">Submit an expense</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Attach a receipt and enter its details for review.
        </p>
      </div>

      <Card className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Receipt dropzone */}
          <div className="relative overflow-hidden rounded-[3px] border border-dashed border-rule-strong bg-surface-sunken">
            {parsingAI && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-surface/95">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
                <span className="label text-accent">Scanning receipt…</span>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              disabled={parsingAI}
            />
            <div className="pointer-events-none flex flex-col items-center justify-center gap-2 px-6 py-8 text-center">
              {!receiptUrl ? (
                <>
                  <ImagePlus
                    className="h-7 w-7 text-ink-faint"
                    strokeWidth={1.5}
                  />
                  <h3 className="font-medium text-ink">Upload receipt</h3>
                  <p className="max-w-xs text-xs leading-relaxed text-ink-muted">
                    Attach a photo and we&apos;ll prefill vendor, amount, and
                    description.
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle2
                    className="h-7 w-7 text-approved"
                    strokeWidth={1.5}
                  />
                  <h3 className="font-medium text-ink">Receipt attached</h3>
                  <p className="text-xs font-medium text-approved">
                    Click to upload a different image.
                  </p>
                </>
              )}
            </div>
          </div>

          {aiFilled && (
            <div
              className={cn(
                "flex gap-2.5 rounded-[3px] border px-3 py-2.5 text-xs leading-relaxed",
                legible
                  ? "border-pending/40 bg-pending-soft text-pending"
                  : "border-rejected/40 bg-rejected-soft text-rejected",
              )}
            >
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0"
                strokeWidth={1.75}
              />
              <span>
                {legible
                  ? "Auto-filled from your receipt. These are AI suggestions — check each field; submitting confirms the values are correct."
                  : "This image was hard to read. Double-check every field carefully — submitting confirms the values are correct."}
              </span>
            </div>
          )}

          <Field
            label="Description"
            htmlFor="description"
            hint={
              needsReview("description")
                ? "AI was unsure — please verify."
                : undefined
            }
          >
            <Input
              id="description"
              name="description"
              type="text"
              required
              value={formDataState.description}
              onChange={(e) => {
                markTouched("description");
                setFormDataState((s) => ({
                  ...s,
                  description: e.target.value,
                }));
              }}
              placeholder="e.g. Copper wiring — 200ft"
              className={cn(
                needsReview("description") &&
                  "border-pending ring-1 ring-pending/30",
              )}
            />
          </Field>

          <Field
            label="Vendor / store"
            htmlFor="vendor"
            hint={
              needsReview("vendor")
                ? "AI was unsure — please verify."
                : "Optional."
            }
          >
            <Input
              id="vendor"
              name="vendor"
              type="text"
              value={formDataState.vendor}
              onChange={(e) => {
                markTouched("vendor");
                setFormDataState((s) => ({ ...s, vendor: e.target.value }));
              }}
              placeholder="e.g. Home Depot"
              className={cn(
                needsReview("vendor") &&
                  "border-pending ring-1 ring-pending/30",
              )}
            />
          </Field>

          <Field
            label="Amount (USD)"
            htmlFor="amount"
            hint={
              needsReview("amount")
                ? "AI was unsure about the total — double-check it."
                : undefined
            }
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-faint">
                $
              </span>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={formDataState.amount}
                onChange={(e) => {
                  markTouched("amount");
                  setFormDataState((s) => ({ ...s, amount: e.target.value }));
                }}
                placeholder="0.00"
                className={cn(
                  "pl-7 font-mono tabular-nums",
                  needsReview("amount") &&
                    "border-pending ring-1 ring-pending/30",
                )}
              />
            </div>
          </Field>

          <Field label="Linked task" htmlFor="task_id" hint="Optional.">
            <Select
              id="task_id"
              name="task_id"
              defaultValue={defaultTaskId}
              onFocus={loadTasks}
            >
              <option value="">No task</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
          </Field>

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
                  Submitting…
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4" strokeWidth={1.75} />
                  Submit expense
                </>
              )}
            </Button>
            <Button asChild variant="outline">
              <Link href="/expenses">Cancel</Link>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
