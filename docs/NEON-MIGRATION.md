# Supabase replacement

Implementation date: 24 October 2026.

The existing Next.js interface is retained. Runtime Supabase clients, browser
PostgREST writes, Supabase Auth, storage URLs and RPC calls have been replaced
with native server operations.

## Data and authorization

- Application and generated Better Auth tables live in `costpacket`.
- An independent `costpacket_runtime` role receives CRUD access only to this
  schema's application/auth tables. The migration ledger is excluded.
- The role was checked for permissions on other application tables: none.
- Server operations obtain identity from Better Auth and current membership from
  the database; company/owner/role fields are never trusted from browser input.
- Composite foreign keys reject cross-company task/member/receipt relationships.
- Onboarding and invitation acceptance are transactional. Tokens are hashed,
  single-use, expiring and bound to a verified email.
- Payout recording is a manual ledger. Pending payouts require an explicit admin
  confirmation; unique task keys prevent duplicate records.
- Billing event deduplication and subscription changes commit together. Company
  attribution is signed server-side. Older events do not overwrite newer state.

The former Supabase instance and its data were not modified or imported. The
new schema was absent before provisioning. Existing Porthatch schemas were not
changed.

## Runtime configuration

`wrangler.jsonc` contains the Hyperdrive resource id and R2 binding. These ids and
names are public configuration. Database passwords, auth secrets, email keys and
API keys belong in private env files or Cloudflare secrets.

Required:

- `HYPERDRIVE` binding, or `DATABASE_URL` for direct development connections.
- `BETTER_AUTH_URL`, using HTTPS outside explicit local development.
- `BETTER_AUTH_SECRET`, generated randomly and at least 32 characters.
- `RECEIPTS` private R2 binding in the Worker.

Transactional email:

- `RESEND_API_KEY` and `EMAIL_FROM` for real verification/reset/invitation emails.
- `DEV_EMAIL_OUTBOX` captures messages only with `COSTPACKET_LOCAL=1`; never set
  these local flags on the public Worker.

Optional extraction:

- `GEMINI_API_KEY`; `GEMINI_MODEL` defaults to `gemini-2.5-flash`.
- The previous project's key failed the model metadata check and was not copied
  to production. No paid generation was performed.
- Receipts can be uploaded and entered manually without an extraction key.

Optional subscriptions:

- `PADDLE_ENV`, `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_PRICE_ID`.
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` and `NEXT_PUBLIC_PADDLE_ENV` at build time.
- No CostPacket price or live catalog was invented. Live charging remains off
  until the appropriate merchant configuration exists.

## Migrations

`migrations/0001_neon.sql` creates the isolated schema, auth/domain tables and
constraints. `0002_receipt_quota_index.sql` indexes receipt quota checks.
`npm run db:migrate` uses `MIGRATION_DATABASE_URL` when supplied, otherwise
`DATABASE_URL`, and records checksums under an advisory transaction lock.
It refuses changed migration files that have already been applied.

`provision-neon.ts` accepts the path to a private env file, creates an isolated
runtime role and writes local runtime credentials under ignored `.data/`.
It does not print credentials. Do not add `.data/` or env files to Git.

## Validation recorded so far

- Unit checks: Paddle signature/event mapping, CSV escaping and formula defense,
  file validation, model-output validation and bounded UTF-8 webhook input.
- PostgreSQL scenarios in PGlite: tenant boundaries, role restrictions,
  cross-company foreign keys, money validation, concurrent payout uniqueness,
  payout transitions, receipt ownership, R2 adapter bytes/path checks,
  invitations, billing rollback/replay/order/proof and bounded export pages.
- Node app against the real Neon role: registration and verified-email flow;
  five concurrent authenticated requests; isolated export for a second company.
- Browser against Neon: create project/task; attach a receipt; enter and approve
  an expense; read the private image; download CSV/PDF; record and confirm a
  manual payout; update profile; mobile viewport check.
- Browser invitation: a second verified user joins as subcontractor and cannot
  open the staff-only members page. Their previous company cannot export the
  first company's expenses before acceptance.

## Deployed runtime

Application: https://costpacket.yshxsp.workers.dev

Cloudflare Worker deployment succeeded with Hyperdrive and private R2 bindings.
The full browser scenario also passed against the deployed Worker: account,
project, task, image upload/read from R2, manual expense, approval, CSV/PDF,
manual payout, profile update and mobile layout.

`keep_names: false` follows the [OpenNext guidance](https://opennext.js.org/cloudflare/howtos/keep_names)
for next-themes inline scripts in the Wrangler bundle.
The miniflare-only undici override applies the maintainer's 7.30.1 security fixes.
`npm audit` reports zero vulnerabilities after installation.

The Worker build succeeds without local env files. An exact-value scan of the
build artifact found none of the local database passwords, authentication secrets
or email keys. Only runtime auth and email secrets are uploaded; the schema-owner
connection is kept local.


## Operational limits

Receipt uploads are bounded by size/type and a transactional per-user hourly
quota. Extraction has a timeout and validates suggested fields before returning
them to a form. Runtime SQL uses bound values. Webhook input is capped while
streaming. CSV escapes formulas in user-controlled text.

The local PGlite TCP prototype was removed after it produced protocol errors
under concurrent Next.js requests. PGlite remains an independent SQL test engine;
integration checks use real Neon/PostgreSQL.

This migration does not establish WCAG conformance or financial correctness of
records entered by users. Live email delivery, OCR generation and actual Paddle
charging are distinct from the local deterministic checks above.

Final cloud checks: five concurrent sessions, HTTPS/HttpOnly cookies, server logout,
anonymous receipt/export denial, another company's receipt returning 404, isolated
CSV and password sign-in all passed. No browser exceptions occurred after the
Wrangler theme fix. Four synthetic accounts, three test workspaces and the test
R2 object were removed. Transactional email secrets are configured; delivery to a
real inbox was not exercised.

Final lint and unit checks passed, including 18 PostgreSQL authorization and
consistency scenarios. The staged source secret scan found no leaks.
