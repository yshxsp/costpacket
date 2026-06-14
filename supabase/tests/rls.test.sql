-- ============================================================================
-- CostPacket — permanent RLS / column-grant integration test
-- ============================================================================
-- Proves the multi-tenant guarantees of 20260530000000_enable_rls.sql against a
-- REAL Postgres (the Supabase project), not just by reading the SQL:
--
--   • Row isolation   — company A cannot SELECT or UPDATE company B's rows.
--   • Column locking   — authenticated may flip tasks.status / set users.name,
--                        but amount / role / stripe_account_id are denied (42501).
--   • Tenant bootstrap — the real handle_new_user() trigger wires each signup to
--                        its own company as ADMIN owner.
--
-- HOW IT RUNS: the whole block executes inside a transaction the runner ALWAYS
-- rolls back (supabase/tests/run-rls.mjs), so it never leaves data behind. The
-- seed runs as the connection role (table owner → RLS bypassed); the assertions
-- run after `set local role authenticated`, so RLS + column GRANTs are enforced
-- exactly as they are for a real signed-in user. Any failed guarantee raises and
-- aborts → the runner exits non-zero.
--
--   npm run test:rls           (needs SUPABASE_DB_URL = session-pooler URL)
-- ============================================================================

do $$
declare
  ua uuid := '0a000000-0000-4000-8000-0000000000a1'; -- owner A (tenant A)
  ub uuid := '0b000000-0000-4000-8000-0000000000b2'; -- owner B (tenant B)
  ca uuid; cb uuid;          -- company ids
  pa uuid; ta uuid; ea uuid; -- A's project / task / expense
  pb uuid; tb uuid;          -- B's project / task
  n  int;
begin
  -- 1) Bootstrap two tenants through the REAL signup trigger (handle_new_user).
  insert into auth.users (id, email, raw_user_meta_data, aud, role)
  values
    (ua, 'rls-owner-a@costpacket.test', '{"name":"Owner A"}'::jsonb, 'authenticated', 'authenticated'),
    (ub, 'rls-owner-b@costpacket.test', '{"name":"Owner B"}'::jsonb, 'authenticated', 'authenticated');

  select company_id into ca from public.users where id = ua;
  select company_id into cb from public.users where id = ub;
  assert ca is not null and cb is not null and ca <> cb,
    'tenant bootstrap failed: each signup must own a distinct company';
  assert (select role from public.users where id = ua) = 'ADMIN',
    'a public signup must be forced to ADMIN, never client-chosen';

  -- 2) Seed business rows for both tenants (as owner → RLS bypassed for seeding).
  insert into public.projects (company_id, name, owner_id)
    values (ca, 'A project', ua) returning id into pa;
  insert into public.tasks (company_id, project_id, title, amount, status)
    values (ca, pa, 'A task', 100, 'PENDING') returning id into ta;
  insert into public.expenses (company_id, description, amount, submitted_by_id, status)
    values (ca, 'A expense', 50, ua, 'PENDING') returning id into ea;
  insert into public.projects (company_id, name, owner_id)
    values (cb, 'B project', ub) returning id into pb;
  insert into public.tasks (company_id, project_id, title, amount, status)
    values (cb, pb, 'B task', 200, 'PENDING') returning id into tb;

  -- 3) Become a real authenticated user: owner A. From here RLS + column GRANTs
  --    apply exactly as they do for a signed-in client.
  perform set_config('request.jwt.claims',
    json_build_object('sub', ua::text, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- ---- ROW ISOLATION --------------------------------------------------------
  select count(*) into n from public.projects;
  assert n = 1, format('A must see only its own 1 project, saw %s', n);
  select count(*) into n from public.projects where id = pb;
  assert n = 0, 'A must NOT see company B project';
  select count(*) into n from public.tasks where id = tb;
  assert n = 0, 'A must NOT see company B task';

  -- ---- COLUMN LOCK: tasks ----------------------------------------------------
  update public.tasks set status = 'DONE' where id = ta;   -- allowed: status grant + owner
  begin
    update public.tasks set amount = 999 where id = ta;
    assert false, 'tasks.amount must be client-denied (no column grant)';
  exception when insufficient_privilege then null; end;

  -- ---- COLUMN LOCK: users ----------------------------------------------------
  update public.users set name = 'Renamed A' where id = ua; -- allowed: name grant
  begin
    update public.users set role = 'CONTRACTOR' where id = ua;
    assert false, 'users.role must be client-denied (privilege escalation)';
  exception when insufficient_privilege then null; end;
  begin
    update public.users set stripe_account_id = 'acct_attacker' where id = ua;
    assert false, 'users.stripe_account_id must be client-denied (payout hijack)';
  exception when insufficient_privilege then null; end;

  -- ---- COLUMN LOCK: expenses (only status is grantable to clients) -----------
  begin
    update public.expenses set amount = 1 where id = ea;
    assert false, 'expenses.amount must be client-denied (no column grant)';
  exception when insufficient_privilege then null; end;

  -- ---- CROSS-TENANT WRITE blocked by RLS ------------------------------------
  update public.tasks set status = 'DONE' where id = tb;    -- RLS hides B's row
  get diagnostics n = row_count;
  assert n = 0, 'A must NOT be able to update company B task';

  raise notice 'COSTPACKET RLS TEST PASSED';
end $$;
