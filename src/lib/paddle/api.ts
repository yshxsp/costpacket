import type { RuntimeEnv } from "../runtime";
function base(env: RuntimeEnv) {
  return env.PADDLE_ENV === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}
export async function paddleRequest(
  env: RuntimeEnv,
  path: string,
  body: unknown,
) {
  if (!env.PADDLE_API_KEY) throw new Error("Billing is not configured.");
  const response = await fetch(base(env) + path, {
    method: "POST",
    headers: {
      authorization: "Bearer " + env.PADDLE_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error("Billing provider could not complete the request.");
  return response.json();
}
export async function createPortalSession(
  customerId: string,
  subscriptionId: string | null,
  env: RuntimeEnv,
) {
  const result = await paddleRequest(
    env,
    `/customers/${encodeURIComponent(customerId)}/portal-sessions`,
    subscriptionId ? { subscription_ids: [subscriptionId] } : {},
  );
  return result.data?.urls?.general?.overview as string | undefined;
}
