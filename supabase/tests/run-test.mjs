// Generic SQL integration-test runner.
//
// Executes a *.sql test file (a single PL/pgSQL `do $$ … $$` block that raises
// on any violated guarantee) against a real Postgres, ALWAYS inside a
// transaction it rolls back — so it never leaves data behind.
//
//   SUPABASE_DB_URL="postgresql://postgres.<ref>:<pwd>@<host>:5432/postgres" \
//     node supabase/tests/run-test.mjs <file.sql>
//
// Use the SESSION pooler (port 5432) — `set local role` needs a session, which
// the transaction pooler (6543) does not give.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import postgres from 'postgres';

const file = process.argv[2] ?? 'rls.test.sql';
const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error('SUPABASE_DB_URL is not set — point it at the session-pooler URL.');
  process.exit(2);
}

const here = dirname(fileURLToPath(import.meta.url));
const testSql = readFileSync(join(here, file), 'utf8');

const ROLLBACK = Symbol('rollback');
const sql = postgres(url, { ssl: 'require', max: 1, onnotice: (n) => console.log(`· ${n.message}`) });

try {
  await sql.begin(async (tx) => {
    await tx.unsafe(testSql);
    throw ROLLBACK; // never persist the seeded tenants
  });
} catch (err) {
  if (err === ROLLBACK) {
    console.log(`✓ ${file} passed (rolled back)`);
    await sql.end();
    process.exit(0);
  }
  console.error(`✗ ${file} FAILED:\n`, err?.message ?? err);
  await sql.end();
  process.exit(1);
}
