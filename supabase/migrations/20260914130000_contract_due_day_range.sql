begin;

alter table public.contracts
  drop constraint contracts_due_day_check,
  add constraint contracts_due_day_check check (due_day between 1 and 31),
  drop constraint contracts_payment_due_day_check,
  add constraint contracts_payment_due_day_check
    check (payment_due_day is null or payment_due_day between 1 and 31);

commit;
