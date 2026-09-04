-- Supabase Storage setup for land and plot image uploads.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'land-images',
  'land-images',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'land-images public read'
  ) then
    create policy "land-images public read"
      on storage.objects
      for select
      to public
      using (bucket_id = 'land-images');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'land-images authenticated upload'
  ) then
    create policy "land-images authenticated upload"
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'land-images');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'land-images authenticated update'
  ) then
    create policy "land-images authenticated update"
      on storage.objects
      for update
      to authenticated
      using (bucket_id = 'land-images')
      with check (bucket_id = 'land-images');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'land-images authenticated delete'
  ) then
    create policy "land-images authenticated delete"
      on storage.objects
      for delete
      to authenticated
      using (bucket_id = 'land-images');
  end if;
end
$$;
