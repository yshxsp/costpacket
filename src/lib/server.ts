import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { runtimeEnv, databaseUrl } from "./runtime";
import { createDb } from "./db/client";
import { createAuth } from "./auth";
import { ensureProfile, Workspace } from "./workspace";
export const services = cache(async () => {
  const env = await runtimeEnv();
  const db = createDb(databaseUrl(env), Boolean(env.HYPERDRIVE));
  return { env, db, auth: createAuth(db, env) };
});
export const session = cache(async () => {
  const requestHeaders = await headers();
  const { auth } = await services();
  try {
    return await auth.api.getSession({ headers: requestHeaders });
  } catch {
    throw new Error(
      "Sign-in service is temporarily unavailable. Please retry.",
    );
  }
});
export const workspace = cache(async () => {
  const s = await session();
  if (!s) redirect("/login");
  const { db } = await services();
  return new Workspace(db, s.user, await ensureProfile(db, s.user));
});
