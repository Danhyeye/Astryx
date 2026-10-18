begin;

-- The actual amount received is authoritative, even when it exceeds this
-- period's rent. Excess remains attached to the same period, without being
-- deducted from other periods or treated as a refund.
create or replace function public.validate_invoice_payment() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.payment_date > (now() at time zone 'Asia/Ho_Chi_Minh')::date then
    raise exception 'Ngày thanh toán không được ở tương lai.' using errcode = '22023';
  end if;
  perform 1 from public.contract_payments where id = new.payment_schedule_id for update;
  if not found then raise exception 'Không tìm thấy kỳ thanh toán.' using errcode = 'P0002'; end if;
  return new;
end;
$$;

-- An overpaid schedule must still accept unrelated updates. Preserve its
-- original amount as the floor, instead of requiring it to cover the excess.
create or replace function public.protect_invoiced_schedule() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare paid numeric;
begin
  select coalesce(sum(amount), 0) into paid from public.invoices where payment_schedule_id = old.id;
  if paid > 0 and (new.id <> old.id or new.contract_id <> old.contract_id
    or new.due_date <> old.due_date or new.amount < least(old.amount, paid)) then
    raise exception 'Không thể chuyển kỳ thanh toán đã có hóa đơn hoặc giảm số tiền dưới mức đã ghi nhận.' using errcode = '22023';
  end if;
  return new;
end;
$$;

commit;
