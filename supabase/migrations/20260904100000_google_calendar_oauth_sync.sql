-- Google Calendar OAuth token storage and idempotent generated-event sync keys.

create table if not exists public.calendar_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null unique references public.calendar_integrations (id) on delete cascade,
  access_token text not null,
  refresh_token text,
  token_type text,
  scope text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists calendar_oauth_tokens_set_updated_at on public.calendar_oauth_tokens;

create trigger calendar_oauth_tokens_set_updated_at
before update on public.calendar_oauth_tokens
for each row execute function public.set_updated_at();

alter table public.calendar_oauth_tokens enable row level security;

revoke all on table public.calendar_oauth_tokens from anon;
revoke all on table public.calendar_oauth_tokens from authenticated;
grant select, insert, update, delete on table public.calendar_oauth_tokens to service_role;

alter table public.calendar_sync_events
  add column if not exists local_event_key text,
  add column if not exists due_date date;

create unique index if not exists calendar_sync_events_integration_local_event_key_idx
on public.calendar_sync_events (integration_id, local_event_key)
where local_event_key is not null;

create index if not exists calendar_sync_events_due_date_idx
on public.calendar_sync_events (due_date);

notify pgrst, 'reload schema';
