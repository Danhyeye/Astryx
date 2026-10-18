-- Run against a migrated local test database with psql -v ON_ERROR_STOP=1.
begin;
do $$
declare
  customer uuid := gen_random_uuid();
  land uuid := gen_random_uuid();
  rental uuid := gen_random_uuid();
  receipt public.invoices%rowtype;
  scheduled_amount numeric;
begin
  if public.contract_rent_on_date(10000000,10,'2020-06-15','2021-06-14') <> 10000000
    or public.contract_rent_on_date(10000000,10,'2020-06-15','2021-06-15') <> 11000000
    or public.contract_rent_on_date(10000000,10,'2020-06-15','2022-06-15') <> 12000000
    or public.contract_rent_on_date(10000000,10,'2020-02-29','2021-02-28') <> 11000000
    or public.contract_rent_on_date(100.01,5.25,'2020-01-01','2021-01-01') <> 105.26
  then raise exception 'Annual rent calculation mismatch'; end if;
  insert into public.customers(id,name) values(customer,'Annual increase regression');
  insert into public.lands(id,name) values(land,'Annual increase regression');
  insert into public.contracts(id,customer_id,land_id,plot_ids,rent_amount,due_day,start_date,end_date,status,payment_frequency,annual_rent_increase_percent)
    values(rental,customer,land,'{}',10000000,15,'2020-06-15','2023-06-14','completed','monthly',10);
  set local role service_role;
  receipt := public.pay_contract_invoice(rental,'2021-06-15','2021-06-15',1000000,gen_random_uuid());
  select amount into scheduled_amount from public.contract_payments where id=receipt.payment_schedule_id;
  if scheduled_amount <> 11000000 then raise exception 'Invoice schedule ignored rent increase'; end if;
  update public.contracts set annual_rent_increase_percent=20 where id=rental;
  perform public.pay_contract_invoice(rental,'2021-06-15','2021-06-15',1000000,gen_random_uuid());
  select amount into scheduled_amount from public.contract_payments where id=receipt.payment_schedule_id;
  if scheduled_amount <> 11000000 then raise exception 'Recorded amount changed after rate edit'; end if;
  receipt := public.pay_contract_invoice(rental,'2022-06-15','2022-06-15',1000000,gen_random_uuid());
  select amount into scheduled_amount from public.contract_payments where id=receipt.payment_schedule_id;
  if scheduled_amount <> 14000000 then raise exception 'New payment ignored updated rate'; end if;
  begin
    update public.contracts set annual_rent_increase_percent=-1 where id=rental;
    raise exception 'Negative increase accepted';
  exception when check_violation then null; end;
  if has_function_privilege('anon','public.contract_rent_on_date(numeric,numeric,date,date)','EXECUTE') then
    raise exception 'Rent function should be server-only';
  end if;
  reset role;
end;
$$;
rollback;
