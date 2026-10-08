-- Run against a migrated local test database with psql -v ON_ERROR_STOP=1.
-- Fixtures and invoices are rolled back; never use production for tests.
begin;
do $$
declare
  customer uuid := gen_random_uuid();
  land uuid := gen_random_uuid();
  rental uuid := gen_random_uuid();
  request uuid := gen_random_uuid();
  receipt public.invoices%rowtype;
  repeated public.invoices%rowtype;
  total numeric;
  quantity integer;
begin
  insert into public.customers(id,name) values(customer,'Invoice regression test');
  insert into public.lands(id,name) values(land,'Invoice regression test');
  insert into public.contracts(id,customer_id,land_id,plot_ids,rent_amount,due_day,start_date,end_date,status,payment_frequency)
    values(rental,customer,land,'{}',1000,31,'2020-01-01','2020-12-31','completed','monthly');
  set local role service_role;
  receipt := public.pay_contract_invoice(rental,'2020-02-29','2020-03-01',300,request);
  if receipt.amount <> 300 or receipt.payment_date <> '2020-03-01'::date then raise exception 'Partial invoice not saved'; end if;
  repeated := public.pay_contract_invoice(rental,'2020-02-29','2020-03-01',300,request);
  if repeated.id <> receipt.id then raise exception 'Retry created another invoice'; end if;
  select sum(amount),count(*) into total,quantity from public.invoices where payment_schedule_id = receipt.payment_schedule_id;
  if total <> 300 or quantity <> 1 then raise exception 'Retry duplicated payment'; end if;
  begin
    perform public.pay_contract_invoice(rental,'2020-02-29','2020-03-01',301,request);
    raise exception 'Changed retry unexpectedly accepted';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.pay_contract_invoice(rental,'2020-02-29','2020-03-01',701,gen_random_uuid());
    raise exception 'Overpayment unexpectedly accepted';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.pay_contract_invoice(rental,'2020-02-29','2020-03-01',0,gen_random_uuid());
    raise exception 'Zero unexpectedly accepted';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.pay_contract_invoice(rental,'2020-02-29','2020-03-01',-1,gen_random_uuid());
    raise exception 'Negative unexpectedly accepted';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.pay_contract_invoice(rental,'2020-02-29','2020-03-01',0.001,gen_random_uuid());
    raise exception 'Extra decimal places unexpectedly accepted';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.pay_contract_invoice(rental,'2020-02-29','2020-03-01','NaN'::numeric,gen_random_uuid());
    raise exception 'NaN unexpectedly accepted';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.pay_contract_invoice(rental,'2020-02-29',(now() at time zone 'Asia/Ho_Chi_Minh')::date + 1,100,gen_random_uuid());
    raise exception 'Future date unexpectedly accepted';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.pay_contract_invoice(rental,'2020-02-28','2020-03-01',100,gen_random_uuid());
    raise exception 'Non-scheduled date unexpectedly accepted';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.pay_contract_invoice(rental,'2021-01-31','2020-03-01',100,gen_random_uuid());
    raise exception 'Outside contract term unexpectedly accepted';
  exception when sqlstate '22023' then null; end;
  perform public.pay_contract_invoice(rental,'2020-02-29','2020-03-02',700,gen_random_uuid());
  select sum(amount),count(*) into total,quantity from public.invoices where payment_schedule_id = receipt.payment_schedule_id;
  if total <> 1000 or quantity <> 2 then raise exception 'Final installment not saved'; end if;
  -- A lost response to the first installment must still retry safely after full payment.
  repeated := public.pay_contract_invoice(rental,'2020-02-29','2020-03-01',300,request);
  if repeated.id <> receipt.id then raise exception 'Late retry failed'; end if;
  begin
    insert into public.invoices(payment_schedule_id,payment_date,amount) values(receipt.payment_schedule_id,'2020-03-03',1);
    raise exception 'Direct overpayment unexpectedly accepted';
  exception when sqlstate '22023' then null; end;
  begin
    update public.contract_payments set amount = 999 where id = receipt.payment_schedule_id;
    raise exception 'Schedule amount reduced below paid total';
  exception when sqlstate '22023' then null; end;
  if has_table_privilege('anon','public.invoices','UPDATE') or has_table_privilege('anon','public.invoices','DELETE') then
    raise exception 'Invoices should be append-only';
  end if;
  if has_function_privilege('anon','public.record_contract_payment(uuid,date,boolean)','EXECUTE') then
    raise exception 'Legacy toggle should be disabled';
  end if;
  reset role;
end;
$$;
rollback;
