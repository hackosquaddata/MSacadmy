-- Coupons table to store discount codes server-side
create table if not exists public.coupons (
  code text primary key,
  discount_percent integer not null check (discount_percent >= 0 and discount_percent <= 100),
  active boolean not null default true,
  valid_from timestamptz null,
  valid_to timestamptz null,
  usage_limit integer null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed common coupons (idempotent)
insert into public.coupons (code, discount_percent, active)
values
  ('MS10', 10, true),
  ('MS20', 20, true),
  ('AIKTC90', 90, true),
  ('MIT85', 85, true)
on conflict (code) do nothing;
