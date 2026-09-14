-- Isolated PostgreSQL test fixture based on the pre-migration schema.
-- Land management schema

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.lands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  area_sqm numeric(12, 2),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plots (
  id uuid primary key default gen_random_uuid(),
  land_id uuid not null references public.lands (id) on delete cascade,
  plot_number text not null,
  area_sqm numeric(12, 2),
  status text not null default 'available' check (status in ('available', 'rented', 'sold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (land_id, plot_number)
);

create table public.land_images (
  id uuid primary key default gen_random_uuid(),
  land_id uuid not null references public.lands (id) on delete cascade,
  storage_path text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  plot_id uuid not null references public.plots (id) on delete restrict,
  deposit_amount numeric(14, 2) not null default 0,
  rent_amount numeric(14, 2) not null,
  due_day smallint not null check (due_day between 1 and 28),
  start_date date not null,
  end_date date,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contract_payments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  due_date date not null,
  amount numeric(14, 2) not null,
  paid_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'paid', 'overdue')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger lands_set_updated_at
before update on public.lands
for each row execute function public.set_updated_at();

create trigger plots_set_updated_at
before update on public.plots
for each row execute function public.set_updated_at();

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create trigger contracts_set_updated_at
before update on public.contracts
for each row execute function public.set_updated_at();

create trigger contract_payments_set_updated_at
before update on public.contract_payments
for each row execute function public.set_updated_at();

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


insert into lands(id,name) values ('00000000-0000-4000-8000-000000000001','Land A'),('00000000-0000-4000-8000-000000000002','Land B');
insert into customers(id,name) values ('00000000-0000-4000-8000-000000000001','Customer');
insert into plots(id,land_id,plot_number) values
('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000001','A1'),
('00000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000001','A2'),
('00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000002','B1');
insert into contracts(id,customer_id,plot_id,rent_amount,due_day,start_date) values
('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011',1000,5,'2026-10-01');
