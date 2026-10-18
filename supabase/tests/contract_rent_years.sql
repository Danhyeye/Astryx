-- Run against an isolated migrated test database; everything rolls back.
begin;
do $$
declare
  customer uuid := gen_random_uuid(); land uuid := gen_random_uuid(); rental uuid;
  receipt public.invoices%rowtype; terms jsonb; saved_notes text; scheduled_amount numeric;
begin
  insert into public.customers(id,name) values(customer,'Calendar year regression');
  insert into public.lands(id,name) values(land,'Calendar year regression');
  terms := jsonb_build_object('customer_id',customer,'land_id',land,'rent_amount',10000000,
    'rent_year_basis','calendar','due_day',18,'start_date','2020-10-18','end_date','2025-10-17','status','completed','notes','original');
  set local role service_role;
  rental := public.save_contract_with_rent_years(null,terms,
    '[{"year":2020,"increase_percent":0},{"year":2021,"increase_percent":10},{"year":2022,"increase_percent":20}]');
  if public.contract_rent_on_date(rental,'2020-12-31') <> 10000000
    or public.contract_rent_on_date(rental,'2021-01-01') <> 11000000
    or public.contract_rent_on_date(rental,'2021-12-31') <> 11000000
    or public.contract_rent_on_date(rental,'2022-01-01') <> 12000000
    or public.contract_rent_on_date(rental,'2023-01-01') <> 10000000
  then raise exception 'Calendar year calculation mismatch'; end if;
  receipt := public.pay_contract_invoice(rental,'2021-01-18','2021-01-18',1000000,gen_random_uuid());
  select amount into scheduled_amount from public.contract_payments where id=receipt.payment_schedule_id;
  if scheduled_amount <> 11000000 then raise exception 'Invoice ignored calendar year'; end if;
  -- Rejected duplicates must roll back the parent edit and replaced child rows.
  begin
    perform public.save_contract_with_rent_years(rental,'{"notes":"must roll back"}',
      '[{"year":2021,"increase_percent":30},{"year":2021,"increase_percent":40}]');
    raise exception 'Duplicate years accepted';
  exception when unique_violation then null; end;
  select notes into saved_notes from public.contracts where id=rental;
  if saved_notes <> 'original' or public.contract_rent_on_date(rental,'2021-01-18') <> 11000000 then
    raise exception 'Parent or yearly rows escaped transaction rollback';
  end if;
  begin
    perform public.save_contract_with_rent_years(rental,'{"notes":"must roll back"}',
      '[{"year":2021,"increase_percent":-1}]');
    raise exception 'Negative increase accepted';
  exception when check_violation then null; end;
  perform public.save_contract_with_rent_years(rental,'{"notes":"changed"}',null);
  if public.contract_rent_on_date(rental,'2022-01-18') <> 12000000 then raise exception 'Unrelated patch erased yearly prices'; end if;
  perform public.save_contract_with_rent_years(rental,'{}','[{"year":2021,"increase_percent":50},{"year":2022,"increase_percent":25}]');
  perform public.pay_contract_invoice(rental,'2021-01-18','2021-01-18',1000000,gen_random_uuid());
  select amount into scheduled_amount from public.contract_payments where id=receipt.payment_schedule_id;
  if scheduled_amount <> 11000000 then raise exception 'Recorded amount changed'; end if;
  receipt := public.pay_contract_invoice(rental,'2022-01-18','2022-01-18',1000000,gen_random_uuid());
  select amount into scheduled_amount from public.contract_payments where id=receipt.payment_schedule_id;
  if scheduled_amount <> 12500000 then raise exception 'New invoice ignored updated yearly price'; end if;
  perform public.save_contract_with_rent_years(rental,'{}','[]');
  if public.contract_rent_on_date(rental,'2022-01-01') <> 10000000 then raise exception 'Clearing years did not restore base rent'; end if;
  if has_function_privilege('anon','public.save_contract_with_rent_years(uuid,jsonb,jsonb)','EXECUTE')
    or has_table_privilege('authenticated','public.contract_rent_years','SELECT') then raise exception 'Year settings must be server-only'; end if;
  delete from public.contracts where id=rental;
  if exists(select 1 from public.contract_rent_years where contract_id=rental) then raise exception 'Year settings did not cascade'; end if;
  reset role;
end;
$$;
rollback;
