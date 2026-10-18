begin;

-- Compare existing and new phone numbers using the same domestic/+84 key.
-- This does not rewrite stored contacts or customer records.
create function public.customer_phone_key(p_phone text)
returns text language sql immutable strict parallel safe set search_path = '' as $$
  with compact as (
    select regexp_replace(p_phone, '[[:space:]().-]', '', 'g') as phone
  )
  select nullif(case when left(phone, 3) = '+84' then '0' || substr(phone, 4) else phone end, '')
  from compact;
$$;
revoke all on function public.customer_phone_key(text) from public, anon, authenticated;
grant execute on function public.customer_phone_key(text) to service_role;

-- Unique indexes provide an atomic check, including simultaneous submissions.
-- NULL/blank contacts do not conflict with other missing contacts.
create unique index customers_phone_unique on public.customers (public.customer_phone_key(phone));
create unique index customers_email_unique on public.customers ((nullif(lower(btrim(email)), '')));

commit;
