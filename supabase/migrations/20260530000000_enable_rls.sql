-- ============================================================================
-- CostPacket — Row Level Security + GRANTs (company-scoped, multi-tenant)
-- ============================================================================
-- ⚠️  REVIEW + TEST ON A BRANCH. Seed TWO companies and verify company A can't
--     read or write company B's rows before trusting this in prod.
--
--     Apply:  supabase db push   (or paste into the SQL editor, after the
--             initial_schema + storage migrations).
--
-- What changed vs the first cut (all flagged by the security audit):
--   • Every policy is scoped to public.current_company() → no cross-tenant leak.
--     `is_staff()` is now "staff WITHIN your company", not a global super-role.
--   • Field tampering is blocked by column-level GRANTs: users update only
--     their own `name`; tasks/expenses expose only `status`; role / email /
--     company_id / stripe_account_id (and expense/task amounts) change
--     server-side (service role) or via trigger — never by a direct client write.
--   • Explicit GRANTs (project was created with "auto-expose new tables" OFF, so
--     nothing is reachable until granted) + anon is revoked from all business
--     tables.
-- ============================================================================

-- ---- role helpers (current_company() lives in the initial_schema migration) -
create or replace function public.current_app_role()
  returns text language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid()
$$;

-- "Staff" = company owner / contractor. Company scoping is enforced separately
-- by `company_id = current_company()` in each policy, so this is only a role gate.
create or replace function public.is_staff()
  returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('CONTRACTOR', 'ADMIN'), false)
$$;

-- ---- lock down table privileges (auto-expose is OFF) -----------------------
revoke all on public.companies, public.users, public.projects,
  public.project_members, public.tasks, public.expenses, public.payments
  from anon, authenticated;

grant usage on schema public to authenticated;
grant select on public.companies, public.users, public.projects,
  public.project_members, public.tasks, public.expenses, public.payments
  to authenticated;
grant insert, delete on public.projects, public.project_members,
  public.tasks, public.expenses to authenticated;
-- Projects: the owner edits their own (name/budget/status) — gated by owner_id
-- in the policy and confined to their own company, so a full-row update is fine.
grant update on public.projects to authenticated;
-- Tasks & expenses: clients may ONLY flip `status` (assignee marks a task done;
-- staff approve/reject an expense). Column grants gate the field, RLS gates the
-- row — together they stop an assignee from raising their task's `amount` or
-- re-parenting it, and staff from rewriting an expense's amount/vendor.
grant update (status) on public.tasks to authenticated;
grant update (status) on public.expenses to authenticated;
grant insert on public.payments to authenticated;        -- no update/delete: immutable
-- Column-level on users: a member may set ONLY their own display name. Payout
-- routing (stripe_account_id) is deliberately NOT client-writable — it must be
-- set server-side from a verified Stripe Connect onboarding return, never typed
-- in by hand (a wrong/forged account id misroutes real money). role / email /
-- company_id likewise stay server-only.
grant update (name) on public.users to authenticated;
grant update (name) on public.companies to authenticated;

-- ---- companies -------------------------------------------------------------
alter table public.companies enable row level security;
drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies
  for select using (id = public.current_company());
drop policy if exists companies_update on public.companies;
create policy companies_update on public.companies
  for update using (id = public.current_company() and owner_id = auth.uid())
            with check (id = public.current_company() and owner_id = auth.uid());

-- ---- users -----------------------------------------------------------------
alter table public.users enable row level security;
drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select using (id = auth.uid() or company_id = public.current_company());
-- own row only; the `name`-only column grant is what actually blocks role/email/
-- company_id tampering (RLS can't restrict columns).
drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---- projects --------------------------------------------------------------
alter table public.projects enable row level security;
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects
  for select using (company_id = public.current_company());
drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects
  for insert with check (
    company_id = public.current_company() and owner_id = auth.uid() and public.is_staff()
  );
drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects
  for update using (company_id = public.current_company() and owner_id = auth.uid())
            with check (company_id = public.current_company() and owner_id = auth.uid());
drop policy if exists projects_delete on public.projects;
create policy projects_delete on public.projects
  for delete using (company_id = public.current_company() and owner_id = auth.uid());

-- ---- project_members -------------------------------------------------------
alter table public.project_members enable row level security;
drop policy if exists members_select on public.project_members;
create policy members_select on public.project_members
  for select using (company_id = public.current_company());
-- only the owning project's owner (in this company) manages membership
drop policy if exists members_write on public.project_members;
create policy members_write on public.project_members
  for all using (
    company_id = public.current_company()
    and exists (select 1 from public.projects p
                where p.id = project_id and p.owner_id = auth.uid())
  ) with check (
    company_id = public.current_company()
    and exists (select 1 from public.projects p
                where p.id = project_id and p.owner_id = auth.uid())
  );

-- ---- tasks -----------------------------------------------------------------
alter table public.tasks enable row level security;
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks
  for select using (
    company_id = public.current_company()
    and (public.is_staff()
         or assignee_id = auth.uid()
         or exists (select 1 from public.projects p
                    where p.id = project_id and p.owner_id = auth.uid()))
  );
drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks
  for insert with check (
    company_id = public.current_company()
    and exists (select 1 from public.projects p
                where p.id = project_id and p.owner_id = auth.uid())
  );
drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks
  for update using (
    company_id = public.current_company()
    and (assignee_id = auth.uid()
         or exists (select 1 from public.projects p
                    where p.id = project_id and p.owner_id = auth.uid()))
  ) with check (
    company_id = public.current_company()
    and (assignee_id = auth.uid()
         or exists (select 1 from public.projects p
                    where p.id = project_id and p.owner_id = auth.uid()))
  );
drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks
  for delete using (
    company_id = public.current_company()
    and exists (select 1 from public.projects p
                where p.id = project_id and p.owner_id = auth.uid())
  );

-- ---- expenses --------------------------------------------------------------
alter table public.expenses enable row level security;
-- submitter sees own; company staff see all (approval inbox) — within company only
drop policy if exists expenses_select on public.expenses;
create policy expenses_select on public.expenses
  for select using (
    company_id = public.current_company()
    and (submitted_by_id = auth.uid() or public.is_staff())
  );
-- submit only as yourself, only PENDING (no self-APPROVED), in your company
drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert on public.expenses
  for insert with check (
    company_id = public.current_company()
    and submitted_by_id = auth.uid()
    and status = 'PENDING'
  );
-- approve/reject is company-staff-only
drop policy if exists expenses_update_staff on public.expenses;
create policy expenses_update_staff on public.expenses
  for update using (company_id = public.current_company() and public.is_staff())
            with check (company_id = public.current_company() and public.is_staff());
drop policy if exists expenses_delete on public.expenses;
create policy expenses_delete on public.expenses
  for delete using (
    company_id = public.current_company()
    and (submitted_by_id = auth.uid() or public.is_staff())
  );

-- ---- payments --------------------------------------------------------------
alter table public.payments enable row level security;
-- recipient sees own; company staff see all
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
  for select using (
    company_id = public.current_company()
    and (user_id = auth.uid() or public.is_staff())
  );
-- only company staff who own the task's project may record a payout
drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments
  for insert with check (
    company_id = public.current_company()
    and public.is_staff()
    and exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = task_id and p.owner_id = auth.uid()
    )
  );
-- payments are immutable from the client: no update/delete grant or policy.
-- Status transitions (PENDING→PAID/FAILED) run with the service role server-side.
