-- ============================================================================
-- CostPacket — tenant-integrity composite foreign keys (defense-in-depth)
-- ============================================================================
-- RLS already stops the APP path from parenting a row across tenants (the
-- insert policies require the caller to own the referenced project, etc.). This
-- migration adds the same guarantee at the STORAGE layer, so a child row can
-- never reference a parent in another company even via a server/service-role
-- write or a future code path that forgets the check.
--
-- Mechanism: every child FK that points at a company-scoped parent now carries
-- `company_id` in the key and targets a (id, company_id) unique constraint on
-- the parent. Postgres then refuses any row whose company_id disagrees with its
-- parent's.
--
-- Scope note: FKs with ON DELETE SET NULL (tasks.assignee_id, expenses.task_id,
-- payments.task_id) are intentionally left single-column — a composite SET NULL
-- can't null a NOT NULL company_id. Those links are nullable, low-severity, and
-- still company-confined by RLS.
--
--   Apply AFTER 20260530000000_enable_rls.sql.
-- ============================================================================

-- ---- parent unique targets (id is PK, so (id, company_id) is also unique) ---
-- Postgres has no ADD CONSTRAINT IF NOT EXISTS, so guard each add.
do $$ begin
  alter table public.users add constraint users_id_company_key unique (id, company_id);
exception when duplicate_table or duplicate_object then null; end $$;
do $$ begin
  alter table public.projects add constraint projects_id_company_key unique (id, company_id);
exception when duplicate_table or duplicate_object then null; end $$;
do $$ begin
  alter table public.tasks add constraint tasks_id_company_key unique (id, company_id);
exception when duplicate_table or duplicate_object then null; end $$;

-- ---- projects.owner_id → users(id, company_id) -----------------------------
alter table public.projects drop constraint if exists projects_owner_id_fkey;
alter table public.projects add constraint projects_owner_id_fkey
  foreign key (owner_id, company_id) references public.users (id, company_id)
  on delete cascade;

-- ---- project_members.{project_id,user_id} ----------------------------------
alter table public.project_members drop constraint if exists project_members_project_id_fkey;
alter table public.project_members add constraint project_members_project_id_fkey
  foreign key (project_id, company_id) references public.projects (id, company_id)
  on delete cascade;
alter table public.project_members drop constraint if exists project_members_user_id_fkey;
alter table public.project_members add constraint project_members_user_id_fkey
  foreign key (user_id, company_id) references public.users (id, company_id)
  on delete cascade;

-- ---- tasks.project_id → projects(id, company_id) ---------------------------
alter table public.tasks drop constraint if exists tasks_project_id_fkey;
alter table public.tasks add constraint tasks_project_id_fkey
  foreign key (project_id, company_id) references public.projects (id, company_id)
  on delete cascade;

-- ---- expenses.submitted_by_id → users(id, company_id) ----------------------
alter table public.expenses drop constraint if exists expenses_submitted_by_id_fkey;
alter table public.expenses add constraint expenses_submitted_by_id_fkey
  foreign key (submitted_by_id, company_id) references public.users (id, company_id)
  on delete cascade;

-- ---- payments.user_id → users(id, company_id) ------------------------------
alter table public.payments drop constraint if exists payments_user_id_fkey;
alter table public.payments add constraint payments_user_id_fkey
  foreign key (user_id, company_id) references public.users (id, company_id)
  on delete cascade;
