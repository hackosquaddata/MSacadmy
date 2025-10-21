-- Create support_ticket_comments table
create table if not exists public.support_ticket_comments (
  id bigint generated always as identity primary key,
  ticket_id bigint not null references public.support_tickets(id) on delete cascade,
  author_id uuid not null,
  author_is_admin boolean not null default false,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_stc_ticket on public.support_ticket_comments(ticket_id);
create index if not exists idx_stc_author on public.support_ticket_comments(author_id);
create index if not exists idx_stc_created on public.support_ticket_comments(created_at desc);
