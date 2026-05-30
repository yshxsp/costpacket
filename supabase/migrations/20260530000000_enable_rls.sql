-- ============================================================================
-- CostPacket — Row Level Security
-- ============================================================================
-- ⚠️  REVIEW BEFORE APPLYING. These policies were reconstructed from the app's
--     query patterns (src/app/**, src/app/actions/**), NOT from the live schema.
--     Verify table/column names match your database, then test on a Supabase
--     branch or staging project before applying to production.
--
--     Apply:  supabase db push     (or paste into the Supabase SQL editor)
--
-- Model (from the code):
--   public.users(id = auth.uid(), role in 'CONTRACTOR'|'SUBCONTRACTOR'|'ADMIN')
--   projects(owner_id) · project_members(project_id,user_id) · tasks(project_id,
--   assignee_id) · expenses(submitted_by_id, status) · payments(user_id, task_id)
--
-- Why this matters: creates (expense/project/task) happen via the *client* anon
-- key, so RLS is the ONLY thing stopping a user from writing as someone else,
-- into another user's project, or inserting an already-APPROVED expense.
-- ============================================================================

-- ---- helpers ---------------------------------------------------------------
create or replace function public.current_app_role()
  returns text language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.is_staff()
  returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('CONTRACTOR', 'ADMIN'), false)
$$;

-- ---- users -----------------------------------------------------------------
alter table public.users enable row level security;

create policy users_select on public.users
  for select using (id = auth.uid() or public.is_staff());

-- only your own row; role/email should change server-side, not from the client
create policy users_update_self on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---- projects --------------------------------------------------------------
alter table public.projects enable row level security;

create policy projects_select on public.projects
  for select using (
    owner_id = auth.uid()
    or public.current_app_role() = 'ADMIN'
    or exists (select 1 from public.project_members m
               where m.project_id = id and m.user_id = auth.uid())
  );

create policy projects_insert on public.projects
  for insert with check (owner_id = auth.uid() and public.is_staff());

create policy projects_update on public.projects
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy projects_delete on public.projects
  for delete using (owner_id = auth.uid());

-- ---- project_members -------------------------------------------------------
alter table public.project_members enable row level security;

create policy members_select on public.project_members
  for select using (
    user_id = auth.uid()
    or public.current_app_role() = 'ADMIN'
    or exists (select 1 from public.projects p
               where p.id = project_id and p.owner_id = auth.uid())
  );

-- only the project owner manages membership
create policy members_write on public.project_members
  for all using (
    exists (select 1 from public.projects p
            where p.id = project_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p
            where p.id = project_id and p.owner_id = auth.uid())
  );

-- ---- tasks -----------------------------------------------------------------
alter table public.tasks enable row level security;

-- staff see all (dashboard counts); assignee + project owner see their tasks
create policy tasks_select on public.tasks
  for select using (
    public.is_staff()
    or assignee_id = auth.uid()
    or exists (select 1 from public.projects p
               where p.id = project_id and p.owner_id = auth.uid())
  );

-- only the owning project's owner may create tasks (blocks tasks in others' projects)
create policy tasks_insert on public.tasks
  for insert with check (
    exists (select 1 from public.projects p
            where p.id = project_id and p.owner_id = auth.uid())
  );

-- project owner or the assignee may update (status)
create policy tasks_update on public.tasks
  for update using (
    assignee_id = auth.uid()
    or exists (select 1 from public.projects p
               where p.id = project_id and p.owner_id = auth.uid())
  ) with check (
    assignee_id = auth.uid()
    or exists (select 1 from public.projects p
               where p.id = project_id and p.owner_id = auth.uid())
  );

create policy tasks_delete on public.tasks
  for delete using (
    exists (select 1 from public.projects p
            where p.id = project_id and p.owner_id = auth.uid())
  );

-- ---- expenses --------------------------------------------------------------
alter table public.expenses enable row level security;

-- submitter sees own; staff see all (approval inbox)
create policy expenses_select on public.expenses
  for select using (submitted_by_id = auth.uid() or public.is_staff());

-- you may submit only as yourself, and only as PENDING (no self-APPROVED)
create policy expenses_insert on public.expenses
  for insert with check (submitted_by_id = auth.uid() and status = 'PENDING');

-- approve/reject is staff-only (a submitter cannot approve their own expense)
create policy expenses_update_staff on public.expenses
  for update using (public.is_staff()) with check (public.is_staff());

create policy expenses_delete on public.expenses
  for delete using (submitted_by_id = auth.uid() or public.is_staff());

-- ---- payments --------------------------------------------------------------
alter table public.payments enable row level security;

-- recipient sees own; staff see all
create policy payments_select on public.payments
  for select using (user_id = auth.uid() or public.is_staff());

-- only staff who own the task's project may record a payout
create policy payments_insert on public.payments
  for insert with check (
    public.is_staff()
    and exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = task_id and p.owner_id = auth.uid()
    )
  );

-- payments are immutable from the client: no update/delete policy => denied.
-- (status transitions, if needed, should run with the service role server-side.)
