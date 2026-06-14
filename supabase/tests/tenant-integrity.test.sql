-- ============================================================================
-- CostPacket — tenant-integrity composite-FK test
-- ============================================================================
-- Proves the composite FKs (20260531000000 + 20260602000000) block cross-tenant
-- parenting at the STORAGE layer — independent of RLS. The seed + the offending
-- inserts run as the connection role (table owner, RLS bypassed), so a pass
-- means the foreign keys themselves refuse the rows, not a policy.
--
--   npm run test:tenant         (needs SUPABASE_DB_URL = session-pooler URL)
-- ============================================================================

do $$
declare
  ua uuid := '0a000000-0000-4000-8000-0000000000c1';
  ub uuid := '0b000000-0000-4000-8000-0000000000d2';
  ca uuid; cb uuid; pa uuid; pb uuid; ta uuid; tb uuid;
begin
  -- two tenants via the real signup trigger
  insert into auth.users (id, email, raw_user_meta_data, aud, role) values
    (ua, 'ti-owner-a@costpacket.test', '{"name":"TI A"}'::jsonb, 'authenticated', 'authenticated'),
    (ub, 'ti-owner-b@costpacket.test', '{"name":"TI B"}'::jsonb, 'authenticated', 'authenticated');
  select company_id into ca from public.users where id = ua;
  select company_id into cb from public.users where id = ub;

  insert into public.projects (company_id, name, owner_id) values (ca, 'A project', ua) returning id into pa;
  insert into public.projects (company_id, name, owner_id) values (cb, 'B project', ub) returning id into pb;
  insert into public.tasks (company_id, project_id, title, status) values (cb, pb, 'B task', 'PENDING') returning id into tb;

  -- 1) cross-tenant project parenting: company-A task pointing at B's project
  begin
    insert into public.tasks (company_id, project_id, title, status)
      values (ca, pb, 'cross-tenant task', 'PENDING');
    assert false, 'composite FK must reject a task whose company_id != its project''s';
  exception when foreign_key_violation then null; end;

  -- 2) cross-tenant assignee: company-A task assigned to a company-B user
  begin
    insert into public.tasks (company_id, project_id, assignee_id, title, status)
      values (ca, pa, ub, 'cross-tenant assignee', 'PENDING');
    assert false, 'composite FK must reject an assignee from another company';
  exception when foreign_key_violation then null; end;

  -- 3) cross-tenant expense.task_id: company-A expense linked to B's task
  begin
    insert into public.expenses (company_id, description, amount, task_id, submitted_by_id, status)
      values (ca, 'cross-tenant expense', 10, tb, ua, 'PENDING');
    assert false, 'composite FK must reject an expense linked to another company''s task';
  exception when foreign_key_violation then null; end;

  -- same-tenant parenting still works (project + assignee + task-linked expense)
  insert into public.tasks (company_id, project_id, assignee_id, title, status)
    values (ca, pa, ua, 'ok task', 'PENDING') returning id into ta;
  insert into public.expenses (company_id, description, amount, task_id, submitted_by_id, status)
    values (ca, 'ok expense', 10, ta, ua, 'PENDING');

  raise notice 'COSTPACKET TENANT-INTEGRITY TEST PASSED';
end $$;
