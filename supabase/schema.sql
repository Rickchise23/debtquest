-- Run this in Supabase → SQL Editor (once per project).
-- Then: Authentication → Providers → Email → enable; optionally disable "Confirm email"
--    for faster testing (re-enable for production).

create table if not exists public.debtquest_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.debtquest_data enable row level security;

create policy "debtquest_data_select_own"
  on public.debtquest_data for select
  using (auth.uid() = user_id);

create policy "debtquest_data_insert_own"
  on public.debtquest_data for insert
  with check (auth.uid() = user_id);

create policy "debtquest_data_update_own"
  on public.debtquest_data for update
  using (auth.uid() = user_id);
