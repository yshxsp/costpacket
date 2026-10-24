import {
  pgSchema,
  text,
  uuid,
  timestamp,
  numeric,
  unique,
  index,
} from "drizzle-orm/pg-core";
export * from "./auth.generated";
export const app = pgSchema("costpacket");
const id = () => uuid("id").primaryKey().defaultRandom();
const created = () =>
  timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull();
const money = (name: string) =>
  numeric(name, { precision: 12, scale: 2, mode: "number" });
export const companies = app.table("companies", {
  id: id(),
  name: text("name").notNull(),
  owner_id: text("owner_id").notNull(),
  created_at: created(),
});
export const profiles = app.table(
  "users",
  {
    id: text("id").primaryKey(),
    company_id: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: text("role", {
      enum: ["ADMIN", "CONTRACTOR", "SUBCONTRACTOR"],
    }).notNull(),
    created_at: created(),
  },
  (t) => [unique().on(t.company_id, t.id), index().on(t.company_id)],
);
export const projects = app.table(
  "projects",
  {
    id: id(),
    company_id: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    owner_id: text("owner_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    budget: money("budget").notNull().default(0),
    status: text("status").notNull().default("ACTIVE"),
    created_at: created(),
  },
  (t) => [unique().on(t.company_id, t.id), index().on(t.company_id)],
);
export const projectMembers = app.table(
  "project_members",
  {
    id: id(),
    company_id: uuid("company_id").notNull(),
    project_id: uuid("project_id").notNull(),
    user_id: text("user_id").notNull(),
    role: text("role"),
    created_at: created(),
  },
  (t) => [unique().on(t.project_id, t.user_id)],
);
export const tasks = app.table(
  "tasks",
  {
    id: id(),
    company_id: uuid("company_id").notNull(),
    project_id: uuid("project_id").notNull(),
    assignee_id: text("assignee_id"),
    title: text("title").notNull(),
    description: text("description"),
    amount: money("amount").notNull().default(0),
    status: text("status").notNull().default("PENDING"),
    created_at: created(),
  },
  (t) => [unique().on(t.company_id, t.id), index().on(t.company_id)],
);
export const receipts = app.table("receipts", {
  path: text("path").primaryKey(),
  company_id: uuid("company_id").notNull(),
  user_id: text("user_id").notNull(),
  mime: text("mime").notNull(),
  size: numeric("size", { mode: "number" }).notNull(),
  created_at: created(),
});
export const expenses = app.table(
  "expenses",
  {
    id: id(),
    company_id: uuid("company_id").notNull(),
    description: text("description").notNull(),
    vendor: text("vendor"),
    amount: money("amount").notNull(),
    task_id: uuid("task_id"),
    receipt_path: text("receipt_path"),
    submitted_by_id: text("submitted_by_id").notNull(),
    status: text("status").notNull().default("PENDING"),
    created_at: created(),
  },
  (t) => [index().on(t.company_id)],
);
export const payments = app.table(
  "payments",
  {
    id: id(),
    company_id: uuid("company_id").notNull(),
    amount: money("amount").notNull(),
    status: text("status").notNull().default("PENDING"),
    user_id: text("user_id").notNull(),
    task_id: uuid("task_id").notNull().unique(),
    reference: text("reference"),
    note: text("note"),
    paid_at: timestamp("paid_at", { mode: "string", withTimezone: true }),
    paid_by: text("paid_by"),
    created_at: created(),
  },
  (t) => [index().on(t.company_id)],
);
export const invites = app.table(
  "invites",
  {
    id: id(),
    company_id: uuid("company_id").notNull(),
    email: text("email").notNull(),
    role: text("role", {
      enum: ["ADMIN", "CONTRACTOR", "SUBCONTRACTOR"],
    }).notNull(),
    token_hash: text("token_hash").notNull().unique(),
    invited_by: text("invited_by").notNull(),
    expires_at: timestamp("expires_at", {
      mode: "string",
      withTimezone: true,
    }).notNull(),
    accepted_at: timestamp("accepted_at", {
      mode: "string",
      withTimezone: true,
    }),
    created_at: created(),
  },
  (t) => [index().on(t.company_id)],
);
export const subscriptions = app.table("subscriptions", {
  company_id: uuid("company_id").primaryKey(),
  status: text("status").notNull(),
  paddle_customer_id: text("paddle_customer_id").notNull(),
  paddle_subscription_id: text("paddle_subscription_id").notNull().unique(),
  price_id: text("price_id"),
  current_period_end: timestamp("current_period_end", {
    mode: "string",
    withTimezone: true,
  }),
  event_at: timestamp("event_at", {
    mode: "string",
    withTimezone: true,
  }).notNull(),
  updated_at: timestamp("updated_at", { mode: "string", withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const billingEvents = app.table("billing_events", {
  event_id: text("event_id").primaryKey(),
  event_type: text("event_type").notNull(),
  created_at: created(),
});
