import { NextRequest } from "next/server";
import { workspace, session } from "@/lib/server";
import { toCsv, type CsvCell } from "@/lib/csv";

export const dynamic = "force-dynamic";

/**
 * CSV export for accounting. Runs under the caller's session, so the server scopes rows
 * to their company (and a subcontractor only sees their own). Supports
 * /api/export/expenses and /api/export/payments.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  if (!(await session())) return new Response("Unauthorized", { status: 401 });
  const ws = await workspace();
  try {
    let filename: string;
    let headers: string[];
    let rows: CsvCell[][];

    if (type === "expenses") {
      const data = await collectRows((cursor) =>
        ws.listExpenses(undefined, cursor),
      );
      filename = "expenses.csv";
      headers = ["Date", "Vendor", "Description", "Amount", "Status"];
      rows = (data ?? []).map((e) => [
        new Date(e.created_at).toISOString().slice(0, 10),
        e.vendor,
        e.description,
        Number(e.amount),
        e.status,
      ]);
    } else if (type === "payments") {
      const data = await collectRows((cursor) => ws.listPayments(cursor));
      filename = "payouts.csv";
      headers = [
        "Date",
        "Task",
        "Recipient",
        "Amount",
        "Status",
        "Reference",
        "Paid at",
      ];
      rows = (data ?? []).map((p) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const task = p.tasks as any as { title?: string } | null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rcpt = p.users as any as { name?: string; email?: string } | null;
        return [
          new Date(p.created_at).toISOString().slice(0, 10),
          task?.title ?? "",
          rcpt?.name ?? rcpt?.email ?? "",
          Number(p.amount),
          p.status,
          p.reference ?? "",
          p.paid_at ? new Date(p.paid_at).toISOString().slice(0, 10) : "",
        ];
      });
    } else {
      return new Response("Unknown export type", { status: 404 });
    }

    return new Response(toCsv(headers, rows), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "cache-control": "private, no-store",
        "content-disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    if (e instanceof ExportLimitError)
      return new Response(e.message, { status: 413 });
    throw e;
  }
}

class ExportLimitError extends Error {}
async function collectRows<T extends { created_at: string; id: string }>(
  load: (cursor?: { created_at: string; id: string }) => Promise<T[]>,
) {
  const rows: T[] = [];
  let cursor: { created_at: string; id: string } | undefined;
  for (let page = 0; page < 20; page++) {
    const batch = await load(cursor);
    rows.push(...batch);
    if (batch.length < 500) return rows;
    cursor = batch[batch.length - 1];
  }
  throw new ExportLimitError(
    "Export exceeds 10000 records. Narrow the dataset before exporting.",
  );
}
