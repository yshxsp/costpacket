import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";
import type { Db } from "../src/lib/db/client";
import { Workspace, ensureProfile, type Identity } from "../src/lib/workspace";
import { applyBillingEvent, tenantProof } from "../src/lib/paddle/persistence";
import { putReceipt, getReceipt, deleteReceipt } from "../src/lib/storage";
const pg = await PGlite.create();
await pg.exec(
  await readFile(
    new URL("../migrations/0001_neon.sql", import.meta.url),
    "utf8",
  ),
);
const db = drizzle(pg, { schema }) as unknown as Db;
let passed = 0;
async function check(name: string, fn: () => Promise<void>) {
  await fn();
  passed++;
  console.log("✓ " + name);
}
async function user(name: string, verified = true) {
  const identity: Identity = {
    id: crypto.randomUUID(),
    email: name + "@example.invalid",
    name,
    emailVerified: verified,
  };
  await db.insert(schema.user).values(identity);
  return new Workspace(db, identity, await ensureProfile(db, identity));
}
try {
  const a = await user("owner-a");
  const b = await user("owner-b");
  const sub = await user("member");
  const contractor = await user("contractor");
  for (const [ws, role] of [
    [sub, "SUBCONTRACTOR"],
    [contractor, "CONTRACTOR"],
  ] as const) {
    await db
      .update(schema.profiles)
      .set({ company_id: a.companyId, role })
      .where(eq(schema.profiles.id, ws.user.id));
    ws.profile = { ...ws.profile, company_id: a.companyId, role };
  }
  const p = await a.createProject({
    name: "Kitchen",
    description: null,
    budget: 1000,
  });
  const bp = await b.createProject({
    name: "Other company",
    description: null,
    budget: 10,
  });
  const task = await a.createTask({
    project_id: p.id,
    title: "Cabinets",
    description: null,
    amount: 100,
    status: "COMPLETED",
    assignee_id: sub.user.id,
  });
  const expense = await sub.createExpense({
    description: "Lumber",
    vendor: "Yard",
    amount: 20,
    task_id: task.id,
    receipt_path: null,
  });
  await check("tenant reads do not expose another company", async () => {
    assert.equal(await b.getProject(p.id), null);
    assert.equal(await b.getTask(task.id), null);
    assert.equal((await b.listExpenses()).length, 0);
    assert.equal(
      (await a.listProjects()).some((x) => x.id === bp.id),
      false,
    );
  });
  await check("subcontractor cannot create projects or tasks", async () => {
    await assert.rejects(() => sub.createProject({ name: "Bad", budget: 0 }));
    await assert.rejects(() =>
      sub.createTask({
        project_id: p.id,
        title: "Bad",
        description: null,
        amount: 0,
        status: "PENDING",
        assignee_id: null,
      }),
    );
  });
  await check(
    "browser cannot inject owner, company, or role fields",
    async () => {
      await assert.rejects(() =>
        a.createProject({ name: "Bad", budget: 0, company_id: b.companyId }),
      );
      await assert.rejects(() =>
        sub.createExpense({
          description: "Bad",
          vendor: null,
          amount: 2,
          task_id: null,
          receipt_path: null,
          status: "APPROVED",
        }),
      );
    },
  );
  await check(
    "assignees and tasks must belong to the same tenant",
    async () => {
      await assert.rejects(() =>
        a.createTask({
          project_id: p.id,
          title: "Bad",
          description: null,
          amount: 0,
          status: "PENDING",
          assignee_id: b.user.id,
        }),
      );
      await assert.rejects(() =>
        b.createExpense({
          description: "Bad",
          vendor: null,
          amount: 2,
          task_id: task.id,
          receipt_path: null,
        }),
      );
      await assert.rejects(() =>
        db.insert(schema.tasks).values({
          company_id: b.companyId,
          project_id: p.id,
          title: "Bypass",
        }),
      );
    },
  );
  await check(
    "positive, finite money with two decimals is enforced",
    async () => {
      for (const amount of [-1, Infinity, NaN, 1.001])
        await assert.rejects(() =>
          a.createExpense({
            description: "Bad",
            vendor: null,
            amount,
            task_id: null,
            receipt_path: null,
          }),
        );
    },
  );
  await check("expense approval is company scoped and staff only", async () => {
    await assert.rejects(() => b.reviewExpense(expense.id, "APPROVED"));
    await assert.rejects(() => sub.reviewExpense(expense.id, "APPROVED"));
    await a.reviewExpense(expense.id, "APPROVED");
    await assert.rejects(() => a.reviewExpense(expense.id, "REJECTED"));
  });
  await check(
    "payout creation is unique under concurrent submissions",
    async () => {
      const result = await Promise.allSettled([
        a.createPayment(task.id),
        a.createPayment(task.id),
      ]);
      assert.equal(result.filter((x) => x.status === "fulfilled").length, 1);
    },
  );
  const [payment] = await a.listPayments();
  await check(
    "payout settlement is authorized, idempotent, and explicit",
    async () => {
      await assert.rejects(() =>
        b.transitionPayment(payment.id, "MARKED_PAID"),
      );
      await assert.rejects(() =>
        contractor.transitionPayment(payment.id, "MARKED_PAID"),
      );
      assert.equal(
        await a.transitionPayment(payment.id, "MARKED_PAID", "wire-1"),
        "MARKED_PAID",
      );
      assert.equal(
        await a.transitionPayment(payment.id, "MARKED_PAID", "wire-2"),
        "MARKED_PAID",
      );
      await assert.rejects(() => a.transitionPayment(payment.id, "CANCELED"));
      assert.equal((await a.listPayments())[0].reference, "wire-1");
    },
  );
  const path = `${a.companyId}/${a.user.id}/${crypto.randomUUID()}.png`;
  await db.insert(schema.receipts).values({
    path,
    company_id: a.companyId,
    user_id: a.user.id,
    mime: "image/png",
    size: 8,
  });
  await check(
    "receipts cannot be claimed or read across ownership boundaries",
    async () => {
      assert.equal(await b.receipt(path), null);
      assert.equal(await sub.receipt(path), null);
      await assert.rejects(() =>
        sub.createExpense({
          description: "Stolen",
          vendor: null,
          amount: 1,
          task_id: null,
          receipt_path: path,
        }),
      );
      assert.ok(await a.receipt(path));
    },
  );
  await check(
    "private R2 object adapter preserves bytes and blocks traversal",
    async () => {
      const objects = new Map<string, ArrayBuffer>();
      const env = {
        RECEIPTS: {
          put: async (k: string, v: ArrayBuffer) => {
            objects.set(k, v);
          },
          get: async (k: string) =>
            objects.has(k)
              ? { body: new Blob([objects.get(k)!]).stream() }
              : null,
          delete: async (k: string) => {
            objects.delete(k);
          },
        },
      };
      await putReceipt(
        env,
        path,
        new Uint8Array([1, 2, 3]).buffer,
        "image/png",
      );
      assert.deepEqual(
        [
          ...new Uint8Array(
            await new Response(
              (await getReceipt(env, path))!.body,
            ).arrayBuffer(),
          ),
        ],
        [1, 2, 3],
      );
      await assert.rejects(() =>
        putReceipt(env, "../../outside", new ArrayBuffer(1), "image/png"),
      );
      await deleteReceipt(env, path);
      assert.equal(await getReceipt(env, path), null);
    },
  );
  const invited = await user("invited");
  const unverified = await user("unverified", false);
  const invitation = await a.createInvite(invited.user.email, "SUBCONTRACTOR");
  await check(
    "invitation tokens are hashed, email bound and privilege checked",
    async () => {
      const [row] = await db
        .select()
        .from(schema.invites)
        .where(eq(schema.invites.id, invitation.id));
      assert.notEqual(row.token_hash, invitation.token);
      await assert.rejects(() =>
        contractor.createInvite("admin@example.invalid", "ADMIN"),
      );
      await assert.rejects(() => b.acceptInvite(invitation.token));
      const u = await a.createInvite(unverified.user.email, "SUBCONTRACTOR");
      await assert.rejects(() => unverified.acceptInvite(u.token));
    },
  );
  await check("invites are accepted once by a verified recipient", async () => {
    assert.equal(await invited.acceptInvite(invitation.token), a.companyId);
    await assert.rejects(() => invited.acceptInvite(invitation.token));
    const [member] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.id, invited.user.id));
    assert.equal(member.role, "SUBCONTRACTOR");
    assert.equal(member.company_id, a.companyId);
  });
  await check("revoked and expired invites cannot be redeemed", async () => {
    const r = await a.createInvite(b.user.email, "SUBCONTRACTOR");
    await a.revokeInvite(r.id);
    await assert.rejects(() => b.acceptInvite(r.token));
    const exp = await a.createInvite(b.user.email, "SUBCONTRACTOR");
    await db
      .update(schema.invites)
      .set({ expires_at: "2000-01-01T00:00:00Z" })
      .where(eq(schema.invites.id, exp.id));
    await assert.rejects(() => b.acceptInvite(exp.token));
  });
  const secret = "test-secret-with-at-least-thirty-two-characters";
  const proof = await tenantProof(secret, a.companyId);
  const event = {
    event_id: "evt-1",
    event_type: "subscription.activated",
    occurred_at: "2026-10-23T10:00:00Z",
    data: {
      id: "sub-1",
      customer_id: "ctm-1",
      status: "active",
      custom_data: { company_id: a.companyId, company_proof: proof },
      items: [{ price: { id: "price-1" } }],
      current_billing_period: { ends_at: "2026-11-23T10:00:00Z" },
    },
  };
  await check(
    "billing applies once and ignores out-of-order notifications",
    async () => {
      assert.equal(
        await applyBillingEvent(db, event, secret, "price-1"),
        "applied",
      );
      assert.equal(
        await applyBillingEvent(db, event, secret, "price-1"),
        "duplicate",
      );
      await applyBillingEvent(
        db,
        {
          ...event,
          event_id: "evt-old",
          event_type: "subscription.canceled",
          occurred_at: "2026-10-22T10:00:00Z",
          data: { ...event.data, status: "canceled" },
        },
        secret,
        "price-1",
      );
      assert.equal((await a.subscription())!.status, "active");
    },
  );
  await check("forged company attribution does not grant access", async () => {
    await assert.rejects(() =>
      applyBillingEvent(
        db,
        {
          ...event,
          event_id: "evt-forged",
          data: {
            ...event.data,
            custom_data: { company_id: b.companyId, company_proof: proof },
          },
        },
        secret,
        "price-1",
      ),
    );
    assert.equal(await b.subscription(), null);
  });
  await check(
    "failed subscription application rolls back event deduplication",
    async () => {
      const missing = crypto.randomUUID();
      const invalid = {
        ...event,
        event_id: "evt-rollback",
        data: {
          ...event.data,
          id: "sub-missing",
          custom_data: {
            company_id: missing,
            company_proof: await tenantProof(secret, missing),
          },
        },
      };
      await assert.rejects(() =>
        applyBillingEvent(db, invalid, secret, "price-1"),
      );
      assert.equal(
        (
          await db
            .select()
            .from(schema.billingEvents)
            .where(eq(schema.billingEvents.event_id, "evt-rollback"))
        ).length,
        0,
      );
    },
  );
  await check(
    "expired or canceled access blocks new writes but keeps reads",
    async () => {
      await db
        .update(schema.subscriptions)
        .set({ status: "canceled" })
        .where(eq(schema.subscriptions.company_id, a.companyId));
      await assert.rejects(() =>
        a.createProject({ name: "Inactive", budget: 0 }),
      );
      assert.ok(await a.getProject(p.id));
    },
  );
  await check(
    "bounded expense pages have no gaps or duplicate records",
    async () => {
      await db
        .insert(schema.expenses)
        .values(
          Array.from({ length: 501 }, (_, i) => ({
            company_id: a.companyId,
            submitted_by_id: a.user.id,
            description: "page-" + i,
            amount: 1,
          })),
        );
      const first = await a.listExpenses();
      assert.equal(first.length, 500);
      const second = await a.listExpenses(undefined, first[first.length - 1]);
      assert.equal(second.length, 2);
      assert.equal(
        new Set([...first, ...second].map((row) => row.id)).size,
        502,
      );
    },
  );
  console.log(
    `${passed} database/security scenarios passed (real PostgreSQL via PGlite).`,
  );
} finally {
  await pg.close();
}
