import type { RuntimeEnv } from "./runtime";
const validKey =
  /^[a-f0-9-]{36}\/[A-Za-z0-9_-]{1,128}\/[a-f0-9-]{36}\.(jpeg|png|webp)$/;
function check(key: string) {
  if (!validKey.test(key)) throw new Error("Invalid receipt key");
}
export async function putReceipt(
  env: RuntimeEnv,
  key: string,
  bytes: ArrayBuffer,
  mime: string,
) {
  check(key);
  if (env.RECEIPTS) {
    await env.RECEIPTS.put(key, bytes, { httpMetadata: { contentType: mime } });
    return;
  }
  if (env.COSTPACKET_LOCAL !== "1")
    throw new Error("Receipt storage is not configured.");
  const { mkdir, writeFile } = await import("node:fs/promises");
  const { resolve, dirname } = await import("node:path");
  const path = resolve(String(env.LOCAL_RECEIPT_DIR ?? ".data/receipts"), key);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, new Uint8Array(bytes), { mode: 0o600 });
}
export async function getReceipt(env: RuntimeEnv, key: string) {
  check(key);
  if (env.RECEIPTS) return env.RECEIPTS.get(key);
  if (env.COSTPACKET_LOCAL !== "1")
    throw new Error("Receipt storage is not configured.");
  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  try {
    const bytes = await readFile(
      resolve(String(env.LOCAL_RECEIPT_DIR ?? ".data/receipts"), key),
    );
    return { body: new Uint8Array(bytes) };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}
export async function deleteReceipt(env: RuntimeEnv, key: string) {
  check(key);
  if (env.RECEIPTS) {
    await env.RECEIPTS.delete(key);
    return;
  }
  if (env.COSTPACKET_LOCAL === "1") {
    const { unlink } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    await unlink(
      resolve(String(env.LOCAL_RECEIPT_DIR ?? ".data/receipts"), key),
    );
  }
}
