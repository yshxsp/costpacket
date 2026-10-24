import { workspace, session, services } from "@/lib/server";
import { getReceipt } from "@/lib/storage";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!(await session())) return new Response("Unauthorized", { status: 401 });
  const path = new URL(request.url).searchParams.get("path");
  if (!path) return new Response("Missing receipt", { status: 400 });
  const ws = await workspace();
  const record = await ws.receipt(path);
  if (!record) return new Response("Not found", { status: 404 });
  const object = await getReceipt((await services()).env, path);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": record.mime,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      "content-disposition": "inline",
    },
  });
}
