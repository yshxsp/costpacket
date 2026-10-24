import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db/client";
import { billingEvents, subscriptions } from "../db/schema";
import type { PaddleEvent } from "./verify";
import { mapSubscriptionEvent } from "./events";
async function proofKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}
export async function tenantProof(secret: string, companyId: string) {
  const result = await crypto.subtle.sign(
    "HMAC",
    await proofKey(secret),
    new TextEncoder().encode("costpacket-checkout:" + companyId),
  );
  return Buffer.from(result).toString("hex");
}
export async function verifyTenantProof(
  secret: string,
  companyId: string,
  value: unknown,
) {
  return (
    typeof value === "string" &&
    /^[a-f0-9]{64}$/.test(value) &&
    crypto.subtle.verify(
      "HMAC",
      await proofKey(secret),
      Buffer.from(value, "hex"),
      new TextEncoder().encode("costpacket-checkout:" + companyId),
    )
  );
}
export async function applyBillingEvent(
  db: Db,
  event: PaddleEvent,
  secret: string,
  priceId: string,
) {
  const mapped = mapSubscriptionEvent(event);
  const occurredAt = z.iso.datetime({ offset: true }).parse(event.occurred_at);
  if (mapped) {
    z.uuid().parse(mapped.companyId);
    if (
      !mapped.subscriptionId ||
      !mapped.customerId ||
      mapped.priceId !== priceId
    )
      throw new Error("Unrecognized subscription or price");
    const custom = event.data?.custom_data as
      Record<string, unknown> | undefined;
    if (
      !(await verifyTenantProof(
        secret,
        mapped.companyId,
        custom?.company_proof,
      ))
    )
      throw new Error("Invalid company attribution");
  }
  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(billingEvents)
      .values({ event_id: event.event_id, event_type: event.event_type })
      .onConflictDoNothing()
      .returning();
    if (!inserted.length) return "duplicate";
    if (!mapped) return "ignored";
    const [existing] = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.company_id, mapped.companyId))
      .for("update");
    if (
      existing &&
      existing.paddle_subscription_id !== mapped.subscriptionId &&
      existing.status !== "canceled"
    )
      throw new Error("Company already has another subscription");
    await tx
      .insert(subscriptions)
      .values({
        company_id: mapped.companyId,
        status: mapped.status,
        paddle_customer_id: mapped.customerId!,
        paddle_subscription_id: mapped.subscriptionId!,
        price_id: mapped.priceId,
        current_period_end: mapped.currentPeriodEnd,
        event_at: occurredAt,
      })
      .onConflictDoUpdate({
        target: subscriptions.company_id,
        set: {
          status: mapped.status,
          paddle_customer_id: mapped.customerId!,
          paddle_subscription_id: mapped.subscriptionId!,
          price_id: mapped.priceId,
          current_period_end: mapped.currentPeriodEnd,
          event_at: occurredAt,
          updated_at: new Date().toISOString(),
        },
        setWhere: sql`${subscriptions.event_at} < ${occurredAt}::timestamptz`,
      });
    return "applied";
  });
}
