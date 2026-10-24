import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
await mkdir(".data", { recursive: true });
let existing = "";
try {
  existing = await readFile(".env.local", "utf8");
} catch (e) {
  if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
}
if (existing && /^DATABASE_URL=/m.test(existing)) {
  console.log("Existing database configuration preserved.");
  process.exit(0);
}
if (existing) {
  await copyFile(".env.local", ".data/previous-env.local");
  console.log("Previous local configuration backed up under .data/.");
}
await writeFile(
  ".env.local",
  "COSTPACKET_LOCAL=1\nDATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres\nBETTER_AUTH_URL=http://127.0.0.1:3187\nBETTER_AUTH_SECRET=" +
    randomBytes(32).toString("hex") +
    "\nDEV_EMAIL_OUTBOX=.data/outbox.jsonl\n",
  { mode: 0o600 },
);
console.log(
  "Local configuration created. Set DATABASE_URL to Neon or your PostgreSQL server, then run npm run db:migrate and npm run dev:local.",
);
