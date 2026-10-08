-- Run after all migrations on a local test database.
begin;
do $$
declare
  relation record;
  routine record;
  role_name text;
begin
  foreach role_name in array array['anon', 'authenticated'] loop
    for relation in select tablename from pg_tables where schemaname = 'public' loop
      if has_table_privilege(role_name, format('public.%I', relation.tablename), 'SELECT,INSERT,UPDATE,DELETE') then
        raise exception '% still has access to %', role_name, relation.tablename;
      end if;
    end loop;
    for routine in select p.oid, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' loop
      if has_function_privilege(role_name, routine.oid, 'EXECUTE') then
        raise exception '% can still execute %', role_name, routine.proname;
      end if;
    end loop;
  end loop;
  if not has_table_privilege('service_role', 'public.contracts', 'SELECT,INSERT,UPDATE,DELETE') or
     not has_function_privilege('service_role', 'public.pay_contract_invoice(uuid,date,date,numeric,uuid)', 'EXECUTE') then
    raise exception 'Server access is missing';
  end if;
  if exists(select 1 from storage.buckets where id in ('land-images', 'contract-file') and public) then
    raise exception 'App storage is still public';
  end if;
end;
$$;
rollback;
