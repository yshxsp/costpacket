import { and, eq, ne, desc, sql, getTableColumns } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "./db/client";
import {
  companies,
  profiles,
  projects,
  projectMembers,
  tasks,
  expenses,
  payments,
  invites,
  subscriptions,
  receipts,
} from "./db/schema";
export type Identity = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
};
export type Profile = typeof profiles.$inferSelect;
export class WorkspaceError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const roleSchema = z.enum(["ADMIN", "CONTRACTOR", "SUBCONTRACTOR"]);
const amount = z
  .number()
  .finite()
  .min(0)
  .max(9999999999.99)
  .refine(
    (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001,
    "Use at most two decimal places",
  );
const uuid = z.uuid();
const text = z.string().trim().min(1).max(200);
const optionalText = z.string().trim().max(4000).nullable().optional();
export const projectInput = z
  .object({
    name: text,
    description: optionalText,
    budget: amount,
    status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED"]).default("ACTIVE"),
  })
  .strict();
export const taskInput = z
  .object({
    project_id: uuid,
    title: text,
    description: optionalText,
    amount,
    status: z.enum(["PENDING", "IN_PROGRESS", "REVIEW", "COMPLETED"]),
    assignee_id: z.string().min(1).max(128).nullable(),
  })
  .strict();
export const expenseInput = z
  .object({
    description: text,
    vendor: z.string().trim().max(200).nullable(),
    amount: amount.positive(),
    task_id: uuid.nullable(),
    receipt_path: z.string().max(400).nullable(),
  })
  .strict();
export async function tokenHash(value: string) {
  return Buffer.from(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  ).toString("hex");
}
export function freshToken() {
  return [...crypto.getRandomValues(new Uint8Array(32))]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
export async function ensureProfile(db: Db, user: Identity) {
  return db.transaction(async (tx) => {
    // Serialize first-login onboarding, including concurrent callbacks.
    await tx.execute(
      sql`select id from costpacket."user" where id=${user.id} for update`,
    );
    const [found] = await tx
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id));
    if (found) return found;
    const [company] = await tx
      .insert(companies)
      .values({ name: `${user.name || "My"} workspace`, owner_id: user.id })
      .returning();
    const [profile] = await tx
      .insert(profiles)
      .values({
        id: user.id,
        company_id: company.id,
        email: user.email.toLowerCase(),
        name: user.name,
        role: "ADMIN",
      })
      .returning();
    return profile;
  });
}
export class Workspace {
  constructor(
    public db: Db,
    public user: Identity,
    public profile: Profile,
  ) {}
  get companyId() {
    return this.profile.company_id;
  }
  get staff() {
    return this.profile.role !== "SUBCONTRACTOR";
  }
  private requireStaff() {
    if (!this.staff)
      throw new WorkspaceError("Only company staff can do this.", 403);
  }
  private requireAdmin() {
    if (this.profile.role !== "ADMIN")
      throw new WorkspaceError("Only an admin can do this.", 403);
  }
  private projectScope() {
    return and(
      eq(projects.company_id, this.companyId),
      this.staff
        ? undefined
        : sql`(${projects.id} in (select project_id from costpacket.project_members where user_id=${this.user.id} and company_id=${this.companyId}) or ${projects.id} in (select project_id from costpacket.tasks where assignee_id=${this.user.id} and company_id=${this.companyId}))`,
    );
  }
  async listProjects() {
    return this.db
      .select()
      .from(projects)
      .where(this.projectScope())
      .orderBy(desc(projects.created_at))
      .limit(500);
  }
  async getProject(id: string) {
    if (!uuid.safeParse(id).success) return null;
    return (
      (
        await this.db
          .select()
          .from(projects)
          .where(and(this.projectScope(), eq(projects.id, id)))
          .limit(1)
      )[0] ?? null
    );
  }
  async listTasks(projectId?: string) {
    return this.db
      .select({
        ...getTableColumns(tasks),
        projects: getTableColumns(projects),
        users: getTableColumns(profiles),
      })
      .from(tasks)
      .leftJoin(
        projects,
        and(
          eq(projects.id, tasks.project_id),
          eq(projects.company_id, tasks.company_id),
        ),
      )
      .leftJoin(
        profiles,
        and(
          eq(profiles.id, tasks.assignee_id),
          eq(profiles.company_id, tasks.company_id),
        ),
      )
      .where(
        and(
          eq(tasks.company_id, this.companyId),
          this.staff ? undefined : eq(tasks.assignee_id, this.user.id),
          projectId ? eq(tasks.project_id, uuid.parse(projectId)) : undefined,
        ),
      )
      .orderBy(desc(tasks.created_at))
      .limit(500);
  }
  async getTask(id: string) {
    if (!uuid.safeParse(id).success) return null;
    return (
      (
        await this.db
          .select({
            ...getTableColumns(tasks),
            projects: getTableColumns(projects),
            users: getTableColumns(profiles),
          })
          .from(tasks)
          .leftJoin(
            projects,
            and(
              eq(projects.id, tasks.project_id),
              eq(projects.company_id, tasks.company_id),
            ),
          )
          .leftJoin(
            profiles,
            and(
              eq(profiles.id, tasks.assignee_id),
              eq(profiles.company_id, tasks.company_id),
            ),
          )
          .where(
            and(
              eq(tasks.company_id, this.companyId),
              eq(tasks.id, id),
              this.staff ? undefined : eq(tasks.assignee_id, this.user.id),
            ),
          )
          .limit(1)
      )[0] ?? null
    );
  }
  async listExpenses(
    taskId?: string,
    after?: { created_at: string; id: string },
  ) {
    return this.db
      .select({
        ...getTableColumns(expenses),
        tasks: {
          id: tasks.id,
          title: tasks.title,
          project_id: tasks.project_id,
        },
        users: { id: profiles.id, name: profiles.name, email: profiles.email },
      })
      .from(expenses)
      .leftJoin(
        tasks,
        and(
          eq(tasks.id, expenses.task_id),
          eq(tasks.company_id, expenses.company_id),
        ),
      )
      .leftJoin(
        profiles,
        and(
          eq(profiles.id, expenses.submitted_by_id),
          eq(profiles.company_id, expenses.company_id),
        ),
      )
      .where(
        and(
          eq(expenses.company_id, this.companyId),
          after
            ? sql`(${expenses.created_at}, ${expenses.id}) < (${after.created_at}::timestamptz, ${after.id}::uuid)`
            : undefined,
          this.staff ? undefined : eq(expenses.submitted_by_id, this.user.id),
          taskId ? eq(expenses.task_id, uuid.parse(taskId)) : undefined,
        ),
      )
      .orderBy(desc(expenses.created_at), desc(expenses.id))
      .limit(500);
  }
  async listPayments(after?: { created_at: string; id: string }) {
    return this.db
      .select({
        ...getTableColumns(payments),
        tasks: { id: tasks.id, title: tasks.title },
        users: { id: profiles.id, name: profiles.name, email: profiles.email },
      })
      .from(payments)
      .leftJoin(
        tasks,
        and(
          eq(tasks.id, payments.task_id),
          eq(tasks.company_id, payments.company_id),
        ),
      )
      .leftJoin(
        profiles,
        and(
          eq(profiles.id, payments.user_id),
          eq(profiles.company_id, payments.company_id),
        ),
      )
      .where(
        and(
          eq(payments.company_id, this.companyId),
          after
            ? sql`(${payments.created_at}, ${payments.id}) < (${after.created_at}::timestamptz, ${after.id}::uuid)`
            : undefined,
          this.staff ? undefined : eq(payments.user_id, this.user.id),
        ),
      )
      .orderBy(desc(payments.created_at), desc(payments.id))
      .limit(500);
  }
  async members() {
    return this.db
      .select()
      .from(profiles)
      .where(
        and(
          eq(profiles.company_id, this.companyId),
          this.staff ? undefined : eq(profiles.id, this.user.id),
        ),
      )
      .orderBy(profiles.name)
      .limit(500);
  }
  async pendingInvites() {
    this.requireStaff();
    return this.db
      .select({
        id: invites.id,
        email: invites.email,
        role: invites.role,
        created_at: invites.created_at,
        expires_at: invites.expires_at,
      })
      .from(invites)
      .where(
        and(
          eq(invites.company_id, this.companyId),
          sql`${invites.accepted_at} is null`,
        ),
      )
      .orderBy(desc(invites.created_at))
      .limit(500);
  }
  async projectTeam(id: string) {
    if (!(await this.getProject(id))) return [];
    return this.db
      .select({
        user_id: projectMembers.user_id,
        role: projectMembers.role,
        users: getTableColumns(profiles),
      })
      .from(projectMembers)
      .innerJoin(
        profiles,
        and(
          eq(profiles.id, projectMembers.user_id),
          eq(profiles.company_id, projectMembers.company_id),
        ),
      )
      .where(
        and(
          eq(projectMembers.company_id, this.companyId),
          eq(projectMembers.project_id, id),
        ),
      )
      .limit(500);
  }
  async summary() {
    const [p] = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(projects)
      .where(and(this.projectScope(), eq(projects.status, "ACTIVE")));
    const [t] = await this.db
      .select({
        total: sql<number>`count(*)::int`,
        done: sql<number>`count(*) filter (where status='COMPLETED')::int`,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.company_id, this.companyId),
          this.staff ? undefined : eq(tasks.assignee_id, this.user.id),
        ),
      );
    const [e] = await this.db
      .select({ pending: sql<number>`count(*)::int` })
      .from(expenses)
      .where(
        and(
          eq(expenses.company_id, this.companyId),
          eq(expenses.status, "PENDING"),
          this.staff ? undefined : eq(expenses.submitted_by_id, this.user.id),
        ),
      );
    const [pay] = await this.db
      .select({ amount: sql<number>`coalesce(sum(amount),0)::float8` })
      .from(payments)
      .where(
        and(
          eq(payments.company_id, this.companyId),
          eq(payments.status, "MARKED_PAID"),
          this.staff ? undefined : eq(payments.user_id, this.user.id),
        ),
      );
    return {
      projectsCount: p.total,
      tasksTotal: t.total,
      tasksDone: t.done,
      expensesPending: e.pending,
      paymentsTotal: pay.amount,
    };
  }
  async subscription() {
    return (
      (
        await this.db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.company_id, this.companyId))
      )[0] ?? null
    );
  }
  async access() {
    const sub = await this.subscription();
    if (sub)
      return {
        companyId: this.companyId,
        active: ["active", "trialing"].includes(sub.status),
        status: sub.status,
        isTrial: sub.status === "trialing",
        trialEndsAt: null,
        currentPeriodEnd: sub.current_period_end,
      };
    const [company] = await this.db
      .select()
      .from(companies)
      .where(eq(companies.id, this.companyId));
    const ends = new Date(
      new Date(company.created_at).getTime() + 14 * 86400000,
    ).toISOString();
    return {
      companyId: this.companyId,
      active: Date.parse(ends) > Date.now(),
      status: Date.parse(ends) > Date.now() ? "trial" : "none",
      isTrial: Date.parse(ends) > Date.now(),
      trialEndsAt: ends,
      currentPeriodEnd: null,
    };
  }
  async requireAccess() {
    if (!(await this.access()).active)
      throw new WorkspaceError(
        "Your plan is inactive. Renew in Billing to create new work.",
        403,
      );
  }
  async createProject(raw: unknown) {
    this.requireStaff();
    await this.requireAccess();
    const data = projectInput.parse(raw);
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(projects)
        .values({ ...data, company_id: this.companyId, owner_id: this.user.id })
        .returning();
      await tx.insert(projectMembers).values({
        company_id: this.companyId,
        project_id: row.id,
        user_id: this.user.id,
        role: this.profile.role,
      });
      return row;
    });
  }
  async createTask(raw: unknown) {
    this.requireStaff();
    await this.requireAccess();
    const data = taskInput.parse(raw);
    const p = await this.getProject(data.project_id);
    if (!p || (p.owner_id !== this.user.id && this.profile.role !== "ADMIN"))
      throw new WorkspaceError("Project not found or not editable.", 403);
    if (data.assignee_id) {
      const [member] = await this.db
        .select()
        .from(profiles)
        .where(
          and(
            eq(profiles.id, data.assignee_id),
            eq(profiles.company_id, this.companyId),
          ),
        );
      if (!member) throw new WorkspaceError("Assignee is not in this company.");
    }
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(tasks)
        .values({ ...data, company_id: this.companyId })
        .returning();
      if (data.assignee_id)
        await tx
          .insert(projectMembers)
          .values({
            company_id: this.companyId,
            project_id: data.project_id,
            user_id: data.assignee_id,
            role: "SUBCONTRACTOR",
          })
          .onConflictDoNothing();
      return row;
    });
  }
  async createExpense(raw: unknown) {
    await this.requireAccess();
    const data = expenseInput.parse(raw);
    if (data.task_id && !(await this.getTask(data.task_id)))
      throw new WorkspaceError("Task not found.", 403);
    if (data.receipt_path) {
      const [r] = await this.db
        .select()
        .from(receipts)
        .where(
          and(
            eq(receipts.path, data.receipt_path),
            eq(receipts.company_id, this.companyId),
            eq(receipts.user_id, this.user.id),
          ),
        );
      if (!r) throw new WorkspaceError("Receipt not found.", 403);
    }
    return (
      await this.db
        .insert(expenses)
        .values({
          ...data,
          company_id: this.companyId,
          submitted_by_id: this.user.id,
        })
        .returning()
    )[0];
  }
  async reviewExpense(id: string, status: "APPROVED" | "REJECTED") {
    this.requireStaff();
    z.enum(["APPROVED", "REJECTED"]).parse(status);
    const [row] = await this.db
      .update(expenses)
      .set({ status })
      .where(
        and(
          eq(expenses.id, uuid.parse(id)),
          eq(expenses.company_id, this.companyId),
          eq(expenses.status, "PENDING"),
        ),
      )
      .returning();
    if (!row)
      throw new WorkspaceError("Expense not found or already reviewed.");
    return row;
  }
  async updateProject(id: string, status: string) {
    this.requireStaff();
    z.enum(["ACTIVE", "ON_HOLD", "COMPLETED"]).parse(status);
    const p = await this.getProject(id);
    if (!p || (p.owner_id !== this.user.id && this.profile.role !== "ADMIN"))
      throw new WorkspaceError("Project not found.", 403);
    await this.db
      .update(projects)
      .set({ status })
      .where(and(eq(projects.id, id), eq(projects.company_id, this.companyId)));
  }
  async deleteProject(id: string) {
    this.requireStaff();
    const p = await this.getProject(id);
    if (!p || (p.owner_id !== this.user.id && this.profile.role !== "ADMIN"))
      throw new WorkspaceError("Project not found.", 403);
    await this.db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.company_id, this.companyId)));
  }
  async updateTask(id: string, status: string) {
    z.enum(["PENDING", "IN_PROGRESS", "REVIEW", "COMPLETED"]).parse(status);
    const t = await this.getTask(id);
    if (
      !t ||
      !(
        t.assignee_id === this.user.id ||
        t.projects?.owner_id === this.user.id ||
        this.profile.role === "ADMIN"
      )
    )
      throw new WorkspaceError("Task not found or not editable.", 403);
    await this.db
      .update(tasks)
      .set({ status })
      .where(and(eq(tasks.id, id), eq(tasks.company_id, this.companyId)));
  }
  async createPayment(id: string) {
    this.requireStaff();
    await this.requireAccess();
    const t = await this.getTask(id);
    if (
      !t ||
      !(t.projects?.owner_id === this.user.id || this.profile.role === "ADMIN")
    )
      throw new WorkspaceError("Task not found.", 403);
    if (t.status !== "COMPLETED" || !t.assignee_id || t.amount <= 0)
      throw new WorkspaceError(
        "Complete a task with an assignee and a positive amount first.",
      );
    const [row] = await this.db
      .insert(payments)
      .values({
        company_id: this.companyId,
        task_id: t.id,
        user_id: t.assignee_id,
        amount: t.amount,
      })
      .onConflictDoNothing({ target: payments.task_id })
      .returning();
    if (!row)
      throw new WorkspaceError("A payout already exists for this task.");
    return row;
  }
  async transitionPayment(
    id: string,
    status: "MARKED_PAID" | "CANCELED",
    reference?: string,
    note?: string,
  ) {
    this.requireAdmin();
    return this.db.transaction(async (tx) => {
      const [p] = await tx
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.id, uuid.parse(id)),
            eq(payments.company_id, this.companyId),
          ),
        )
        .for("update");
      if (!p) throw new WorkspaceError("Payout not found.", 404);
      if (p.status === status) return p.status;
      if (p.status !== "PENDING")
        throw new WorkspaceError("Only pending payouts can be changed.");
      await tx
        .update(payments)
        .set({
          status,
          reference: z.string().max(200).optional().parse(reference),
          note: z.string().max(2000).optional().parse(note),
          ...(status === "MARKED_PAID"
            ? { paid_at: new Date().toISOString(), paid_by: this.user.id }
            : {}),
        })
        .where(
          and(eq(payments.id, id), eq(payments.company_id, this.companyId)),
        );
      return status;
    });
  }
  async createInvite(email: string, role: unknown) {
    this.requireStaff();
    const parsed = roleSchema.parse(role);
    if (parsed === "ADMIN") this.requireAdmin();
    const token = freshToken();
    const [row] = await this.db
      .insert(invites)
      .values({
        company_id: this.companyId,
        email: z.email().max(254).parse(email.trim().toLowerCase()),
        role: parsed,
        token_hash: await tokenHash(token),
        invited_by: this.user.id,
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      })
      .returning();
    return { id: row.id, token };
  }
  async revokeInvite(id: string) {
    this.requireStaff();
    const [row] = await this.db
      .delete(invites)
      .where(
        and(
          eq(invites.id, uuid.parse(id)),
          eq(invites.company_id, this.companyId),
          sql`${invites.accepted_at} is null`,
          this.profile.role === "ADMIN" ? undefined : ne(invites.role, "ADMIN"),
        ),
      )
      .returning();
    if (!row) throw new WorkspaceError("Invite not found.", 404);
  }
  async resendInvite(id: string) {
    this.requireStaff();
    const token = freshToken();
    const [row] = await this.db
      .update(invites)
      .set({
        token_hash: await tokenHash(token),
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      })
      .where(
        and(
          eq(invites.id, uuid.parse(id)),
          eq(invites.company_id, this.companyId),
          sql`${invites.accepted_at} is null`,
          this.profile.role === "ADMIN" ? undefined : ne(invites.role, "ADMIN"),
        ),
      )
      .returning();
    if (!row) throw new WorkspaceError("Invite not found.", 404);
    return { ...row, token };
  }
  async acceptInvite(token: string) {
    if (!this.user.emailVerified)
      throw new WorkspaceError(
        "Verify your email before accepting an invitation.",
        403,
      );
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new WorkspaceError("Invalid invitation.");
    const hash = await tokenHash(token);
    return this.db.transaction(async (tx) => {
      const [inv] = await tx
        .select()
        .from(invites)
        .where(eq(invites.token_hash, hash))
        .for("update");
      if (!inv || inv.accepted_at || Date.parse(inv.expires_at) <= Date.now())
        throw new WorkspaceError("Invitation expired or already used.");
      if (inv.email.toLowerCase() !== this.user.email.toLowerCase())
        throw new WorkspaceError(
          "This invitation belongs to another email.",
          403,
        );
      const [current] = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.id, this.user.id))
        .for("update");
      if (current.company_id !== inv.company_id) {
        const [old] = await tx
          .select()
          .from(companies)
          .where(eq(companies.id, current.company_id))
          .for("update");
        if (old.owner_id === this.user.id) {
          const other = await tx
            .select({ id: profiles.id })
            .from(profiles)
            .where(
              and(
                eq(profiles.company_id, current.company_id),
                ne(profiles.id, this.user.id),
              ),
            )
            .limit(1);
          const data = await tx.execute(
            sql`select 1 from costpacket.projects where company_id=${current.company_id} union all select 1 from costpacket.expenses where company_id=${current.company_id} union all select 1 from costpacket.receipts where company_id=${current.company_id} union all select 1 from costpacket.subscriptions where company_id=${current.company_id} union all select 1 from costpacket.invites where company_id=${current.company_id} limit 1`,
          );
          if (other.length || data.length)
            throw new WorkspaceError(
              "Your existing workspace contains data or members. Use a separate account for this invitation.",
            );
        }
        await tx
          .update(profiles)
          .set({ company_id: inv.company_id, role: inv.role })
          .where(eq(profiles.id, this.user.id));
        if (old.owner_id === this.user.id)
          await tx.delete(companies).where(eq(companies.id, old.id));
      } else {
        throw new WorkspaceError("You already belong to this company.");
      }
      await tx
        .update(invites)
        .set({ accepted_at: new Date().toISOString() })
        .where(eq(invites.id, inv.id));
      return inv.company_id;
    });
  }
  async receipt(path: string) {
    return (
      (
        await this.db
          .select()
          .from(receipts)
          .where(
            and(
              eq(receipts.path, path),
              eq(receipts.company_id, this.companyId),
              this.staff ? undefined : eq(receipts.user_id, this.user.id),
            ),
          )
      )[0] ?? null
    );
  }
}
export function safeError(e: unknown) {
  if (e instanceof WorkspaceError) return e.message;
  if (e instanceof z.ZodError) return e.issues[0]?.message ?? "Invalid input";
  console.error("Workspace operation failed", {
    name: e instanceof Error ? e.name : "unknown",
  });
  return "The operation could not be completed. Please try again.";
}
