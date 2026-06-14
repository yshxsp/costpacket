-- ============================================================================
-- CostPacket — base schema (multi-tenant, secure-by-design)
-- ============================================================================
-- ⚠️  REVIEW + TEST ON A SUPABASE BRANCH BEFORE PROD. Reconstructed from the
--     app's query patterns, not a live dump. Verify column types/defaults.
--
--     Apply order (by filename timestamp):
--       1. 20260529000000_initial_schema.sql   ← this file (tables + triggers)
--       2. 20260529100000_storage_receipts.sql  ← private receipts bucket
--       3. 20260530000000_enable_rls.sql        ← RLS policies + GRANTs
--
-- TENANCY MODEL (the fix for the cross-tenant leaks):
--   Every business row carries a `company_id`. A public signup creates a NEW
--   company and makes the signer its ADMIN/owner (role is NOT taken from client
--   input — see handle_new_user). Additional members join an existing company
--   through a server-side invite flow (TODO — app work). All access is scoped
--   to `current_company()` in the RLS migration, so a user in company A can
--   never see or touch company B's data, regardless of their role.
--
-- REQUIRED APP CHANGES to ship with these migrations (see end of file):
--   • drop the client-controlled role <select> from public signup
--   • upload receipts under `<company_id>/...` and display via signed URLs
-- ============================================================================

create extension if not exists pgcrypto;

-- ---- companies (tenant root) ----------------------------------------------
create table if not exists public.companies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  owner_id   uuid not null,          -- references users(id); FK added after users exists
  created_at timestamptz not null default now()
);

-- ---- users -----------------------------------------------------------------
-- Mirrors auth.users 1:1 (id is the auth uid). role + company_id are set
-- server-side only (the trigger below / invite flow), never from the client —
-- the RLS migration grants UPDATE on the `name` column ONLY.
create table if not exists public.users (
  id                uuid primary key references auth.users (id) on delete cascade,
  email             text,
  name              text,
  role              text not null default 'SUBCONTRACTOR'
                      check (role in ('CONTRACTOR', 'SUBCONTRACTOR', 'ADMIN')),
  company_id        uuid references public.companies (id) on delete cascade,
  stripe_account_id text,
  created_at        timestamptz not null default now()
);
create index if not exists users_company_id_idx on public.users (company_id);

-- companies.owner_id → users.id (added now that users exists)
do $$ begin
  alter table public.companies
    add constraint companies_owner_id_fkey
    foreign key (owner_id) references public.users (id) on delete cascade;
exception when duplicate_object then null; end $$;

-- Resolve the caller's company. SECURITY DEFINER so RLS on users doesn't
-- recurse when policies call this.
create or replace function public.current_company()
  returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.users where id = auth.uid()
$$;

-- New auth user → user row + their own company. role is FORCED to ADMIN here:
-- a public signup is always a new company owner. Invited members are created by
-- the (server-side) invite flow with the correct role, never via this trigger.
-- Idempotent: a re-fired trigger won't create a second company.
create or replace function public.handle_new_user()
  returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_company_id uuid;
  display_name   text := coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1));
