begin;
do $$
declare customer uuid:=gen_random_uuid(); land uuid:=gen_random_uuid(); rental uuid; receipt public.invoices%rowtype; scheduled numeric;
begin
  insert into public.customers(id,name) values(customer,'Anniversary test');
  insert into public.lands(id,name) values(land,'Anniversary test');
  set local role service_role;
  rental:=public.save_contract_with_rent_years(null,jsonb_build_object('customer_id',customer,'land_id',land,
    'rent_amount',10000000,'due_day',18,'start_date','2020-10-18','end_date','2023-10-17','status','completed'),
    '[{"year":1,"increase_percent":0},{"year":2,"increase_percent":10},{"year":3,"increase_percent":20}]');
  if public.contract_rent_on_date(rental,'2021-01-01')<>10000000
    or public.contract_rent_on_date(rental,'2021-10-17')<>10000000
    or public.contract_rent_on_date(rental,'2021-10-18')<>11000000
    or public.contract_rent_on_date(rental,'2022-10-17')<>11000000
    or public.contract_rent_on_date(rental,'2022-10-18')<>12000000
    or public.contract_rental_year('2024-02-29','2025-02-28')<>2
  then raise exception 'Anniversary calculation mismatch'; end if;
  receipt:=public.pay_contract_invoice(rental,'2021-10-18','2021-10-18',1000000,gen_random_uuid());
  select amount into scheduled from public.contract_payments where id=receipt.payment_schedule_id;
  if scheduled<>11000000 then raise exception 'Invoice ignored anniversary rate'; end if;
  perform public.save_contract_with_rent_years(rental,'{}','[{"year":2,"increase_percent":50}]');
  perform public.pay_contract_invoice(rental,'2021-10-18','2021-10-18',1000000,gen_random_uuid());
  select amount into scheduled from public.contract_payments where id=receipt.payment_schedule_id;
  if scheduled<>11000000 then raise exception 'Recorded payment amount changed'; end if;
  begin
    perform public.save_contract_with_rent_years(rental,'{}','[{"year":4,"increase_percent":10}]');
    raise exception 'Year beyond lease accepted';
  exception when check_violation then null; end;
  if public.contract_rent_on_date(rental,'2021-10-18')<>15000000 then raise exception 'Failed update escaped rollback'; end if;
  reset role;
end;
$$;
rollback;
