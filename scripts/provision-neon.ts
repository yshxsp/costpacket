import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import postgres from "postgres";
import { migrate } from "./db-migrate";
async function main() {
  const source = await readFile(process.argv[2], "utf8");
  const found = source.match(/^DATABASE_URL\s*=\s*(.*)$/m);
  if (!found) throw new Error("Missing database configuration");
  const rootUrl = found[1].trim().replace(/^['"]|['"]$/g, "");
  if (!new URL(rootUrl).hostname.endsWith(".neon.tech"))
    throw new Error("Expected Neon");
  const db = postgres(rootUrl, { ssl: "require", max: 1, prepare: false });
  try {
    await mkdir(".data", { recursive: true });
    let saved: Record<string, string> = {};
    try {
      saved = Object.fromEntries(
        (await readFile(".data/cloud-runtime.env", "utf8"))
          .split("\n")
          .filter((l) => l.includes("="))
          .map((l) => [
            l.slice(0, l.indexOf("=")),
            l.slice(l.indexOf("=") + 1),
          ]),
      );
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
    const role = "costpacket_runtime";
    const roleRows = await db`select 1 from pg_roles where rolname=${role}`;
    if (roleRows.length && !saved.DATABASE_URL)
      throw new Error(
        "Runtime role already exists; refusing to replace credentials",
      );
    const url = new URL(rootUrl);
    if (!saved.DATABASE_URL) {
      url.username = role;
      url.password = randomBytes(32).toString("hex");
      saved = {
        DATABASE_URL: url.href,
        BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
        BETTER_AUTH_URL: "https://costpacket.yshxsp.workers.dev",
      };
    }
    await writeFile(
      ".data/cloud-runtime.env",
      Object.entries(saved)
        .map(([k, v]) => k + "=" + v)
        .join("\n") + "\n",
      { mode: 0o600 },
    );
    await migrate(rootUrl);
    await db.begin(async (tx) => {
      if (!roleRows.length) {
        const password = new URL(saved.DATABASE_URL).password;
        if (!/^[a-f0-9]{64}$/.test(password))
          throw new Error("Unexpected generated credential");
        await tx.unsafe(
          `create role costpacket_runtime login password '${password}'`,
        );
      }
      await tx`grant usage on schema costpacket to costpacket_runtime`;
      const tables =
        await tx`select table_name from information_schema.tables where table_schema='costpacket' and table_type='BASE TABLE' and table_name<>'_migrations'`;
      for (const row of tables)
        await tx`grant select,insert,update,delete on ${tx("costpacket")}.${tx(row.table_name)} to costpacket_runtime`;
    });
    const runtime = postgres(saved.DATABASE_URL, {
      ssl: "require",
      max: 1,
      prepare: false,
    });
    try {
      await runtime`select count(*) from costpacket."user"`;
      const other =
        await db`select count(*)::int as n from information_schema.tables where table_schema not in ('pg_catalog','information_schema','costpacket') and has_table_privilege('costpacket_runtime',quote_ident(table_schema)||'.'||quote_ident(table_name),'SELECT,INSERT,UPDATE,DELETE')`;
      if (other[0].n !== 0)
        throw new Error(
          "Runtime role inherits access to other application tables",
        );
      console.log(
        "Neon schema and isolated runtime role are ready. Runtime role has no access to other application tables.",
      );
    } finally {
      await runtime.end();
    }
  } finally {
    await db.end();
  }
}
try {
  await main();
} catch (e) {
  console.error("Neon setup failed", {
    name: e instanceof Error ? e.name : "unknown",
    code: (e as { code?: string }).code ?? "setup_failed",
    message:
      e instanceof Error
        ? e.message
            .replace(/postgres(?:ql)?:\/\/[^\s]+/g, "[connection]")
            .replace(/[a-f0-9]{64}/g, "[redacted]")
            .slice(0, 180)
        : "",
  });
  process.exitCode = 1;
}
