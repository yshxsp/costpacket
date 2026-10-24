import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const base = process.env.BETTER_AUTH_URL;
if (
  process.env.COSTPACKET_LOCAL !== "1" ||
  !base ||
  !["127.0.0.1", "localhost"].includes(new URL(base).hostname) ||
  !process.env.DEV_EMAIL_OUTBOX
)
  throw new Error(
    "Run this smoke check only against the isolated local app and email outbox.",
  );
const email = process.env.SMOKE_EMAIL ?? `member-${Date.now()}@example.invalid`;
const response = await fetch(base + "/api/auth/sign-up/email", {
  method: "POST",
  headers: { "content-type": "application/json", origin: base },
  body: JSON.stringify({
    name: "Browser teammate",
    email,
    password: "Local-Only-Account-2026",
  }),
});
assert.equal(response.status, 200, "Signup succeeds");
const cookie = response.headers
  .getSetCookie()
  .map((s) => s.split(";")[0])
  .join("; ");
assert.ok(cookie, "Signup sets a session");
const authenticated = { headers: { cookie } };
const results = await Promise.all(
  Array.from({ length: 5 }, async () => {
    const started = Date.now();
    const r = await fetch(base + "/api/auth/get-session", authenticated);
    assert.equal(r.status, 200);
    const s = await r.json();
    assert.equal(s.user.email, email);
    return Date.now() - started;
  }),
);
console.log(
  "✓ Five concurrent authenticated requests succeeded; slowest " +
    Math.max(...results) +
    " ms",
);
const messages = (await readFile(process.env.DEV_EMAIL_OUTBOX, "utf8"))
  .trim()
  .split("\n")
  .map((s) => JSON.parse(s));
const message = [...messages]
  .reverse()
  .find((m) => m.to === email && m.subject === "Verify your CostPacket email");
assert.ok(message, "Verification email captured locally");
const url = message.html.match(/href="([^"]+)"/)[1].replaceAll("&amp;", "&");
assert.equal(new URL(url).origin, base);
const verified = await fetch(url, { ...authenticated, redirect: "manual" });
assert.ok(
  [200, 302].includes(verified.status),
  "Verification endpoint succeeds",
);
const session = await (
  await fetch(base + "/api/auth/get-session", authenticated)
).json();
assert.equal(session.user.emailVerified, true);
await fetch(base + "/dashboard", authenticated);
const csv = await fetch(base + "/api/export/expenses", authenticated);
assert.equal(csv.status, 200);
assert.ok(
  !(await csv.text()).includes("Hardware receipt browser check"),
  "New company cannot export another company’s expenses",
);
console.log(
  "✓ Signup, session cookie, email verification and tenant-isolated export succeeded",
);
console.log("Synthetic test account: " + email);
