-- ============================================================================
-- CostPacket — billing schema test
-- ============================================================================
-- Proves 20260605000000_billing.sql:
--   • billing_events.event_id is the idempotency key (a replayed event is a
--     no-op via ON CONFLICT DO NOTHING);
--   • subscriptions upsert by company_id (one row per company, status updates);
--   • a member reads only their own company's subscription (RLS);
--   • has_active_subscription() reflects status;
--   • clients cannot read billing_events at all.
--
--   npm run test:billing       (needs SUPABASE_DB_URL = session-pooler URL)
-- ============================================================================

do $$
declare
  adminA uuid := '0a000000-0000-4000-8000-0000000000b1';
  adminB uuid := '0b000000-0000-4000-8000-0000000000b2';
  ca uuid; cb uuid; n int; active boolean;
begin
  insert into auth.users (id, email, raw_user_meta_data, aud, role) values
    (adminA, 'bill-a@costpacket.test', '{"name":"Bill A"}'::jsonb, 'authenticated', 'authenticated'),
    (adminB, 'bill-b@costpacket.test', '{"name":"Bill B"}'::jsonb, 'authenticated', 'authenticated');
  select company_id into ca from public.users where id = adminA;
  select company_id into cb from public.users where id = adminB;

  -- ---- idempotency: a replayed event_id inserts once -----------------------
  insert into public.billing_events (event_id, event_type, company_id, payload)
    values ('evt_dup', 'subscription.activated', ca, '{}'::jsonb)
    on conflict (event_id) do nothing;
  insert into public.billing_events (event_id, event_type, company_id, payload)
    values ('evt_dup', 'subscription.activated', ca, '{}'::jsonb)
    on conflict (event_id) do nothing;
  select count(*) into n from public.billing_events where event_id = 'evt_dup';
  assert n = 1, format('a replayed event must insert once, saw %s', n);

  -- ---- subscriptions upsert by company_id ----------------------------------
  insert into public.subscriptions (company_id, status, paddle_subscription_id, price_id)
    values (ca, 'active', 'sub_A', 'pri_x')
    on conflict (company_id) do update
      set status = excluded.status, updated_at = now();
  insert into public.subscriptions (company_id, status, paddle_subscription_id, price_id)
    values (ca, 'past_due', 'sub_A', 'pri_x')
    on conflict (company_id) do update
      set status = excluded.status, updated_at = now();
  select count(*) into n from public.subscriptions where company_id = ca;
  assert n = 1, 'one subscription row per company';
  assert (select status from public.subscriptions where company_id = ca) = 'past_due',
    'upsert must update the status';

  -- company B: canceled
  insert into public.subscriptions (company_id, status) values (cb, 'canceled')
    on conflict (company_id) do update set status = excluded.status;

  -- reset A to active for the access-helper check
  update public.subscriptions set status = 'active' where company_id = ca;

  -- ---- RLS: a member reads only their own company's subscription -----------
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', adminA::text, 'role', 'authenticated')::text, true);

  select count(*) into n from public.subscriptions;
  assert n = 1, format('member A must see only their own subscription, saw %s', n);
  select count(*) into n from public.subscriptions where company_id = cb;
  assert n = 0, 'member A must not see company B subscription';

  active := public.has_active_subscription();
  assert active, 'A (active) must have access';

  -- billing_events is invisible to clients (no grant)
  begin
    perform 1 from public.billing_events limit 1;
    assert false, 'clients must not read billing_events';
  exception when insufficient_privilege then null; end;

  -- company B sees canceled → no access
  perform set_config('request.jwt.claims',
    json_build_object('sub', adminB::text, 'role', 'authenticated')::text, true);
  active := public.has_active_subscription();
  assert not active, 'B (canceled) must not have access';

  reset role;
  raise notice 'COSTPACKET BILLING TEST PASSED';
end $$;
