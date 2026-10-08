begin;

-- NextAuth is the identity boundary. Only the server's service role may
-- access application tables or call RPCs; publishable keys grant no access.
revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all sequences in schema public from public, anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public revoke all on tables from public, anon, authenticated;
alter default privileges in schema public revoke all on sequences from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Existing image records keep working through the authenticated image API.
update storage.buckets set public = false where id in ('land-images', 'contract-file');
drop policy if exists "land-images public read" on storage.objects;
drop policy if exists "land-images authenticated upload" on storage.objects;
drop policy if exists "land-images authenticated update" on storage.objects;
drop policy if exists "land-images authenticated delete" on storage.objects;
-- Restrictive policies also cover any additional permissive storage policies.
create policy "Owner app storage via server only" on storage.objects
  as restrictive for all to anon, authenticated
  using (bucket_id not in ('land-images', 'contract-file'))
  with check (bucket_id not in ('land-images', 'contract-file'));

commit;
