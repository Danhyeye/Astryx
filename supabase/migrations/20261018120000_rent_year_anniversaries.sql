begin;

-- Preserve existing calendar-year schedules; new contracts use rental anniversaries.
alter table public.contracts add column rent_year_basis text not null default 'calendar'
  check (rent_year_basis in ('calendar', 'anniversary'));
alter table public.contracts alter column rent_year_basis set default 'anniversary';

create function public.contract_rental_year(p_start date, p_due date)
returns integer language plpgsql immutable strict set search_path = '' as $$
declare years integer; anniversary_month date; anniversary date;
begin
  years := extract(year from p_due)::integer - extract(year from p_start)::integer;
  anniversary_month := make_date(extract(year from p_due)::integer, extract(month from p_start)::integer, 1);
  anniversary := anniversary_month + (least(extract(day from p_start)::integer,
    extract(day from (anniversary_month + interval '1 month - 1 day'))::integer) - 1);
  if p_due < anniversary then years := years - 1; end if;
  return greatest(1, years + 1);
end;
$$;
revoke all on function public.contract_rental_year(date,date) from public, anon, authenticated;
grant execute on function public.contract_rental_year(date,date) to service_role;

create or replace function public.save_contract_with_rent_years(p_contract_id uuid, p_contract jsonb, p_rent_years jsonb default null)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare saved_id uuid; terms public.contracts%rowtype;
begin
  if jsonb_typeof(p_contract) is distinct from 'object' then
    raise exception 'Thông tin hợp đồng không hợp lệ.' using errcode = '22023';
  end if;
  if p_rent_years is not null and jsonb_typeof(p_rent_years) is distinct from 'array' then
    raise exception 'Bảng tiền thuê theo năm không hợp lệ.' using errcode = '22023';
  end if;
  if p_contract_id is null then
    terms := jsonb_populate_record(null::public.contracts, p_contract);
    insert into public.contracts (customer_id, land_id, plot_id, plot_ids, deposit_amount, rent_amount, annual_rent_increase_percent, rent_year_basis, due_day, lease_duration_months, payment_frequency, payment_due_day, next_payment_due_date, start_date, end_date, status, notes)
      values (terms.customer_id, terms.land_id, terms.plot_id, coalesce(terms.plot_ids, '{}'::uuid[]), coalesce(terms.deposit_amount, 0), terms.rent_amount, coalesce(terms.annual_rent_increase_percent, 0), coalesce(terms.rent_year_basis, 'anniversary'), terms.due_day, terms.lease_duration_months, coalesce(terms.payment_frequency, 'monthly'), terms.payment_due_day, terms.next_payment_due_date, terms.start_date, terms.end_date, coalesce(terms.status, 'active'), terms.notes) returning id into saved_id;
  else
    select * into terms from public.contracts where id = p_contract_id for update;
    if not found then raise exception 'Không tìm thấy hợp đồng.' using errcode = 'P0002'; end if;
    terms := jsonb_populate_record(terms, p_contract);
    update public.contracts set
      customer_id = terms.customer_id,
      land_id = terms.land_id,
      plot_id = terms.plot_id,
      plot_ids = terms.plot_ids,
      deposit_amount = terms.deposit_amount,
      rent_amount = terms.rent_amount,
      annual_rent_increase_percent = terms.annual_rent_increase_percent,
      rent_year_basis = terms.rent_year_basis,
      due_day = terms.due_day,
      lease_duration_months = terms.lease_duration_months,
      payment_frequency = terms.payment_frequency,
      payment_due_day = terms.payment_due_day,
      next_payment_due_date = terms.next_payment_due_date,
      start_date = terms.start_date,
      end_date = terms.end_date,
      status = terms.status,
      notes = terms.notes
      where id = p_contract_id;
    saved_id := p_contract_id;
  end if;
  if p_rent_years is not null then
    delete from public.contract_rent_years where contract_id = saved_id;
    insert into public.contract_rent_years (contract_id, year, increase_percent)
      select saved_id, row.year, row.increase_percent
      from jsonb_to_recordset(p_rent_years) as row(year integer, increase_percent numeric);
    -- Explicit yearly settings replace the earlier automatic annual increase.
    update public.contracts set annual_rent_increase_percent = 0 where id = saved_id;
  end if;
  select * into terms from public.contracts where id = saved_id;
  if exists (
    select 1 from public.contract_rent_years y where y.contract_id = saved_id
    and public.contract_rental_end(terms.start_date, terms.end_date, terms.lease_duration_months) is not null
    and y.year > case when terms.rent_year_basis = 'anniversary'
      then public.contract_rental_year(terms.start_date, public.contract_rental_end(terms.start_date, terms.end_date, terms.lease_duration_months))
      else extract(year from public.contract_rental_end(terms.start_date, terms.end_date, terms.lease_duration_months))::integer end
  ) then raise exception 'Khoảng năm áp dụng vượt quá thời hạn hợp đồng.' using errcode = '23514'; end if;
  return saved_id;
end;
$$;

create or replace function public.contract_rent_on_date(p_contract_id uuid, p_due_date date)
returns numeric language plpgsql stable security invoker set search_path = '' as $$
declare rental public.contracts%rowtype; percent numeric; price_year integer;
begin
  select * into strict rental from public.contracts where id = p_contract_id;
  price_year := case when rental.rent_year_basis = 'anniversary'
    then public.contract_rental_year(rental.start_date, p_due_date)
    else extract(year from p_due_date)::integer end;
  select increase_percent into percent from public.contract_rent_years
    where contract_id = p_contract_id and year = price_year;
  if found or exists(select 1 from public.contract_rent_years where contract_id = p_contract_id) then
    return round(rental.rent_amount * (100 + coalesce(percent, 0)) / 100, 2);
  end if;
  return public.contract_rent_on_date(rental.rent_amount, rental.annual_rent_increase_percent, rental.start_date, p_due_date);
end;
$$;

commit;
