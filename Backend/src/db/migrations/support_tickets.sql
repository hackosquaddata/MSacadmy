-- Create support_tickets table
create table if not exists public.support_tickets (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  name text,
  email text,
  type text not null default 'other',
  message text not null,
  status text not null default 'active', -- active | resolved | closed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Useful indexes
create index if not exists idx_support_tickets_user on public.support_tickets(user_id);
create index if not exists idx_support_tickets_status on public.support_tickets(status);
create index if not exists idx_support_tickets_created on public.support_tickets(created_at desc);

-- Optional: basic check constraints
alter table public.support_tickets
  add constraint chk_support_type check (type in ('payment','course_activation','exam','other'));

alter table public.support_tickets
  add constraint chk_support_status check (status in ('active','resolved','closed'));
