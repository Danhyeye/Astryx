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

insert into storage.buckets (id, name, public)
values ('land-images', 'land-images', true)
on conflict (id) do nothing;

create index plots_land_id_idx on public.plots (land_id);
create index land_images_land_id_idx on public.land_images (land_id);
create index contracts_customer_id_idx on public.contracts (customer_id);
create index contracts_plot_id_idx on public.contracts (plot_id);
create index contract_payments_contract_id_idx on public.contract_payments (contract_id);
create index contract_payments_due_date_idx on public.contract_payments (due_date);

alter table public.lands enable row level security;
alter table public.plots enable row level security;
alter table public.land_images enable row level security;
alter table public.customers enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_payments enable row level security;

create policy "Allow all for authenticated users" on public.lands
  for all using (true) with check (true);

create policy "Allow all for authenticated users" on public.plots
  for all using (true) with check (true);

create policy "Allow all for authenticated users" on public.land_images
  for all using (true) with check (true);

create policy "Allow all for authenticated users" on public.customers
  for all using (true) with check (true);

create policy "Allow all for authenticated users" on public.contracts
  for all using (true) with check (true);

create policy "Allow all for authenticated users" on public.contract_payments
  for all using (true) with check (true);
