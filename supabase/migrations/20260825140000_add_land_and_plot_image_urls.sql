alter table public.lands
  add column if not exists image_url text;

alter table public.plots
  add column if not exists image_url text;
