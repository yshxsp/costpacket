-- ============================================================================
-- CostPacket — paywall (RLS) test
-- ============================================================================
-- Proves company_has_access() gates paid-feature inserts (20260606000000):
--   • active subscription  → can create projects
--   • canceled subscription → cannot (RLS denies)
--   • no subscription, fresh company (trial) → can
--   • no subscription, company older than the trial window → cannot
--
--   npm run test:paywall       (needs SUPABASE_DB_URL = session-pooler URL)
-- ============================================================================

do $$
declare
  aActive   uuid := '01000000-0000-4000-8000-0000000000a1';
  aCanceled uuid := '01000000-0000-4000-8000-0000000000a2';
  aTrial    uuid := '01000000-0000-4000-8000-0000000000a3';
  aExpired  uuid := '01000000-0000-4000-8000-0000000000a4';
  cActive uuid; cCanceled uuid; cTrial uuid; cExpired uuid;
begin
  insert into auth.users (id, email, raw_user_meta_data, aud, role) values
    (aActive,   'pw-active@costpacket.test',   '{"name":"A"}'::jsonb, 'authenticated', 'authenticated'),
    (aCanceled, 'pw-canceled@costpacket.test', '{"name":"C"}'::jsonb, 'authenticated', 'authenticated'),
    (aTrial,    'pw-trial@costpacket.test',    '{"name":"T"}'::jsonb, 'authenticated', 'authenticated'),
    (aExpired,  'pw-expired@costpacket.test',  '{"name":"E"}'::jsonb, 'authenticated', 'authenticated');
  select company_id into cActive   from public.users where id = aActive;
  select company_id into cCanceled from public.users where id = aCanceled;
  select company_id into cTrial    from public.users where id = aTrial;
  select company_id into cExpired  from public.users where id = aExpired;

  insert into public.subscriptions (company_id, status) values (cActive, 'active');
  insert into public.subscriptions (company_id, status) values (cCanceled, 'canceled');
  -- cTrial: no subscription, company is fresh → trial active
  -- cExpired: no subscription, push creation past the 14-day window
  update public.companies set created_at = now() - interval '20 days' where id = cExpired;

  set local role authenticated;

  -- active → allowed
  perform set_config('request.jwt.claims', json_build_object('sub', aActive::text, 'role', 'authenticated')::text, true);
  insert into public.projects (company_id, name, owner_id) values (cActive, 'ok', aActive);

  -- trial (fresh, no sub) → allowed
  perform set_config('request.jwt.claims', json_build_object('sub', aTrial::text, 'role', 'authenticated')::text, true);
  insert into public.projects (company_id, name, owner_id) values (cTrial, 'ok', aTrial);

  -- canceled → denied
  perform set_config('request.jwt.claims', json_build_object('sub', aCanceled::text, 'role', 'authenticated')::text, true);
  begin
    insert into public.projects (company_id, name, owner_id) values (cCanceled, 'blocked', aCanceled);
    assert false, 'a canceled company must not create projects';
  exception when insufficient_privilege then null; end;

  -- trial expired (no sub, old company) → denied
  perform set_config('request.jwt.claims', json_build_object('sub', aExpired::text, 'role', 'authenticated')::text, true);
  begin
    insert into public.projects (company_id, name, owner_id) values (cExpired, 'blocked', aExpired);
    assert false, 'an expired-trial company must not create projects';
  exception when insufficient_privilege then null; end;

  reset role;
  raise notice 'COSTPACKET PAYWALL TEST PASSED';
end $$;
