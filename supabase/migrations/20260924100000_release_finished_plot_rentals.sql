begin;

-- Completed/cancelled rental history also establishes that a stored RENTED flag
-- is contract-backed. Only overlapping active/pending contracts block new rentals.
create or replace function public.validate_contract_plots() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  previous_land uuid;
  effective_end date;
begin
  if TG_OP = 'UPDATE' then previous_land := OLD.land_id; end if;
  perform id from public.lands where id in (NEW.land_id, previous_land) order by id for update;
  perform id from public.plots where land_id = NEW.land_id order by id for share;
  effective_end := public.contract_rental_end(NEW.start_date, NEW.end_date, NEW.lease_duration_months);
  if effective_end < NEW.start_date then
    raise exception 'Ngày kết thúc không được trước ngày bắt đầu.' using errcode = '23514';
  end if;
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
    -- A manually rented plot with no contract has no known release date.
    -- Where a contract exists, its dates determine availability instead.
    if exists (
      select 1 from public.plots p where p.land_id = NEW.land_id
      and (cardinality(NEW.plot_ids) = 0 or p.id = any(NEW.plot_ids))
      and (lower(p.status) = 'sold' or (lower(p.status) = 'rented' and not exists (
        select 1 from public.contracts c where c.land_id = NEW.land_id
        and (cardinality(c.plot_ids) = 0 or p.id = any(c.plot_ids))
      )))
    ) then
      raise exception 'Lô đất đã bán hoặc đang cho thuê nhưng chưa có lịch kết thúc.' using errcode = '23505';
    end if;
    if exists (
      select 1 from public.contracts c where c.land_id = NEW.land_id
      and c.id <> NEW.id and lower(c.status) in ('active', 'pending')
      and (cardinality(c.plot_ids) = 0 or cardinality(NEW.plot_ids) = 0 or c.plot_ids && NEW.plot_ids)
      and daterange(c.start_date, public.contract_rental_end(c.start_date, c.end_date, c.lease_duration_months), '[]')
        && daterange(NEW.start_date, effective_end, '[]')
    ) then
      raise exception 'Thời gian thuê trùng với hợp đồng khác của khu đất hoặc lô đất đã chọn.' using errcode = '23505';
    end if;
  end if;
  return NEW;
end;
$$;

commit;
