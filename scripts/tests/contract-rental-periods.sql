begin;
insert into lands(id,name) values ('00000000-0000-4000-8000-000000000004','Period test');
insert into plots(id,land_id,plot_number) values
('00000000-0000-4000-8000-000000000041','00000000-0000-4000-8000-000000000004','D1'),
('00000000-0000-4000-8000-000000000042','00000000-0000-4000-8000-000000000004','D2');
do $$
declare
  customer uuid := '00000000-0000-4000-8000-000000000001';
  land uuid := '00000000-0000-4000-8000-000000000004';
  plot uuid := '00000000-0000-4000-8000-000000000041';
  other_plot uuid := '00000000-0000-4000-8000-000000000042';
  first_id uuid;
  next_id uuid;
begin
  insert into contracts(customer_id,land_id,plot_ids,rent_amount,due_day,start_date,end_date)
  values(customer,land,array[plot],1000,5,'2026-09-15','2027-09-15') returning id into first_id;
  insert into contracts(customer_id,land_id,plot_ids,rent_amount,due_day,start_date,end_date,status)
  values(customer,land,array[plot],1000,5,'2027-09-16','2028-09-15','pending') returning id into next_id;
  begin
    update contracts set start_date='2027-09-15' where id=next_id;
    raise exception 'Same-day boundary overlap accepted';
  exception when unique_violation then null; end;
  begin
    update contracts set end_date='2027-09-16' where id=first_id;
    raise exception 'End-date edit overlap accepted';
  exception when unique_violation then null; end;
  begin
    update contracts set end_date=null, lease_duration_months=24 where id=first_id;
    raise exception 'Duration-derived overlap accepted';
  exception when unique_violation then null; end;
  insert into contracts(customer_id,land_id,plot_ids,rent_amount,due_day,start_date,end_date)
  values(customer,land,array[other_plot],1000,5,'2026-09-15','2027-09-15');
  begin
    insert into contracts(customer_id,land_id,rent_amount,due_day,start_date,end_date)
    values(customer,land,1000,5,'2027-09-01','2027-10-01');
    raise exception 'Whole-land overlap accepted';
  exception when unique_violation then null; end;
  insert into contracts(customer_id,land_id,rent_amount,due_day,start_date,end_date)
  values(customer,land,1000,5,'2029-01-01','2029-12-31');
  update plots set status='rented' where id=plot;
  insert into contracts(customer_id,land_id,plot_ids,rent_amount,due_day,start_date,end_date)
  values(customer,land,array[plot],1000,5,'2028-09-16','2028-12-31');
  insert into contracts(customer_id,land_id,plot_ids,rent_amount,due_day,start_date)
  values(customer,land,array[other_plot],1000,5,'2030-01-01');
  begin
    insert into contracts(customer_id,land_id,plot_ids,rent_amount,due_day,start_date)
    values(customer,land,array[other_plot],1000,5,'2031-01-01');
    raise exception 'Open-ended overlap accepted';
  exception when unique_violation then null; end;
  assert public.contract_rental_end('2026-09-15',null,12)='2027-09-14'::date;
  assert public.contract_rental_end('2027-01-31',null,1)='2027-02-27'::date;
  raise notice 'Next-day renewal, overlaps, date edits, duration, separate plots and whole-land checks passed.';
end; $$;
rollback;
