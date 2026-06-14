-- ============================================================================
-- CostPacket — server-side paywall in RLS (beta)
-- ============================================================================
-- Paid features (creating projects, tasks, expenses) require an active company
-- subscription or an unexpired free trial. Enforced in the INSERT policies so it
-- holds for the client-side Supabase inserts the app uses — a lapsed company
-- cannot create new work even if the UI is bypassed.
--
-- Access = active/trialing subscription, OR (no subscription yet AND within the
-- 14-day trial window from company creation). A subscription that exists but is
-- past_due/paused/canceled = no access.
--
--   Apply AFTER 20260605000000_billing.sql.
-- ============================================================================

create or replace function public.company_has_access()
  returns boolean language sql stable security definer set search_path = public as $$
  select case
    when exists (
      select 1 from public.subscriptions s
      where s.company_id = public.current_company() and s.status in ('active', 'trialing')
    ) then true
    when exists (
      select 1 from public.subscriptions s where s.company_id = public.current_company()
    ) then false  -- has a subscription but it's past_due/paused/canceled
    else exists (
      select 1 from public.companies c
      where c.id = public.current_company()
        and c.created_at > now() - interval '14 days'
    )
  end
$$;
grant execute on function public.company_has_access() to authenticated;

-- ---- gate the paid-feature INSERT policies ---------------------------------
drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects
  for insert with check (
    company_id = public.current_company()
    and owner_id = auth.uid()
    and public.is_staff()
    and public.company_has_access()
  );

drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks
  for insert with check (
    company_id = public.current_company()
    and exists (select 1 from public.projects p
                where p.id = project_id and p.owner_id = auth.uid())
    and public.company_has_access()
  );

drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert on public.expenses
  for insert with check (
    company_id = public.current_company()
    and submitted_by_id = auth.uid()
    and status = 'PENDING'
    and public.company_has_access()
  );
