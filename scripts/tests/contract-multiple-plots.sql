-- Run against the temporary test fixture; all mutations roll back.
begin;
do $$
declare
  land_a uuid := '00000000-0000-4000-8000-000000000001';
  plot_a uuid := '00000000-0000-4000-8000-000000000011';
  plot_b uuid := '00000000-0000-4000-8000-000000000012';
  foreign_plot uuid := '00000000-0000-4000-8000-000000000021';
  contract_a uuid := '00000000-0000-4000-8000-000000000101';
begin
  assert (select land_id = land_a and plot_ids = array[plot_a] and plot_id is null from contracts where id=contract_a), 'Legacy contract migration';
  update contracts set plot_ids=array[plot_a,plot_b] where id=contract_a;
  assert (select count(*)=2 from contract_plots where contract_id=contract_a), 'Multiple relations saved';
  update plots set status='rented' where id=plot_a;
  update contracts set plot_ids=array[plot_a,plot_b] where id=contract_a;
  begin
    update contracts set plot_ids=array[foreign_plot] where id=contract_a;
    raise exception 'Wrong land accepted';
  exception when check_violation then null; end;
  begin
    update contracts set plot_ids=array[plot_a,plot_a] where id=contract_a;
    raise exception 'Duplicate plots accepted';
  exception when check_violation then null; end;
  begin
    insert into contracts(customer_id,land_id,plot_ids,rent_amount,due_day,start_date)
    values(land_a,land_a,array[plot_b],1000,5,'2026-10-01');
    raise exception 'Double booking accepted';
  exception when unique_violation then null; end;
  begin
    insert into contracts(customer_id,land_id,rent_amount,due_day,start_date)
    values(land_a,land_a,1000,5,'2026-10-01');
    raise exception 'Whole land with occupied plots accepted';
  exception when unique_violation then null; end;
  begin
    update plots set land_id='00000000-0000-4000-8000-000000000002' where id=plot_a;
    raise exception 'Reparenting a contracted plot accepted';
  exception when check_violation then null; end;
  begin
    delete from plots where id=plot_b;
    raise exception 'Deleting a contracted plot accepted';
  exception when foreign_key_violation then null; end;
  update contracts set status='cancelled' where id=contract_a;
  update plots set status='available' where id=plot_a;
  insert into contracts(customer_id,land_id,rent_amount,due_day,start_date)
  values(land_a,land_a,1000,5,'2026-10-01');
  begin
    insert into contracts(customer_id,land_id,plot_ids,rent_amount,due_day,start_date)
    values(land_a,land_a,array[plot_b],1000,5,'2026-10-01');
    raise exception 'Plot rental under an occupied whole land accepted';
  exception when unique_violation then null; end;
  raise notice 'All migration, relation, edit, availability and whole-land checks passed.';
end;
$$;
rollback;
