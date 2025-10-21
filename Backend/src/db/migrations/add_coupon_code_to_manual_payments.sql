alter table public.manual_payments
  add column if not exists coupon_code text;

create index if not exists idx_manual_payments_coupon on public.manual_payments(coupon_code);
