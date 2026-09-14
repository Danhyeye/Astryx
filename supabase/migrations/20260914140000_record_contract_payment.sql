begin;

create or replace function public.record_contract_payment(p_contract_id uuid, p_due_date date, p_paid boolean)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  rental public.contracts%rowtype;
  payment_status text;
begin
  if p_due_date is null or p_paid is null then
    raise exception 'Ngày đến hạn và trạng thái thanh toán là bắt buộc.' using errcode = '22023';
  end if;
  -- Serialize simultaneous edits, including the first payment for a due date.
  select * into rental from public.contracts where id = p_contract_id for update;
  if not found then
    raise exception 'Không tìm thấy hợp đồng.' using errcode = 'P0002';
  end if;
  payment_status := case when p_paid then 'paid'
    when p_due_date < (now() at time zone 'Asia/Ho_Chi_Minh')::date then 'overdue' else 'pending' end;
  update public.contract_payments
    set status = payment_status,
        paid_at = case when p_paid then coalesce(paid_at, now()) else null end
    where contract_id = p_contract_id and due_date = p_due_date;
  if not found then
    if rental.status = 'cancelled' or p_due_date < rental.start_date
      or p_due_date > public.contract_rental_end(rental.start_date, rental.end_date, rental.lease_duration_months) then
      raise exception 'Ngày thanh toán nằm ngoài thời hạn hợp đồng.' using errcode = '22023';
    end if;
    insert into public.contract_payments (contract_id, due_date, amount, status, paid_at)
    values (p_contract_id, p_due_date, rental.rent_amount, payment_status, case when p_paid then now() else null end);
  end if;
end;
$$;
revoke all on function public.record_contract_payment(uuid, date, boolean) from public, anon;
grant execute on function public.record_contract_payment(uuid, date, boolean) to anon, authenticated;
commit;
