begin;
alter table public.contracts drop constraint if exists contracts_status_check;
alter table public.contracts add constraint contracts_status_check
  check (status in ('pending', 'active', 'completed', 'cancelled'));

create function public.validate_pending_contract_date() returns trigger
language plpgsql set search_path = '' as $$
begin
  if NEW.status = 'pending' and NEW.start_date <= (current_timestamp at time zone 'Asia/Ho_Chi_Minh')::date then
    raise exception 'Hợp đồng chờ hiệu lực phải có ngày bắt đầu sau hôm nay (giờ Việt Nam).'
      using errcode = '23514';
  end if;
  return NEW;
end;
$$;
create trigger contracts_validate_pending_date before insert or update on public.contracts
for each row execute function public.validate_pending_contract_date();

create or replace function public.validate_contract_plots() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  previous_ids uuid[] := '{}';
  previous_land uuid;
  previous_active boolean := false;
begin
  if TG_OP = 'UPDATE' then
    previous_ids := OLD.plot_ids;
    previous_land := OLD.land_id;
    previous_active := lower(OLD.status) in ('active', 'pending');
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
  if lower(NEW.status) in ('active', 'pending') then
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
      and c.id <> NEW.id and lower(c.status) in ('active', 'pending')
      and (cardinality(c.plot_ids) = 0 or cardinality(NEW.plot_ids) = 0 or c.plot_ids && NEW.plot_ids)
    ) then
      raise exception 'Khu đất hoặc lô đất đã được thuê trong hợp đồng khác.' using errcode = '23505';
    end if;
  end if;
  return NEW;
end;
$$;

create index contracts_pending_start_idx on public.contracts(start_date) where status = 'pending';

create function public.activate_pending_contracts() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  contract_record record;
  activated integer := 0;
  changed integer;
begin
  for contract_record in
    select id from public.contracts
    where status = 'pending' and start_date <= (current_timestamp at time zone 'Asia/Ho_Chi_Minh')::date
    order by land_id, id
  loop
    begin
      update public.contracts set status = 'active'
      where id = contract_record.id and status = 'pending'
        and start_date <= (current_timestamp at time zone 'Asia/Ho_Chi_Minh')::date;
      get diagnostics changed = row_count;
      activated := activated + changed;
    exception when unique_violation or check_violation then
      -- Keep this contract pending for review; continue activating other contracts.
      raise warning 'Pending contract % could not activate: %', contract_record.id, SQLERRM;
    end;
  end loop;
  return activated;
end;
$$;
revoke all on function public.activate_pending_contracts() from public;

-- Check Vietnam's date inside the function, independently of the cron timezone.
create extension if not exists pg_cron;
select cron.schedule('activate-pending-contracts', '* * * * *', 'select public.activate_pending_contracts();');
commit;
