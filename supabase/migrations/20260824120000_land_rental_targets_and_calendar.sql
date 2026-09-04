-- Rental targets, plot images, richer terms, and calendar sync metadata.

alter table public.contracts
  alter column plot_id drop not null;

alter table public.contracts
  add column if not exists land_id uuid references public.lands (id) on delete restrict,
  add column if not exists lease_duration_months integer,
  add column if not exists payment_frequency text not null default 'monthly',
  add column if not exists payment_due_day smallint,
  add column if not exists next_payment_due_date date;

update public.contracts
set payment_due_day = coalesce(payment_due_day, due_day)
where payment_due_day is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'contracts_lease_duration_months_check'
  ) then
    alter table public.contracts
      add constraint contracts_lease_duration_months_check
      check (lease_duration_months is null or lease_duration_months > 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'contracts_payment_frequency_check'
  ) then
    alter table public.contracts
      add constraint contracts_payment_frequency_check
      check (payment_frequency in ('monthly', 'quarterly', 'yearly', 'custom'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'contracts_payment_due_day_check'
  ) then
    alter table public.contracts
      add constraint contracts_payment_due_day_check
      check (payment_due_day is null or payment_due_day between 1 and 28);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'contracts_single_target_check'
  ) then
    alter table public.contracts
      add constraint contracts_single_target_check
      check (
        (land_id is not null and plot_id is null)
        or (land_id is null and plot_id is not null)
      );
  end if;
end
$$;

alter table public.land_images
  alter column land_id drop not null;

alter table public.land_images
  add column if not exists plot_id uuid references public.plots (id) on delete cascade;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'land_images_single_target_check'
  ) then
    alter table public.land_images
      add constraint land_images_single_target_check
      check (
        (land_id is not null and plot_id is null)
        or (land_id is null and plot_id is not null)
      );
  end if;
end
$$;

create table if not exists public.calendar_integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'google' check (provider in ('google')),
  account_email text,
  external_account_id text,
  calendar_id text,
  sync_token text,
  status text not null default 'active' check (status in ('active', 'paused', 'revoked')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_sync_events (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.calendar_integrations (id) on delete cascade,
  contract_payment_id uuid references public.contract_payments (id) on delete cascade,
  contract_id uuid references public.contracts (id) on delete cascade,
  external_event_id text,
  external_event_url text,
  status text not null default 'pending' check (status in ('pending', 'synced', 'failed', 'deleted')),
  last_error text,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (integration_id, contract_payment_id)
);

create trigger calendar_integrations_set_updated_at
before update on public.calendar_integrations
for each row execute function public.set_updated_at();

create trigger calendar_sync_events_set_updated_at
before update on public.calendar_sync_events
for each row execute function public.set_updated_at();

create index if not exists contracts_land_id_idx on public.contracts (land_id);
create index if not exists contracts_status_idx on public.contracts (status);
create index if not exists land_images_plot_id_idx on public.land_images (plot_id);
create index if not exists calendar_sync_events_integration_id_idx on public.calendar_sync_events (integration_id);
create index if not exists calendar_sync_events_contract_payment_id_idx on public.calendar_sync_events (contract_payment_id);
create index if not exists calendar_sync_events_contract_id_idx on public.calendar_sync_events (contract_id);

alter table public.calendar_integrations enable row level security;
alter table public.calendar_sync_events enable row level security;

create policy "Allow all for authenticated users" on public.calendar_integrations
  for all using (true) with check (true);

create policy "Allow all for authenticated users" on public.calendar_sync_events
  for all using (true) with check (true);
