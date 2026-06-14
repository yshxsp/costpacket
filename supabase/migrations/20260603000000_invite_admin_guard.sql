-- ============================================================================
-- CostPacket — restrict who can mint ADMIN invites
-- ============================================================================
-- is_staff() is true for both CONTRACTOR and ADMIN, so the first create_invite()
-- let a CONTRACTOR invite someone as ADMIN — a privilege-escalation path. Tighten
-- it: ADMIN-role invites may only be issued by an ADMIN or the company owner.
-- Lower-privilege invites (CONTRACTOR / SUBCONTRACTOR) stay open to any staff.
--
--   Apply AFTER 20260601000000_invites.sql.
-- ============================================================================

create or replace function public.create_invite(p_email text, p_role text default 'SUBCONTRACTOR')
  returns text language plpgsql security definer set search_path = public as $$
declare
  v_company uuid := public.current_company();
  v_role    text := public.current_app_role();
  v_token   text;
begin
  if v_company is null or not public.is_staff() then
    raise exception 'only company staff may invite' using errcode = '42501';
  end if;
  if p_role not in ('CONTRACTOR', 'SUBCONTRACTOR', 'ADMIN') then
    raise exception 'invalid role: %', p_role using errcode = '22023';
  end if;
  -- Only an ADMIN (or the company owner, who is ADMIN by signup) may mint ADMIN
  -- invites; a CONTRACTOR must not be able to escalate anyone to ADMIN.
  if p_role = 'ADMIN'
     and v_role <> 'ADMIN'
     and not exists (
       select 1 from public.companies c where c.id = v_company and c.owner_id = auth.uid()
     ) then
    raise exception 'only an admin or the company owner may issue ADMIN invites'
      using errcode = '42501';
  end if;
  insert into public.invites (company_id, email, role, invited_by)
  values (v_company, lower(p_email), p_role, auth.uid())
  returning token into v_token;
  return v_token;
end $$;
