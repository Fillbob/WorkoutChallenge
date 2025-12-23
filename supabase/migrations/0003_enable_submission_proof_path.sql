-- Allow authenticated users to upload proof files inside their own folder
-- This ensures UI save actions targeting Supabase Storage succeed when the
-- object path is prefixed with the user id (e.g., `<user-id>/file.png`).

-- Create bucket if missing
insert into storage.buckets (id, name, public)
values ('submission-proofs', 'submission-proofs', false)
on conflict (id) do nothing;

-- Permit listing and reading only within the caller's folder
create policy if not exists "proofs owner list" on storage.objects for select using (
  bucket_id = 'submission-proofs' and auth.uid()::text = split_part(name, '/', 1)
);

-- Permit uploads when the path starts with the caller's user id
create policy if not exists "proofs owner insert path" on storage.objects for insert with check (
  bucket_id = 'submission-proofs' and auth.uid()::text = split_part(name, '/', 1)
);

-- Permit updates (overwrites) within the same path
create policy if not exists "proofs owner update path" on storage.objects for update using (
  bucket_id = 'submission-proofs' and auth.uid()::text = split_part(name, '/', 1)
);
