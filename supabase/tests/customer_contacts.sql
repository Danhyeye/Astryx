-- Run only against a migrated local test database. Fixtures are rolled back.
begin;
do $$
declare first_id uuid; second_id uuid; constraint_name text;
begin
  insert into public.customers(name, phone, email)
    values ('Contact uniqueness test', '0912345678', 'Owner+tag@Example.com') returning id into first_id;
  begin
    insert into public.customers(name, phone) values ('Same phone', '+84 (912) 345-678');
    raise exception 'Equivalent phone was accepted';
  exception when unique_violation then
    get stacked diagnostics constraint_name = constraint_name;
    if constraint_name <> 'customers_phone_unique' then raise exception 'Wrong phone constraint'; end if;
  end;
  begin
    insert into public.customers(name, email) values ('Same email', ' owner+tag@example.com ');
    raise exception 'Equivalent email was accepted';
  exception when unique_violation then
    get stacked diagnostics constraint_name = constraint_name;
    if constraint_name <> 'customers_email_unique' then raise exception 'Wrong email constraint'; end if;
  end;
  insert into public.customers(name, phone, email)
    values ('Different contacts', '0987654321', 'owner+tag2@example.com') returning id into second_id;
  update public.customers set phone = '+84 912 345 678', email = 'owner+tag@example.com' where id = first_id;
  begin
    update public.customers set phone = '0912345678' where id = second_id;
    raise exception 'Update to an existing phone was accepted';
  exception when unique_violation then null; end;
  begin
    update public.customers set email = 'OWNER+TAG@example.com' where id = second_id;
    raise exception 'Update to an existing email was accepted';
  exception when unique_violation then null; end;
  insert into public.customers(name, phone, email) values
    ('No contacts 1', null, null), ('No contacts 2', null, null),
    ('Blank contacts 1', '', ' '), ('Blank contacts 2', ' ', '');
end;
$$;
rollback;
