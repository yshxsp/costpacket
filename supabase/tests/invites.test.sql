-- ============================================================================
-- CostPacket — invite-flow test
-- ============================================================================
-- Proves 20260601000000_invites.sql: a staff member mints an invite, the invited
-- user redeems it and lands in the inviting company with the invited role, the
-- throwaway signup company is cleaned up, and a used invite cannot be replayed.
-- Both function calls run as `authenticated` (real client identity), so the
-- SECURITY DEFINER role assignment is exercised exactly as in production.
--
--   npm run test:invite        (needs SUPABASE_DB_URL = session-pooler URL)
-- ============================================================================

do $$
declare
  admin   uuid := '0a000000-0000-4000-8000-0000000000a3';
  invitee uuid := '0e000000-0000-4000-8000-0000000000e4';
  ca uuid; c_throwaway uuid; tok text; joined uuid;
  final_company uuid; final_role text;
begin
  -- tenant A owner (ADMIN via signup trigger)
  insert into auth.users (id, email, raw_user_meta_data, aud, role)
    values (admin, 'inv-admin@costpacket.test', '{"name":"Inv Admin"}'::jsonb, 'authenticated', 'authenticated');
  select company_id into ca from public.users where id = admin;

  -- invitee signs up first → gets their OWN throwaway company
  insert into auth.users (id, email, raw_user_meta_data, aud, role)
    values (invitee, 'inv-sub@costpacket.test', '{"name":"Inv Sub"}'::jsonb, 'authenticated', 'authenticated');
  select company_id into c_throwaway from public.users where id = invitee;
  assert c_throwaway is not null and c_throwaway <> ca, 'invitee should start in their own company';

  -- ---- admin mints an invite (as authenticated staff of company A) ----------
  perform set_config('request.jwt.claims',
    json_build_object('sub', admin::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  tok := public.create_invite('inv-sub@costpacket.test', 'SUBCONTRACTOR');
  assert tok is not null and length(tok) > 0, 'create_invite must return a token';

  -- wrong-email user cannot redeem (switch identity to invitee but pretend a
  -- mismatch by issuing the invite to someone else would be cleaner; here we
  -- assert the happy path + replay guard).

  -- ---- invitee redeems (as authenticated invitee) ---------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', invitee::text, 'role', 'authenticated')::text, true);
  joined := public.redeem_invite(tok);
  assert joined = ca, 'redeem_invite must return the inviting company';

  -- replay must fail (token already accepted)
  begin
    perform public.redeem_invite(tok);
    assert false, 'a used invite must not be redeemable twice';
  exception when others then null; end;

  -- ---- verify final state (back as owner) -----------------------------------
  reset role;
  select company_id, role into final_company, final_role from public.users where id = invitee;
  assert final_company = ca, 'invitee must now belong to company A';
  assert final_role = 'SUBCONTRACTOR', 'invitee must carry the invited role';
  assert not exists (select 1 from public.companies where id = c_throwaway),
    'the throwaway signup company must be cleaned up';

  raise notice 'COSTPACKET INVITE TEST PASSED';
end $$;
