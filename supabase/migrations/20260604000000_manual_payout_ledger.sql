-- ============================================================================
-- CostPacket — manual payout ledger (beta)
-- ============================================================================
-- Automatic Stripe Connect transfers are deferred (KYC/marketplace review). For
-- beta, payouts are a manual ledger: staff record a PENDING payout, then an
-- ADMIN/owner explicitly confirms it as MARKED_PAID with a reference + note. A
-- payout is NEVER paid without that explicit confirmation.
--
--   Apply AFTER 20260603000000_invite_admin_guard.sql.
-- ============================================================================

-- ---- ledger columns --------------------------------------------------------
alter table public.payments add column if not exists paid_at   timestamptz;
alter table public.payments add column if not exists paid_by   uuid references public.users (id) on delete set null;
alter table public.payments add column if not exists reference text;
alter table public.payments add column if not exists note      text;

-- ---- status vocabulary: add MARKED_PAID (manual) + CANCELED ----------------
alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments add constraint payments_status_check
  check (status in ('PENDING', 'MARKED_PAID', 'PAID', 'FAILED', 'CANCELED'));

-- ---- confirm a payout as manually paid -------------------------------------
-- ADMIN or company owner only; scoped to their own company; idempotent (a second
-- confirm is a no-op that returns the settled status, never a double-pay).
create or replace function public.mark_payout_paid(
  p_payment_id uuid, p_reference text default null, p_note text default null)
  returns text language plpgsql security definer set search_path = public as $$
declare
  v_company uuid := public.current_company();
  v_pay     public.payments;
begin
  if v_company is null
     or not (public.current_app_role() = 'ADMIN'
             or exists (select 1 from public.companies c
                        where c.id = v_company and c.owner_id = auth.uid())) then
    raise exception 'only an admin or the company owner may confirm payouts'
      using errcode = '42501';
  end if;

  select * into v_pay from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'payout not found' using errcode = '22023';
  end if;
  if v_pay.company_id <> v_company then
    raise exception 'cannot confirm another company''s payout' using errcode = '42501';
  end if;

  -- idempotent: already settled → return current status, no second write
  if v_pay.status in ('MARKED_PAID', 'PAID') then
    return v_pay.status;
  end if;
  if v_pay.status <> 'PENDING' then
    raise exception 'payout is %, not PENDING', v_pay.status using errcode = '22023';
  end if;

  update public.payments
     set status = 'MARKED_PAID', paid_at = now(), paid_by = auth.uid(),
         reference = p_reference, note = p_note
   where id = p_payment_id;
  return 'MARKED_PAID';
end $$;

-- ---- cancel a pending payout -----------------------------------------------
create or replace function public.cancel_payout(p_payment_id uuid, p_note text default null)
  returns text language plpgsql security definer set search_path = public as $$
declare
  v_company uuid := public.current_company();
  v_pay     public.payments;
begin
  if v_company is null
     or not (public.current_app_role() = 'ADMIN'
             or exists (select 1 from public.companies c
                        where c.id = v_company and c.owner_id = auth.uid())) then
    raise exception 'only an admin or the company owner may cancel payouts'
      using errcode = '42501';
  end if;

  select * into v_pay from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'payout not found' using errcode = '22023';
  end if;
  if v_pay.company_id <> v_company then
    raise exception 'cannot cancel another company''s payout' using errcode = '42501';
  end if;
  if v_pay.status <> 'PENDING' then
    raise exception 'payout is %, not PENDING', v_pay.status using errcode = '22023';
  end if;

  update public.payments
     set status = 'CANCELED', note = coalesce(p_note, note)
   where id = p_payment_id;
  return 'CANCELED';
end $$;

grant execute on function public.mark_payout_paid(uuid, text, text) to authenticated;
grant execute on function public.cancel_payout(uuid, text) to authenticated;
