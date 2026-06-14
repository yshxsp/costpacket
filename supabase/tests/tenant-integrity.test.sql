-- ============================================================================
-- CostPacket — tenant-integrity composite-FK test
-- ============================================================================
-- Proves 20260531000000_tenant_integrity_fks.sql blocks cross-tenant parenting
-- at the STORAGE layer — independent of RLS. The seed + the offending insert run
-- as the connection role (table owner, RLS bypassed), so a pass means the
-- foreign key itself refuses the row, not a policy.
--
--   npm run test:tenant         (needs SUPABASE_DB_URL = session-pooler URL)
-- ============================================================================

do $$
declare
  ua uuid := '0a000000-0000-4000-8000-0000000000c1';
  ub uuid := '0b000000-0000-4000-8000-0000000000d2';
  ca uuid; cb uuid; pa uuid; pb uuid;
begin
  -- two tenants via the real signup trigger
  insert into auth.users (id, email, raw_user_meta_data, aud, role) values
    (ua, 'ti-owner-a@costpacket.test', '{"name":"TI A"}'::jsonb, 'authenticated', 'authenticated'),
    (ub, 'ti-owner-b@costpacket.test', '{"name":"TI B"}'::jsonb, 'authenticated', 'authenticated');
  select company_id into ca from public.users where id = ua;
  select company_id into cb from public.users where id = ub;

  insert into public.projects (company_id, name, owner_id) values (cb, 'B project', ub) returning id into pb;

  -- cross-tenant parenting MUST be refused: a company-A task pointing at
  -- company B's project (company_id ca, project_id pb → no (pb, ca) parent).
  begin
    insert into public.tasks (company_id, project_id, title, status)
      values (ca, pb, 'cross-tenant task', 'PENDING');
    assert false, 'composite FK must reject a task whose company_id != its project''s';
  exception when foreign_key_violation then null; end;

  -- same-tenant parenting still works
  insert into public.projects (company_id, name, owner_id) values (ca, 'A project', ua) returning id into pa;
  insert into public.tasks (company_id, project_id, title, status) values (ca, pa, 'ok task', 'PENDING');

  raise notice 'COSTPACKET TENANT-INTEGRITY TEST PASSED';
end $$;
