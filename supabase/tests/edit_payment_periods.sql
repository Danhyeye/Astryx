-- Run against a migrated local test database. All fixtures are rolled back.
begin;
do $$
declare customer uuid := gen_random_uuid(); land uuid := gen_random_uuid(); rental uuid := gen_random_uuid();
  scheduled public.contract_payments%rowtype; receipt public.invoices%rowtype;
begin
  insert into public.customers(id,name) values(customer,'Edit payment regression');
  insert into public.lands(id,name) values(land,'Edit payment regression');
  insert into public.contracts(id,customer_id,land_id,plot_ids,rent_amount,due_day,start_date,end_date,status,payment_frequency)
    values(rental,customer,land,'{}',1000,15,'2020-01-01','2020-12-31','completed','monthly');
  set local role service_role;
  scheduled := public.edit_contract_payment(rental,'2020-01-15','2020-01-20',1200,1000);
  assert scheduled.original_due_date = '2020-01-15'::date;
  receipt := public.pay_contract_invoice(rental,'2020-01-20','2020-01-20',500,gen_random_uuid());
  scheduled := public.edit_contract_payment(rental,'2020-01-20','2020-01-25',1500,1200);
  assert scheduled.id = receipt.payment_schedule_id;
  assert scheduled.original_due_date = '2020-01-15'::date;
  assert (select count(*) = 1 and sum(amount) = 500 from public.invoices where payment_schedule_id = scheduled.id);
  begin
    perform public.edit_contract_payment(rental,'2020-01-25','2020-01-25',400,1500);
    raise exception 'Reduction below receipts accepted';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.edit_contract_payment(rental,'2020-01-25','2020-01-26',1600,1200);
    raise exception 'Stale amount accepted';
  exception when sqlstate '40001' then null; end;
  begin
    perform public.pay_contract_invoice(rental,'2020-01-15','2020-01-20',100,gen_random_uuid());
    raise exception 'Original moved date recreated';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.edit_contract_payment(rental,'2020-01-15','2020-01-26',1600,1000);
    raise exception 'Stale date accepted';
  exception when sqlstate '40001' then null; end;
  begin
    perform public.edit_contract_payment(rental,'2020-01-25','2021-01-01',1600,1500);
    raise exception 'Out of term date accepted';
  exception when sqlstate '22023' then null; end;
  perform public.edit_contract_payment(rental,'2020-02-15','2020-02-15',2000,1000);
  begin
    perform public.edit_contract_payment(rental,'2020-01-25','2020-02-15',1500,1500);
    raise exception 'Duplicate due date accepted';
  exception when unique_violation then null; end;
  perform public.pay_contract_invoice(rental,'2020-01-25','2020-01-25',2000,gen_random_uuid());
  scheduled := public.edit_contract_payment(rental,'2020-01-25','2020-01-26',1500,1500);
  assert scheduled.amount = 1500;
  assert (select sum(amount) = 2500 from public.invoices where payment_schedule_id = scheduled.id);
  reset role;
end;
$$;
rollback;
