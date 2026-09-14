-- Run after the contract fixture and pending-contract migration in an isolated DB.
begin;
insert into lands(id,name) values ('00000000-0000-4000-8000-000000000003','Pending test land');
insert into plots(id,land_id,plot_number) values
('00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000003','P1'),
('00000000-0000-4000-8000-000000000032','00000000-0000-4000-8000-000000000003','P2');
do $$
declare
  today date := (current_timestamp at time zone 'Asia/Ho_Chi_Minh')::date;
  customer uuid := '00000000-0000-4000-8000-000000000001';
  land uuid := '00000000-0000-4000-8000-000000000003';
  plot uuid := '00000000-0000-4000-8000-000000000031';
begin
  for i in -1..0 loop
    begin
      insert into contracts(customer_id,land_id,plot_ids,rent_amount,due_day,start_date,status)
      values(customer,land,array[plot],1000,5,today+i,'pending');
      raise exception 'Invalid pending date accepted';
    exception when check_violation then null; end;
  end loop;
  insert into contracts(id,customer_id,land_id,plot_ids,rent_amount,due_day,start_date,status)
  values('00000000-0000-4000-8000-000000000131',customer,land,array[plot],1000,5,today+1,'pending');
  begin
    insert into contracts(customer_id,land_id,plot_ids,rent_amount,due_day,start_date,status)
    values(customer,land,array[plot],1000,5,today+2,'pending');
    raise exception 'Duplicate pending reservation accepted';
  exception when unique_violation then null; end;
  begin
    insert into contracts(customer_id,land_id,rent_amount,due_day,start_date,status)
    values(customer,land,1000,5,today,'active');
    raise exception 'Whole-land rental over pending reservation accepted';
  exception when unique_violation then null; end;
  assert public.activate_pending_contracts() = 0, 'Future pending contract activated early';
end;
$$;
-- Simulate the date boundary without waiting a day, only in this rolled-back fixture.
alter table contracts disable trigger contracts_validate_pending_date;
update contracts set start_date=(current_timestamp at time zone 'Asia/Ho_Chi_Minh')::date
where id='00000000-0000-4000-8000-000000000131';
alter table contracts enable trigger contracts_validate_pending_date;
do $$ begin
  assert public.activate_pending_contracts() = 1, 'Due pending contract did not activate';
  assert (select status='active' from contracts where id='00000000-0000-4000-8000-000000000131');
  assert public.activate_pending_contracts() = 0, 'Activation is not idempotent';
  raise notice 'Pending future-date, reservation, activation and repeat-run checks passed.';
end; $$;
rollback;
