begin;

alter table public.contracts add column annual_rent_increase_percent numeric not null default 0
  check (annual_rent_increase_percent >= 0 and annual_rent_increase_percent::text not in ('NaN', 'Infinity', '-Infinity'));

-- Anniversary-based, simple increase on the starting rent; no compounding.
create function public.contract_rent_on_date(base_rent numeric, annual_percent numeric, start_date date, due_date date)
returns numeric language plpgsql immutable strict set search_path = '' as $$
declare years integer; anniversary date; anniversary_month date;
begin
  years := extract(year from due_date)::integer - extract(year from start_date)::integer;
  anniversary_month := make_date(extract(year from due_date)::integer, extract(month from start_date)::integer, 1);
  anniversary := anniversary_month + (least(extract(day from start_date)::integer,
    extract(day from (anniversary_month + interval '1 month - 1 day'))::integer) - 1);
  if due_date < anniversary then years := years - 1; end if;
  return round(base_rent * (100 + annual_percent * greatest(0, years)) / 100, 2);
end;
$$;
revoke all on function public.contract_rent_on_date(numeric,numeric,date,date) from public, anon, authenticated;
grant execute on function public.contract_rent_on_date(numeric,numeric,date,date) to service_role;

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
      values(p_contract_id, p_due_date, public.contract_rent_on_date(rental.rent_amount, rental.annual_rent_increase_percent, rental.start_date, p_due_date)) returning * into scheduled;
  end if;
  insert into public.invoices(id, payment_schedule_id, payment_date, amount)
    values(p_invoice_id, scheduled.id, p_payment_date, p_amount) returning * into receipt;
  return receipt;
end;
$$;

commit;
