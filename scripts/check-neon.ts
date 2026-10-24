import { readFile } from "node:fs/promises";
import postgres from "postgres";
const file = process.argv[2];
const content = await readFile(file, "utf8");
const match = content.match(/^DATABASE_URL\s*=\s*(.*)$/m);
if (!match) throw new Error("DATABASE_URL missing");
const url = match[1].trim().replace(/^['"]|['"]$/g, "");
if (!new URL(url).hostname.endsWith(".neon.tech"))
  throw new Error("This is not a Neon endpoint");
const db = postgres(url, {
  ssl: "require",
  max: 1,
  prepare: false,
  connect_timeout: 12,
});
try {
  await db`select 1`;
  const rows =
    await db`select exists(select 1 from information_schema.schemata where schema_name='costpacket') as exists`;
  console.log(
    JSON.stringify({ connected: true, costpacketSchemaExists: rows[0].exists }),
  );
} catch (e) {
  console.log(
    JSON.stringify({
      connected: false,
      errorCode: (e as { code?: string }).code ?? "connection_failed",
    }),
  );
  process.exitCode = 1;
} finally {
  await db.end();
}
