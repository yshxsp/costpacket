"use server";
import { unstable_rethrow } from "next/navigation";
import { workspace, services } from "@/lib/server";
import { safeError, WorkspaceError } from "@/lib/workspace";
import { createPortalSession, paddleRequest } from "@/lib/paddle/api";
import { tenantProof } from "@/lib/paddle/persistence";
export async function getPortalUrl() {
  try {
    const ws = await workspace();
    if (ws.profile.role !== "ADMIN")
      throw new WorkspaceError("Only an admin can manage billing.", 403);
    const sub = await ws.subscription();
    if (!sub) throw new WorkspaceError("No subscription to manage.");
    const url = await createPortalSession(
      sub.paddle_customer_id,
      sub.paddle_subscription_id,
      (await services()).env,
    );
    if (!url) throw new Error("Missing billing portal");
    return { url };
  } catch (e) {
    unstable_rethrow(e);
    return { error: safeError(e) };
  }
}
export async function startCheckout() {
  try {
    const ws = await workspace();
    if (ws.profile.role !== "ADMIN")
      throw new WorkspaceError("Only an admin can manage billing.", 403);
    const { env } = await services();
    if (!env.PADDLE_PRICE_ID || !env.PADDLE_API_KEY)
      throw new WorkspaceError("Billing is not configured yet.");
    const existing = await ws.subscription();
    if (
      existing &&
      ["active", "trialing", "past_due", "paused"].includes(existing.status)
    )
      throw new WorkspaceError("Manage the existing subscription instead.");
    const result = await paddleRequest(env, "/transactions", {
      items: [{ price_id: env.PADDLE_PRICE_ID, quantity: 1 }],
      collection_mode: "automatic",
      custom_data: {
        company_id: ws.companyId,
        company_proof: await tenantProof(
          String(env.BETTER_AUTH_SECRET),
          ws.companyId,
        ),
      },
    });
    return { transactionId: result.data.id as string };
  } catch (e) {
    unstable_rethrow(e);
    return { error: safeError(e) };
  }
}
