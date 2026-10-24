import { getCloudflareContext } from "@opennextjs/cloudflare";
export type ReceiptBucket = {
  put(
    key: string,
    value: ArrayBuffer,
    options?: { httpMetadata: { contentType: string } },
  ): Promise<unknown>;
  get(
    key: string,
  ): Promise<{
    body: ReadableStream;
    httpMetadata?: { contentType?: string };
  } | null>;
  delete(key: string): Promise<unknown>;
};
export type RuntimeEnv = Record<string, unknown> & {
  DATABASE_URL?: string;
  HYPERDRIVE?: { connectionString: string };
  RECEIPTS?: ReceiptBucket;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
};
export async function runtimeEnv(): Promise<RuntimeEnv> {
  try {
    return getCloudflareContext().env as unknown as RuntimeEnv;
  } catch {
    if (process.env.COSTPACKET_LOCAL === "1") return process.env;
    throw new Error(
      "Cloudflare runtime is unavailable. For Node development use COSTPACKET_LOCAL=1.",
    );
  }
}
export function databaseUrl(env: RuntimeEnv) {
  const url = env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL;
  if (!url)
    throw new Error(
      "Database is not configured. Set DATABASE_URL or HYPERDRIVE.",
    );
  return url;
}
