-- ============================================================================
-- CostPacket — revoke a pending invite
-- ============================================================================
-- Clients have no direct write grant on invites (all writes go through SECURITY
-- DEFINER functions). This adds revoke for the members UI: company staff may
-- delete a pending (not-yet-accepted) invite for their own company.
--
--   Apply AFTER 20260603000000_invite_admin_guard.sql.
-- ============================================================================

create or replace function public.revoke_invite(p_invite_id uuid)
  returns void language plpgsql security definer set search_path = public as $$
declare
  v_company uuid := public.current_company();
  v_inv     public.invites;
begin
  if v_company is null or not public.is_staff() then
    raise exception 'only company staff may revoke invites' using errcode = '42501';
  end if;
  select * into v_inv from public.invites where id = p_invite_id for update;
  if not found then
    raise exception 'invite not found' using errcode = '22023';
  end if;
  if v_inv.company_id <> v_company then
    raise exception 'cannot revoke another company''s invite' using errcode = '42501';
  end if;
  if v_inv.accepted_at is not null then
    raise exception 'invite already accepted' using errcode = '22023';
  end if;
  delete from public.invites where id = p_invite_id;
end $$;

grant execute on function public.revoke_invite(uuid) to authenticated;
