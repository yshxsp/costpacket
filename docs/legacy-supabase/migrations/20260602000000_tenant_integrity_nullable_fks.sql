-- ============================================================================
-- CostPacket — tenant-integrity for the nullable / SET NULL foreign keys
-- ============================================================================
-- The first integrity pass (20260531000000) left tasks.assignee_id,
-- expenses.task_id and payments.task_id as plain single-column FKs because a
-- composite ON DELETE SET NULL can't null a NOT NULL company_id. That gap let a
-- company-A row reference a company-B user/task if the UUID was known.
--
-- Postgres 15+ allows SET NULL to target a COLUMN LIST, so we can carry
-- company_id in the key (closing the cross-tenant hole) while nulling ONLY the
-- reference column on parent delete. Supabase runs PG15+.
--
--   Apply AFTER 20260531000000_tenant_integrity_fks.sql (it creates the
--   users(id, company_id) and tasks(id, company_id) unique targets).
-- ============================================================================

-- ---- tasks.assignee_id → users(id, company_id) -----------------------------
alter table public.tasks drop constraint if exists tasks_assignee_id_fkey;
alter table public.tasks add constraint tasks_assignee_id_fkey
  foreign key (assignee_id, company_id) references public.users (id, company_id)
  on delete set null (assignee_id);

-- ---- expenses.task_id → tasks(id, company_id) ------------------------------
alter table public.expenses drop constraint if exists expenses_task_id_fkey;
alter table public.expenses add constraint expenses_task_id_fkey
  foreign key (task_id, company_id) references public.tasks (id, company_id)
  on delete set null (task_id);

-- ---- payments.task_id → tasks(id, company_id) ------------------------------
alter table public.payments drop constraint if exists payments_task_id_fkey;
alter table public.payments add constraint payments_task_id_fkey
  foreign key (task_id, company_id) references public.tasks (id, company_id)
  on delete set null (task_id);
