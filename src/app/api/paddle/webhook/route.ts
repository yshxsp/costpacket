import { readLimitedBody, BodyLimitError } from "@/lib/read-body";
import { verifyPaddleSignature } from "@/lib/paddle/verify";
import { applyBillingEvent } from "@/lib/paddle/persistence";
import { services } from "@/lib/server";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const { env, db } = await services();
  if (!env.PADDLE_WEBHOOK_SECRET || !env.PADDLE_PRICE_ID)
    return new Response("Billing not configured", { status: 503 });
  let raw: string;
  try {
    raw = await readLimitedBody(request, 262144);
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Invalid body", {
      status: e instanceof BodyLimitError ? e.status : 400,
    });
  }
  const result = await verifyPaddleSignature(
    raw,
    request.headers.get("paddle-signature"),
    String(env.PADDLE_WEBHOOK_SECRET),
  );
  if (!result.ok)
    return new Response(result.message, { status: result.status });
  try {
    const status = await applyBillingEvent(
      db,
      result.event,
      String(env.BETTER_AUTH_SECRET),
      String(env.PADDLE_PRICE_ID),
    );
    return new Response(status);
  } catch {
    console.error("Billing event could not be applied", {
      eventId: result.event.event_id,
    });
    return new Response("Event could not be applied", { status: 500 });
  }
}
