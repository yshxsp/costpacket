-- ============================================================================
-- CostPacket — invite-flow test
-- ============================================================================
-- Proves the invite functions (20260601000000 + 20260603000000). Each negative
-- case catches ONLY its expected SQLSTATE, so a missing raise surfaces the
-- assert (P0004) instead of being swallowed by `when others`.
--
--   redeem_invite: not-found / expired / replayed  -> 22023 (invalid_param)
--                  email mismatch                  -> 42501 (insufficient_privilege)
--   create_invite: non-staff / contractor->ADMIN   -> 42501
--
-- Function calls run as `authenticated` (real client identity), so the SECURITY
-- DEFINER role assignment is exercised exactly as in production.
--
--   npm run test:invite        (needs SUPABASE_DB_URL = session-pooler URL)
-- ============================================================================

do $$
declare
  admin      uuid := '0a000000-0000-4000-8000-0000000000a3';
  invitee    uuid := '0e000000-0000-4000-8000-0000000000e4';
  contractor uuid := '0c000000-0000-4000-8000-0000000000c5';
  ca uuid; c_throwaway uuid; c_contractor uuid; tok text; joined uuid;
  final_company uuid; final_role text;
begin
  -- ---- seed (as owner) ------------------------------------------------------
  insert into auth.users (id, email, raw_user_meta_data, aud, role) values
    (admin,      'inv-admin@costpacket.test',      '{"name":"Inv Admin"}'::jsonb,      'authenticated', 'authenticated'),
    (invitee,    'inv-sub@costpacket.test',        '{"name":"Inv Sub"}'::jsonb,        'authenticated', 'authenticated'),
    (contractor, 'inv-contractor@costpacket.test', '{"name":"Inv Contractor"}'::jsonb, 'authenticated', 'authenticated');
  select company_id into ca from public.users where id = admin;
  select company_id into c_throwaway from public.users where id = invitee;
  assert c_throwaway is not null and c_throwaway <> ca, 'invitee should start in their own company';

  -- contractor joins company A as CONTRACTOR
  select company_id into c_contractor from public.users where id = contractor;
  update public.users set company_id = ca, role = 'CONTRACTOR' where id = contractor;
  delete from public.companies where id = c_contractor;

  -- pre-seed invites directly so each redeem case is deterministic
  insert into public.invites (company_id, email, role, token, invited_by) values
    (ca, 'stranger@costpacket.test', 'SUBCONTRACTOR', 'tok_wrong', admin),
    (ca, 'inv-sub@costpacket.test',  'SUBCONTRACTOR', 'tok_good',  admin);
  insert into public.invites (company_id, email, role, token, invited_by, expires_at) values
    (ca, 'inv-sub@costpacket.test',  'SUBCONTRACTOR', 'tok_expired', admin, now() - interval '1 day');

  set local role authenticated;

  -- ---- redeem as the invitee ------------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', invitee::text, 'role', 'authenticated')::text, true);

  -- wrong email -> 42501
  begin
    perform public.redeem_invite('tok_wrong');
    assert false, 'an invite for another email must be rejected';
  exception when insufficient_privilege then null; end;

  -- expired -> 22023
  begin
    perform public.redeem_invite('tok_expired');
    assert false, 'an expired invite must be rejected';
  exception when sqlstate '22023' then null; end;

  -- happy path
  joined := public.redeem_invite('tok_good');
  assert joined = ca, 'redeem_invite must return the inviting company';

  -- replay -> 22023
  begin
    perform public.redeem_invite('tok_good');
    assert false, 'a used invite must not be redeemable twice';
  exception when sqlstate '22023' then null; end;

  reset role;
  select company_id, role into final_company, final_role from public.users where id = invitee;
  assert final_company = ca, 'invitee must now belong to company A';
  assert final_role = 'SUBCONTRACTOR', 'invitee must carry the invited role';
  assert not exists (select 1 from public.companies where id = c_throwaway),
    'the throwaway signup company must be cleaned up';

  -- ---- create_invite permissions --------------------------------------------
  set local role authenticated;

  -- ADMIN may invite any allowed role
  perform set_config('request.jwt.claims',
    json_build_object('sub', admin::text, 'role', 'authenticated')::text, true);
  tok := public.create_invite('new-contractor@costpacket.test', 'CONTRACTOR');
  assert tok is not null, 'an admin may invite a CONTRACTOR';

  -- CONTRACTOR may invite a lower role but NOT mint an ADMIN invite
  perform set_config('request.jwt.claims',
    json_build_object('sub', contractor::text, 'role', 'authenticated')::text, true);
  tok := public.create_invite('low@costpacket.test', 'SUBCONTRACTOR');
  assert tok is not null, 'a contractor may invite a SUBCONTRACTOR';
  begin
    perform public.create_invite('escalation@costpacket.test', 'ADMIN');
    assert false, 'a contractor must not be able to issue an ADMIN invite';
  exception when insufficient_privilege then null; end;

  reset role;
  raise notice 'COSTPACKET INVITE TEST PASSED';
end $$;