begin
  insert into public.users (id, email, name, role)
  values (new.id, new.email, display_name, 'ADMIN')
  on conflict (id) do nothing;

  -- Already linked to a company (re-fired trigger / invited user) → stop.
  if exists (select 1 from public.users where id = new.id and company_id is not null) then
    return new;
  end if;

  insert into public.companies (name, owner_id)
  values (coalesce(nullif(new.raw_user_meta_data ->> 'company_name', ''), display_name) || '''s workspace', new.id)
  returning id into new_company_id;

  update public.users set company_id = new_company_id where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Stamp company_id from the caller on insert, so the app never has to send it
-- and can never forge it. NULL company_id then fails the NOT NULL check below
-- (fail-closed).
create or replace function public.set_company_id()
  returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.company_id is null then
    new.company_id := public.current_company();
  end if;
  return new;
end;
$$;

-- ---- projects --------------------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  name        text not null,
  description text,
  budget      numeric(12, 2),
  status      text not null default 'ACTIVE',
  owner_id    uuid not null references public.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index if not exists projects_company_id_idx on public.projects (company_id);
create index if not exists projects_owner_id_idx on public.projects (owner_id);
drop trigger if exists set_company_id_projects on public.projects;
create trigger set_company_id_projects before insert on public.projects
  for each row execute function public.set_company_id();

-- ---- project_members -------------------------------------------------------
create table if not exists public.project_members (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  role       text,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);
create index if not exists project_members_company_id_idx on public.project_members (company_id);
create index if not exists project_members_user_id_idx on public.project_members (user_id);
drop trigger if exists set_company_id_project_members on public.project_members;
create trigger set_company_id_project_members before insert on public.project_members
  for each row execute function public.set_company_id();

-- ---- tasks -----------------------------------------------------------------
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  project_id  uuid not null references public.projects (id) on delete cascade,
  assignee_id uuid references public.users (id) on delete set null,
  title       text not null,
  description text,
  amount      numeric(12, 2),
  status      text not null default 'PENDING',
  created_at  timestamptz not null default now()
);
create index if not exists tasks_company_id_idx on public.tasks (company_id);
create index if not exists tasks_project_id_idx on public.tasks (project_id);
create index if not exists tasks_assignee_id_idx on public.tasks (assignee_id);
drop trigger if exists set_company_id_tasks on public.tasks;
create trigger set_company_id_tasks before insert on public.tasks
  for each row execute function public.set_company_id();

-- ---- expenses --------------------------------------------------------------
create table if not exists public.expenses (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies (id) on delete cascade,
  description     text not null,
  vendor          text,
  amount          numeric(12, 2) not null,
  task_id         uuid references public.tasks (id) on delete set null,
  receipt_path    text,                 -- storage object path (NOT a public URL)
  submitted_by_id uuid not null references public.users (id) on delete cascade,
  status          text not null default 'PENDING'
                    check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  created_at      timestamptz not null default now()
);
create index if not exists expenses_company_id_idx on public.expenses (company_id);
create index if not exists expenses_submitted_by_id_idx on public.expenses (submitted_by_id);
create index if not exists expenses_task_id_idx on public.expenses (task_id);
create index if not exists expenses_status_idx on public.expenses (status);
drop trigger if exists set_company_id_expenses on public.expenses;
create trigger set_company_id_expenses before insert on public.expenses
  for each row execute function public.set_company_id();

-- ---- payments --------------------------------------------------------------
-- Immutable from the client (no update/delete grant or policy). One payout per
-- task: the partial-unique index blocks the double-payout race the audit found.
create table if not exists public.payments (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies (id) on delete cascade,
  amount           numeric(12, 2) not null,
  stripe_payout_id text,
  status           text not null default 'PENDING'
                     check (status in ('PENDING', 'PAID', 'FAILED')),
  user_id          uuid not null references public.users (id) on delete cascade,
  task_id          uuid references public.tasks (id) on delete set null,
  created_at       timestamptz not null default now()
);
create index if not exists payments_company_id_idx on public.payments (company_id);
create index if not exists payments_user_id_idx on public.payments (user_id);
create unique index if not exists payments_task_id_unique
  on public.payments (task_id) where task_id is not null;
drop trigger if exists set_company_id_payments on public.payments;
create trigger set_company_id_payments before insert on public.payments
  for each row execute function public.set_company_id();

-- ============================================================================
-- REQUIRED APP CHANGES (ship together — applying RLS without these breaks the app):
--   1. src/app/(auth)/actions.ts + signup page: remove the role <select>. Role
--      is server-assigned (ADMIN on signup; invite flow sets others). Optionally
--      pass options.data.company_name.
--   2. src/app/actions/parse-receipt.ts: upload to `${company_id}/${uid}-${ts}.ext`
--      and store the PATH in expenses.receipt_path. Replace getPublicUrl() with a
--      server-side createSignedUrl(path, 60*60) when displaying.
--   3. Anywhere that read expenses.receipt_url → use receipt_path + signed URL.
--   4. (recommended) move approve/reject + payout inserts into server actions
--      using the service role; RLS still enforces, this is defense-in-depth.
-- An invite flow (companies gain >1 member) is a follow-up feature.
-- ============================================================================
