begin;

-- Retain the generated date so a moved period replaces its original entry.
alter table public.contract_payments add column original_due_date date;
update public.contract_payments set original_due_date = due_date;
create unique index contract_payments_original_due_unique
  on public.contract_payments(contract_id, original_due_date);

create or replace function public.protect_invoiced_schedule() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare paid numeric;
begin
  select coalesce(sum(amount), 0) into paid from public.invoices where payment_schedule_id = old.id;
  if new.original_due_date is distinct from old.original_due_date then
    raise exception 'Không thể thay đổi ngày gốc của kỳ thanh toán.' using errcode = '22023';
  end if;
  if paid > 0 and (new.id <> old.id or new.contract_id <> old.contract_id
    or new.amount < least(old.amount, paid)) then
    raise exception 'Không thể chuyển hóa đơn sang hợp đồng khác hoặc giảm số tiền dưới mức đã ghi nhận.' using errcode = '22023';
  end if;
  return new;
end;
$$;

-- Also covers periods first materialized by pay_contract_invoice. Prevent a
-- stale payment form from recreating a period at its former due date.
create function public.set_payment_original_date() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.original_due_date := coalesce(new.original_due_date, new.due_date);
  if exists(select 1 from public.contract_payments where contract_id = new.contract_id
    and original_due_date = new.due_date and due_date <> new.due_date) then
    raise exception 'Kỳ thanh toán đã được chuyển ngày. Vui lòng tải lại hợp đồng.' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger set_payment_original_date before insert on public.contract_payments
for each row execute function public.set_payment_original_date();

create function public.edit_contract_payment(p_contract_id uuid, p_original_date date,
  p_due_date date, p_amount numeric, p_expected_amount numeric)
returns public.contract_payments language plpgsql security invoker set search_path = '' as $$
declare rental public.contracts%rowtype; scheduled public.contract_payments%rowtype;
begin
  if p_original_date is null or p_due_date is null or p_amount is null or p_expected_amount is null
    or p_amount <= 0 or p_amount > 999999999999.99 or p_amount::text in ('NaN', 'Infinity', '-Infinity')
    or p_amount <> round(p_amount, 2) then
    raise exception 'Ngày đến hạn và số tiền không hợp lệ.' using errcode = '22023';
  end if;
  select * into rental from public.contracts where id = p_contract_id for update;
  if not found then raise exception 'Không tìm thấy hợp đồng.' using errcode = 'P0002'; end if;
  if p_due_date <> p_original_date and (p_due_date < rental.start_date
    or p_due_date > public.contract_rental_end(rental.start_date, rental.end_date, rental.lease_duration_months)) then
    raise exception 'Ngày đến hạn phải nằm trong thời hạn hợp đồng.' using errcode = '22023';
  end if;
  select * into scheduled from public.contract_payments
    where contract_id = p_contract_id and due_date = p_original_date for update;
  if found then
    if scheduled.amount <> p_expected_amount then
      raise exception 'Kỳ thanh toán đã thay đổi. Vui lòng tải lại hợp đồng.' using errcode = '40001';
    end if;
    update public.contract_payments set due_date = p_due_date, amount = p_amount, updated_at = now()
      where id = scheduled.id returning * into scheduled;
  else
    if exists(select 1 from public.contract_payments where contract_id = p_contract_id and original_due_date = p_original_date) then
      raise exception 'Kỳ thanh toán đã thay đổi. Vui lòng tải lại hợp đồng.' using errcode = '40001';
    end if;
    insert into public.contract_payments(contract_id, original_due_date, due_date, amount)
      values(p_contract_id, p_original_date, p_due_date, p_amount) returning * into scheduled;
  end if;
  return scheduled;
end;
$$;
revoke all on function public.edit_contract_payment(uuid,date,date,numeric,numeric) from public, anon, authenticated;
grant execute on function public.edit_contract_payment(uuid,date,date,numeric,numeric) to service_role;

commit;
