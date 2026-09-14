begin;
insert into lands(id,name) values ('00000000-0000-4000-8000-000000000099','Payment test');
do $$
declare rental_id uuid; payment_time timestamptz;
begin
 insert into contracts(customer_id,land_id,rent_amount,due_day,start_date,end_date)
 values('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000099',12345,15,'2026-01-01','2026-12-31') returning id into rental_id;
 perform public.record_contract_payment(rental_id,'2026-01-15',true);
 select paid_at into payment_time from contract_payments where contract_id=rental_id;
 assert payment_time is not null;
 assert (select status='paid' and amount=12345 from contract_payments where contract_id=rental_id);
 perform public.record_contract_payment(rental_id,'2026-01-15',true);
 assert (select count(*)=1 from contract_payments where contract_id=rental_id);
 assert (select paid_at=payment_time from contract_payments where contract_id=rental_id);
 perform public.record_contract_payment(rental_id,'2026-01-15',false);
 assert (select paid_at is null and status<>'paid' from contract_payments where contract_id=rental_id);
 begin
  perform public.record_contract_payment(rental_id,'2027-01-15',true);
  raise exception 'Out-of-term payment accepted';
 exception when invalid_parameter_value then null; end;
 raise notice 'Paid, unpaid, repeated saves, amounts, timestamps, and invalid-date checks passed.';
end $$;
rollback;
