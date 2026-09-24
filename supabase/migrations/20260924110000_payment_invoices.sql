begin;

create unique index contract_payments_contract_due_unique on public.contract_payments(contract_id, due_date);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  payment_schedule_id uuid not null references public.contract_payments(id) on delete cascade,
  payment_date date not null,
  amount numeric(14,2) not null check (amount > 0 and amount <> 'NaN'::numeric),
  created_at timestamptz not null default now()
);
create index invoices_payment_schedule_idx on public.invoices(payment_schedule_id);

-- Preserve earlier paid flags as one payment per schedule. Old rows without a
-- payment timestamp use their due date, capped at today, as the best known date.
insert into public.invoices(payment_schedule_id, payment_date, amount, created_at)
select id, least(coalesce((paid_at at time zone 'Asia/Ho_Chi_Minh')::date, due_date),
  (now() at time zone 'Asia/Ho_Chi_Minh')::date), amount, coalesce(paid_at, updated_at)
from public.contract_payments where (lower(status) = 'paid' or paid_at is not null) and amount > 0;

alter table public.invoices enable row level security;
create policy "Read invoices for visible schedules" on public.invoices for select to anon, authenticated
  using (exists(select 1 from public.contract_payments p where p.id = payment_schedule_id));
create policy "Add invoices for visible schedules" on public.invoices for insert to anon, authenticated
  with check (exists(select 1 from public.contract_payments p where p.id = payment_schedule_id));
revoke all on public.invoices from public, anon, authenticated;
grant select, insert on public.invoices to anon, authenticated;
grant all on public.invoices to service_role;

create function public.validate_invoice_payment() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare scheduled_amount numeric; paid numeric;
begin
  if new.payment_date > (now() at time zone 'Asia/Ho_Chi_Minh')::date then
    raise exception 'Ngày thanh toán không được ở tương lai.' using errcode = '22023';
  end if;
  -- Lock even for direct inserts, not just RPC calls. The following sum sees
  -- payments committed by the previous lock holder under READ COMMITTED.
  select amount into scheduled_amount from public.contract_payments where id = new.payment_schedule_id for update;
  if not found then raise exception 'Không tìm thấy kỳ thanh toán.' using errcode = 'P0002'; end if;
  select coalesce(sum(amount), 0) into paid from public.invoices where payment_schedule_id = new.payment_schedule_id;
  if new.amount > scheduled_amount - paid then
    raise exception 'Số tiền thanh toán vượt quá số tiền còn lại.' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger validate_invoice_payment before insert on public.invoices
for each row execute function public.validate_invoice_payment();

create function public.protect_invoiced_schedule() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare paid numeric;
begin
  select coalesce(sum(amount),0) into paid from public.invoices where payment_schedule_id = old.id;
  if paid > 0 and (new.id <> old.id or new.contract_id <> old.contract_id or new.due_date <> old.due_date or new.amount < paid) then
    raise exception 'Không thể chuyển kỳ thanh toán đã có hóa đơn hoặc giảm số tiền dưới tổng đã thanh toán.' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger protect_invoiced_schedule before update on public.contract_payments
for each row execute function public.protect_invoiced_schedule();

create function public.pay_contract_invoice(p_contract_id uuid, p_due_date date,
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
    month_step := case lower(rental.payment_frequency) when 'monthly' then 1 when 'quarterly' then 3 when 'yearly' then 12 else null end;
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
      values(p_contract_id, p_due_date, rental.rent_amount) returning * into scheduled;
  end if;
  insert into public.invoices(id, payment_schedule_id, payment_date, amount)
    values(p_invoice_id, scheduled.id, p_payment_date, p_amount) returning * into receipt;
  return receipt;
end;
$$;
revoke all on function public.pay_contract_invoice(uuid,date,date,numeric,uuid) from public;
grant execute on function public.pay_contract_invoice(uuid,date,date,numeric,uuid) to anon, authenticated;
-- Legacy flags remain for schema compatibility; all readers now derive status
-- from invoices. Retire the toggle so old clients cannot silently mark paid.
revoke all on function public.record_contract_payment(uuid,date,boolean) from public, anon, authenticated;

commit;
