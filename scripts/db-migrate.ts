import postgres from "postgres";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
export async function migrate(url: string) {
  const db = postgres(url, {
    max: 1,
    prepare: false,
    ssl: ["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname)
      ? false
      : "require",
  });
  try {
    await db.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(41836921)`;
      await tx`create schema if not exists costpacket`;
      await tx`create table if not exists costpacket._migrations(name text primary key,checksum text not null,applied_at timestamptz not null default now())`;
      for (const name of (
        await readdir(new URL("../migrations/", import.meta.url))
      )
        .filter((n) => n.endsWith(".sql"))
        .sort()) {
        const source = await readFile(
          new URL("../migrations/" + name, import.meta.url),
          "utf8",
        );
        const checksum = createHash("sha256").update(source).digest("hex");
        const [found] =
          await tx`select checksum from costpacket._migrations where name=${name}`;
        if (found) {
          if (found.checksum !== checksum)
            throw new Error("Applied migration changed: " + name);
          continue;
        }
        await tx.unsafe(source);
        await tx`insert into costpacket._migrations(name,checksum) values(${name},${checksum})`;
      }
    });
    console.log("CostPacket migrations applied.");
  } finally {
    await db.end();
  }
}
if (process.argv[1]?.endsWith("db-migrate.ts")) {
  if (!(process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL)) throw new Error("DATABASE_URL is required");
  await migrate((process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL)!);
}
