-- ============================================================================
-- CostPacket — receipts storage bucket (PRIVATE, company-scoped)
-- ============================================================================
-- ⚠️  REVIEW + TEST ON A BRANCH. Receipts are financial PII — the bucket is
--     PRIVATE. The app must upload under `<company_id>/<file>` and render images
--     via a server-side createSignedUrl(path, ttl), NOT getPublicUrl().
--     (Previous version made this bucket public-read — that let anyone with a
--     URL view any receipt. Fixed here.)
-- ============================================================================

-- Private bucket. If it already exists public, flip it private.
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do update set public = false;

drop policy if exists "receipts public read" on storage.objects;
drop policy if exists "receipts authenticated upload" on storage.objects;
drop policy if exists "receipts owner update" on storage.objects;
drop policy if exists "receipts owner delete" on storage.objects;

-- Path convention: first folder segment is the caller's company_id. All four
-- policies scope to that, so a user can only touch their own company's objects.
-- Reads go through signed URLs minted server-side; direct anon reads are denied.
create policy "receipts read own company" on storage.objects
  for select to authenticated using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = public.current_company()::text
  );

create policy "receipts insert own company" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = public.current_company()::text
  );

create policy "receipts update own company" on storage.objects
  for update to authenticated using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = public.current_company()::text
  );

create policy "receipts delete own company" on storage.objects
  for delete to authenticated using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = public.current_company()::text
  );
