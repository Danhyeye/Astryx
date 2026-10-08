begin;

create table public.app_users (
  email text primary key,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint app_users_email_normalized check (
    email = lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  )
);

alter table public.app_users enable row level security;
revoke all on table public.app_users from public, anon, authenticated;
grant select, insert, update, delete on table public.app_users to service_role;

-- Bootstrap the previously confirmed account. Other users must be added
-- explicitly using Supabase's Table Editor or privileged administration.
insert into public.app_users (email) values ('danhtcse171725@fpt.edu.vn');

commit;
