begin;

create table public.contract_rent_years (
  contract_id uuid not null references public.contracts(id) on delete cascade,
  year integer not null check (year between 1 and 9999),
  increase_percent numeric not null default 0 check (increase_percent >= 0 and increase_percent::text not in ('NaN', 'Infinity', '-Infinity')),
  primary key (contract_id, year)
);
alter table public.contract_rent_years enable row level security;
revoke all on public.contract_rent_years from public, anon, authenticated;
grant all on public.contract_rent_years to service_role;

-- The contract and its replacement yearly settings commit or roll back together.
create function public.save_contract_with_rent_years(p_contract_id uuid, p_contract jsonb, p_rent_years jsonb default null)
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
    insert into public.contracts (customer_id, land_id, plot_id, plot_ids, deposit_amount, rent_amount, annual_rent_increase_percent, due_day, lease_duration_months, payment_frequency, payment_due_day, next_payment_due_date, start_date, end_date, status, notes)
      values (terms.customer_id, terms.land_id, terms.plot_id, coalesce(terms.plot_ids, '{}'::uuid[]), coalesce(terms.deposit_amount, 0), terms.rent_amount, coalesce(terms.annual_rent_increase_percent, 0), terms.due_day, terms.lease_duration_months, coalesce(terms.payment_frequency, 'monthly'), terms.payment_due_day, terms.next_payment_due_date, terms.start_date, terms.end_date, coalesce(terms.status, 'active'), terms.notes) returning id into saved_id;
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
  return saved_id;
end;
$$;
revoke all on function public.save_contract_with_rent_years(uuid,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.save_contract_with_rent_years(uuid,jsonb,jsonb) to service_role;

create function public.contract_rent_on_date(p_contract_id uuid, p_due_date date)
returns numeric language plpgsql stable security invoker set search_path = '' as $$
declare rental public.contracts%rowtype; percent numeric;
begin
  select * into strict rental from public.contracts where id = p_contract_id;
  select increase_percent into percent from public.contract_rent_years
    where contract_id = p_contract_id and year = extract(year from p_due_date)::integer;
  if found or exists(select 1 from public.contract_rent_years where contract_id = p_contract_id) then
    return round(rental.rent_amount * (100 + coalesce(percent, 0)) / 100, 2);
  end if;
  -- Keep existing annual contracts compatible until a custom table replaces them.
  return public.contract_rent_on_date(rental.rent_amount, rental.annual_rent_increase_percent, rental.start_date, p_due_date);
end;
$$;
revoke all on function public.contract_rent_on_date(uuid,date) from public, anon, authenticated;
grant execute on function public.contract_rent_on_date(uuid,date) to service_role;

create or replace function public.pay_contract_invoice(p_contract_id uuid, p_due_date date,
  p_payment_date date, p_amount numeric, p_invoice_id uuid)
returns public.invoices language plpgsql security invoker set search_path = '' as $$
declare rental public.contracts%rowtype; scheduled public.contract_payments%rowtype;
  receipt public.invoices%rowtype; month_step integer; month_offset integer; expected_date date;
begin
  if p_invoice_id is null or p_due_date is null or p_payment_date is null or p_amount is null
    or p_amount <= 0 or p_amount::text in ('NaN', 'Infinity', '-Infinity') or p_amount <> round(p_amount, 2) then
    raise exception 'Ngày thanh toán và số tiền lớn hơn 0 (tối đa 2 chữ số thập phân) là bắt buộc.' using errcode = '22023';
  end if;
  if p_payment_date > (now() at time zone 'Asia/Ho_Chi_Minh')::date then
    raise exception 'Ngày thanh toán không được ở tương lai.' using errcode = '22023';
  end if;
  select * into rental from public.contracts where id = p_contract_id for update;
  if not found then raise exception 'Không tìm thấy hợp đồng.' using errcode = 'P0002'; end if;
  -- Stable client-generated ID makes a retry after a lost response safe.
  select i.* into receipt from public.invoices i join public.contract_payments p on p.id = i.payment_schedule_id
    where i.id = p_invoice_id and p.contract_id = p_contract_id and p.due_date = p_due_date;
  if found then
    if receipt.amount <> p_amount or receipt.payment_date <> p_payment_date then
      raise exception 'Yêu cầu thanh toán đã được ghi nhận với thông tin khác.' using errcode = '22023';
    end if;
    return receipt;
  end if;
  select * into scheduled from public.contract_payments where contract_id = p_contract_id and due_date = p_due_date for update;
  if not found then
    if rental.status = 'cancelled' or p_due_date < rental.start_date
      or p_due_date > public.contract_rental_end(rental.start_date, rental.end_date, rental.lease_duration_months) then
      raise exception 'Ngày đến hạn nằm ngoài thời hạn hợp đồng.' using errcode = '22023';
    end if;
    month_step := case lower(rental.payment_frequency) when 'monthly' then 1 when 'quarterly' then 3 when 'yearly' then 12
      when 'every_2_months' then 2
      when 'every_4_months' then 4
      when 'every_5_months' then 5
      when 'every_6_months' then 6
      when 'every_7_months' then 7
      when 'every_8_months' then 8
      when 'every_9_months' then 9
      when 'every_10_months' then 10
      when 'every_11_months' then 11
      else null end;
    if month_step is null then
      if p_due_date is distinct from rental.next_payment_due_date then
        raise exception 'Ngày đến hạn không thuộc lịch thanh toán.' using errcode = '22023';
      end if;
    else
      month_offset := (extract(year from p_due_date)::integer - extract(year from rental.start_date)::integer) * 12
        + extract(month from p_due_date)::integer - extract(month from rental.start_date)::integer;
      expected_date := date_trunc('month', p_due_date)::date + (least(coalesce(nullif(rental.due_day, 0), rental.payment_due_day),
        extract(day from (date_trunc('month', p_due_date) + interval '1 month - 1 day'))::integer) - 1);
      if month_offset < 0 or month_offset % month_step <> 0 or p_due_date is distinct from expected_date then
        raise exception 'Ngày đến hạn không thuộc lịch thanh toán.' using errcode = '22023';
      end if;
    end if;
    insert into public.contract_payments(contract_id, due_date, amount)
      values(p_contract_id, p_due_date, public.contract_rent_on_date(rental.id, p_due_date)) returning * into scheduled;
  end if;
  insert into public.invoices(id, payment_schedule_id, payment_date, amount)
    values(p_invoice_id, scheduled.id, p_payment_date, p_amount) returning * into receipt;
  return receipt;
end;
$$;

commit;
