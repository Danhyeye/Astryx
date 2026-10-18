-- Run against a migrated local test database with psql -v ON_ERROR_STOP=1.
begin;
do $$
declare
  customer uuid := gen_random_uuid();
  land uuid := gen_random_uuid();
  rental uuid;
  frequency text;
  month_step integer;
  due date;
  frequencies text[] := array['monthly','every_2_months','quarterly','every_4_months','every_5_months','every_6_months','every_7_months','every_8_months','every_9_months','every_10_months','every_11_months','yearly'];
begin
  insert into public.customers(id,name) values(customer,'Month interval regression');
  insert into public.lands(id,name) values(land,'Month interval regression');
  set local role service_role;
  for month_step in 1..12 loop
    rental := gen_random_uuid();
    frequency := frequencies[month_step];
    insert into public.contracts(id,customer_id,land_id,plot_ids,rent_amount,due_day,start_date,end_date,status,payment_frequency)
      values(rental,customer,land,'{}',1000,31,'2020-01-01','2021-12-31','completed',frequency);
    due := (date '2020-01-01' + make_interval(months => month_step + 1) - interval '1 day')::date;
    perform public.pay_contract_invoice(rental,due,due,1000,gen_random_uuid());
    if month_step > 1 then
      begin
        perform public.pay_contract_invoice(rental,'2020-02-29','2020-02-29',1000,gen_random_uuid());
        raise exception 'Off-cycle date accepted for %', frequency;
      exception when sqlstate '22023' then null; end;
    end if;
  end loop;
  reset role;
end;
$$;
rollback;
