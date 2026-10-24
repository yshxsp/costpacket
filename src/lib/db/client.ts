import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
export type Db = ReturnType<typeof createDb>;
export function createDb(url: string, hyperdrive = false) {
  const host = new URL(url).hostname;
  const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host);
  const client = postgres(url, {
    max: 1,
    prepare: false,
    fetch_types: false,
    idle_timeout: 2,
    connect_timeout: 10,
    ...(!hyperdrive ? { ssl: local ? false : ("require" as const) } : {}),
  });
  return drizzle(client, { schema });
}
