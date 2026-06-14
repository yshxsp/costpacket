-- ============================================================================
-- CostPacket — manual payout ledger test
-- ============================================================================
-- Proves mark_payout_paid / cancel_payout (20260604000000):
--   • only an ADMIN/owner of the SAME company may confirm a payout;
--   • a subcontractor cannot; another company's admin cannot (cross-tenant);
--   • a confirmed payout records paid_by / paid_at / reference;
--   • re-confirming is idempotent (no second write, no double-pay).
--
--   npm run test:payout        (needs SUPABASE_DB_URL = session-pooler URL)
-- ============================================================================

do $$
declare
  adminA uuid := '0a000000-0000-4000-8000-0000000000f1';
  sub    uuid := '05000000-0000-4000-8000-0000000000f2';
  adminB uuid := '0b000000-0000-4000-8000-0000000000f3';
  ca uuid; cb uuid; c_sub uuid; pa uuid; ta uuid; pmt uuid;
  st text; pay_by uuid; paid1 timestamptz; paid2 timestamptz; ref text;
begin
  -- ---- seed (owner) ---------------------------------------------------------
  insert into auth.users (id, email, raw_user_meta_data, aud, role) values
    (adminA, 'po-admin-a@costpacket.test', '{"name":"PO Admin A"}'::jsonb, 'authenticated', 'authenticated'),
    (sub,    'po-sub@costpacket.test',     '{"name":"PO Sub"}'::jsonb,     'authenticated', 'authenticated'),
    (adminB, 'po-admin-b@costpacket.test', '{"name":"PO Admin B"}'::jsonb, 'authenticated', 'authenticated');
  select company_id into ca from public.users where id = adminA;
  select company_id into cb from public.users where id = adminB;

  -- subcontractor joins company A
  select company_id into c_sub from public.users where id = sub;
  update public.users set company_id = ca, role = 'SUBCONTRACTOR' where id = sub;
  delete from public.companies where id = c_sub;

  insert into public.projects (company_id, name, owner_id) values (ca, 'A project', adminA) returning id into pa;
  insert into public.tasks (company_id, project_id, assignee_id, title, amount, status)
    values (ca, pa, sub, 'A task', 100, 'COMPLETED') returning id into ta;
  insert into public.payments (company_id, amount, user_id, task_id, status)
    values (ca, 100, sub, ta, 'PENDING') returning id into pmt;

  set local role authenticated;

  -- ---- a subcontractor cannot confirm --------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', sub::text, 'role', 'authenticated')::text, true);
  begin
    perform public.mark_payout_paid(pmt, 'ref', 'note');
    assert false, 'a subcontractor must not confirm a payout';
  exception when insufficient_privilege then null; end;

  -- ---- another company's admin cannot confirm (cross-tenant) ---------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', adminB::text, 'role', 'authenticated')::text, true);
  begin
    perform public.mark_payout_paid(pmt, 'ref', 'note');
    assert false, 'a foreign admin must not confirm another company''s payout';
  exception when insufficient_privilege then null; end;

  -- ---- the company admin confirms ------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', adminA::text, 'role', 'authenticated')::text, true);
  st := public.mark_payout_paid(pmt, 'wire-123', 'paid via bank transfer');
  assert st = 'MARKED_PAID', 'admin confirm must return MARKED_PAID';

  reset role;
  select status, paid_by, paid_at, reference into st, pay_by, paid1, ref
    from public.payments where id = pmt;
  assert st = 'MARKED_PAID', 'payment must be MARKED_PAID';
  assert pay_by = adminA, 'paid_by must record the confirming admin';
  assert paid1 is not null, 'paid_at must be stamped';
  assert ref = 'wire-123', 'reference must be stored';

  -- ---- idempotent re-confirm (no second write) -----------------------------
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', adminA::text, 'role', 'authenticated')::text, true);
  st := public.mark_payout_paid(pmt, 'wire-999', 'second attempt');
  assert st = 'MARKED_PAID', 're-confirm returns the settled status';

  reset role;
  select paid_at, reference into paid2, ref from public.payments where id = pmt;
  assert paid2 = paid1, 're-confirm must not overwrite paid_at';
  assert ref = 'wire-123', 're-confirm must not overwrite the original reference';

  raise notice 'COSTPACKET PAYOUT TEST PASSED';
end $$;
