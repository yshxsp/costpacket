-- ============================================================================
-- CostPacket — minimal server-side invite flow
-- ============================================================================
-- Closes the "every signup creates its own company" gap: a second person can
-- now join an EXISTING company with a server-assigned role, instead of only ever
-- being the owner of a fresh tenant.
--
-- Security model (why this is two SECURITY DEFINER functions, not table grants):
--   • create_invite()  — company staff mint a single-use token for an email +
--                        role. Scoped to current_company(); is_staff() gated.
--   • redeem_invite()  — the invited user (matched by email) is moved into the
--                        inviting company with the invited role. role/company_id
--                        are NOT client-writable columns, so this MUST run with
--                        definer rights — exactly the server-side path the RLS
--                        migration reserves for role assignment.
--   The invites table itself grants no direct INSERT/UPDATE/DELETE to clients;
--   every write goes through these functions.
--
--   Apply AFTER 20260531000000_tenant_integrity_fks.sql.
--   UI wiring (an "invite teammate" form + an accept page that calls
--   redeem_invite) is the remaining app-side work; the secure core is here.
-- ============================================================================

create table if not exists public.invites (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  email       text not null,
  role        text not null default 'SUBCONTRACTOR'
                check (role in ('CONTRACTOR', 'SUBCONTRACTOR', 'ADMIN')),
  token       text not null unique default encode(gen_random_bytes(18), 'hex'),
  invited_by  uuid not null references public.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz
);
create index if not exists invites_company_idx on public.invites (company_id);
create index if not exists invites_email_idx on public.invites (lower(email));

-- ---- create_invite: staff mint a token for their own company ----------------
create or replace function public.create_invite(p_email text, p_role text default 'SUBCONTRACTOR')
  returns text language plpgsql security definer set search_path = public as $$
declare
  v_company uuid := public.current_company();
  v_token   text;
begin
  if v_company is null or not public.is_staff() then
    raise exception 'only company staff may invite' using errcode = '42501';
  end if;
  if p_role not in ('CONTRACTOR', 'SUBCONTRACTOR', 'ADMIN') then
    raise exception 'invalid role: %', p_role using errcode = '22023';
  end if;
  insert into public.invites (company_id, email, role, invited_by)
  values (v_company, lower(p_email), p_role, auth.uid())
  returning token into v_token;
  return v_token;
end $$;

-- ---- redeem_invite: the invited user joins the inviting company -------------
create or replace function public.redeem_invite(p_token text)
  returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid         uuid := auth.uid();
  v_email       text;
  v_inv         public.invites;
  v_old_company uuid;
begin
  if v_uid is null then
    raise exception 'must be authenticated' using errcode = '42501';
  end if;
  select email into v_email from public.users where id = v_uid;

  select * into v_inv from public.invites
   where token = p_token and accepted_at is null and expires_at > now()
   for update;
  if not found then
    raise exception 'invite not found, expired, or already used' using errcode = '22023';
  end if;
  if lower(v_inv.email) <> lower(coalesce(v_email, '')) then
    raise exception 'invite was issued to a different email' using errcode = '42501';
  end if;

  select company_id into v_old_company from public.users where id = v_uid;

  update public.users
     set company_id = v_inv.company_id, role = v_inv.role
   where id = v_uid;
  update public.invites set accepted_at = now() where id = v_inv.id;

  -- Remove the throwaway company the signup trigger created, if the redeemer
  -- owned it and it is now empty (no remaining members, no projects).
  if v_old_company is not null and v_old_company <> v_inv.company_id then
    delete from public.companies c
     where c.id = v_old_company
       and c.owner_id = v_uid
       and not exists (select 1 from public.users u where u.company_id = c.id)
       and not exists (select 1 from public.projects p where p.company_id = c.id);
  end if;

  return v_inv.company_id;
end $$;

-- ---- privileges -------------------------------------------------------------
grant execute on function public.create_invite(text, text) to authenticated;
grant execute on function public.redeem_invite(text) to authenticated;

alter table public.invites enable row level security;
revoke all on public.invites from anon, authenticated;
-- staff may LIST their company's invites; all writes go through the functions.
grant select on public.invites to authenticated;
drop policy if exists invites_select on public.invites;
create policy invites_select on public.invites
  for select using (company_id = public.current_company() and public.is_staff());
