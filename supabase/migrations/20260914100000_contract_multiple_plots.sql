-- A contract always belongs to a land; an empty selection rents the entire land.
-- plot_ids is the atomic write interface. contract_plots is maintained by a
-- trigger for foreign keys and PostgREST relation reads; clients cannot edit it.
begin;
alter table public.contracts drop constraint if exists contracts_single_target_check;
alter table public.contracts add column plot_ids uuid[] not null default '{}';
update public.contracts c set land_id = p.land_id, plot_ids = array[p.id]
from public.plots p where c.plot_id = p.id;
alter table public.contracts alter column land_id set not null;
update public.contracts set plot_id = null;
alter table public.contracts add constraint contracts_legacy_plot_empty check (plot_id is null);

create table public.contract_plots (
  contract_id uuid not null references public.contracts(id) on delete cascade,
  plot_id uuid not null references public.plots(id) on delete restrict,
  primary key (contract_id, plot_id)
);
insert into public.contract_plots select id, unnest(plot_ids) from public.contracts;
create index contract_plots_plot_idx on public.contract_plots(plot_id);
alter table public.contract_plots enable row level security;
create policy "Read contract plots" on public.contract_plots for select using (true);

create function public.validate_contract_plots() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  previous_ids uuid[] := '{}';
  previous_land uuid;
  previous_active boolean := false;
begin
  if TG_OP = 'UPDATE' then
    previous_ids := OLD.plot_ids;
    previous_land := OLD.land_id;
    previous_active := lower(OLD.status) = 'active';
  end if;
  -- All contracts in a land serialize here, including whole-land rentals.
  perform id from public.lands where id in (NEW.land_id, previous_land) order by id for update;
  perform id from public.plots where land_id = NEW.land_id order by id for share;
  if array_position(NEW.plot_ids, null) is not null
     or cardinality(NEW.plot_ids) <> (select count(distinct id) from unnest(NEW.plot_ids) id) then
    raise exception 'Danh sách lô đất không hợp lệ hoặc bị trùng.' using errcode = '23514';
  end if;
  if exists (
    select 1 from unnest(NEW.plot_ids) selected(id)
    left join public.plots p on p.id = selected.id
    where p.id is null or p.land_id <> NEW.land_id
  ) then
    raise exception 'Tất cả lô đất phải thuộc khu đất đã chọn.' using errcode = '23514';
  end if;
  if lower(NEW.status) = 'active' then
    if exists (
      select 1 from public.plots p where p.land_id = NEW.land_id
      and (cardinality(NEW.plot_ids) = 0 or p.id = any(NEW.plot_ids))
      and (lower(p.status) = 'sold' or (lower(p.status) = 'rented' and not (
        previous_active and previous_land = NEW.land_id
        and (cardinality(previous_ids) = 0 or p.id = any(previous_ids))
      )))
    ) then
      raise exception 'Lô đất đã được thuê hoặc đã bán.' using errcode = '23505';
    end if;
    if exists (
      select 1 from public.contracts c where c.land_id = NEW.land_id
      and c.id <> NEW.id and lower(c.status) = 'active'
      and (cardinality(c.plot_ids) = 0 or cardinality(NEW.plot_ids) = 0 or c.plot_ids && NEW.plot_ids)
    ) then
      raise exception 'Khu đất hoặc lô đất đã được thuê trong hợp đồng khác.' using errcode = '23505';
    end if;
  end if;
  return NEW;
end;
$$;
create trigger contracts_validate_plots before insert or update of land_id, plot_ids, status
on public.contracts for each row execute function public.validate_contract_plots();

create function public.sync_contract_plots() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.contract_plots where contract_id = NEW.id;
  insert into public.contract_plots select NEW.id, unnest(NEW.plot_ids);
  return NEW;
end;
$$;
create trigger contracts_sync_plots after insert or update of plot_ids on public.contracts
for each row execute function public.sync_contract_plots();

create function public.guard_contracted_plot_land() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if NEW.land_id <> OLD.land_id and exists (
    select 1 from public.contract_plots where plot_id = OLD.id
  ) then
    raise exception 'Không thể chuyển lô đất đã có hợp đồng sang khu đất khác.' using errcode = '23514';
  end if;
  return NEW;
end;
$$;
create trigger plots_guard_contract_land before update of land_id on public.plots
for each row execute function public.guard_contracted_plot_land();
commit;
