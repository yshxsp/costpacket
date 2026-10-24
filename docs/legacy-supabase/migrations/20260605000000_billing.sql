-- ============================================================================
-- CostPacket — Paddle subscription billing (beta)
-- ============================================================================
-- Paddle (Merchant of Record) bills the CostPacket SaaS subscription. The
-- WEBHOOK is the source of truth for subscription state — browser checkout
-- success never grants access on its own.
--
--   subscriptions   one row per company (current plan + status from Paddle)
--   billing_events  every webhook, keyed by Paddle event_id for idempotency
--
-- Both are written ONLY by the webhook using the Supabase service role (which
-- bypasses RLS). Clients may read their own company's subscription; no client
-- may read billing_events or write either table.
--
--   Apply AFTER 20260604000000_manual_payout_ledger.sql.
-- ============================================================================

-- ---- subscriptions ---------------------------------------------------------
create table if not exists public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  company_id             uuid not null unique references public.companies (id) on delete cascade,
  paddle_customer_id     text,
  paddle_subscription_id text unique,
  status                 text not null default 'trialing'
                           check (status in ('trialing', 'active', 'past_due', 'paused', 'canceled')),
  price_id               text,
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists subscriptions_company_idx on public.subscriptions (company_id);

-- ---- billing_events (idempotency log) --------------------------------------
create table if not exists public.billing_events (
  id          uuid primary key default gen_random_uuid(),
  event_id    text not null unique,        -- Paddle event_id; the idempotency key
  event_type  text not null,
  company_id  uuid references public.companies (id) on delete set null,
  payload     jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists billing_events_company_idx on public.billing_events (company_id);

-- ---- access helper ---------------------------------------------------------
-- Active access = an active/trialing subscription for the caller's company.
-- SECURITY DEFINER so it can be reused in policies without recursing on RLS.
create or replace function public.has_active_subscription()
  returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s
    where s.company_id = public.current_company()
      and s.status in ('active', 'trialing')
  )
$$;

-- ---- privileges + RLS ------------------------------------------------------
-- subscriptions: company members may READ their own row; all writes are
-- service-role (webhook) only.
alter table public.subscriptions enable row level security;
revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;
drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions
  for select using (company_id = public.current_company());

-- billing_events: no client access at all (service role bypasses RLS).
alter table public.billing_events enable row level security;
revoke all on public.billing_events from anon, authenticated;

grant execute on function public.has_active_subscription() to authenticated;
