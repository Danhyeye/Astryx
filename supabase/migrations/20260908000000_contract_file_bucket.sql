-- Private attachments; app server checks contract paths and issues short-lived download links.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('contract-file', 'contract-file', false, 10485760,
  array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public=false,
  file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;
