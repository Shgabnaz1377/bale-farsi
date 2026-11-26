-- Bale: one row of saved progress per learner.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.

create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row level security: each signed-in learner can read and write only their own row.
alter table public.progress enable row level security;

drop policy if exists "read own progress" on public.progress;
create policy "read own progress" on public.progress
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "insert own progress" on public.progress;
create policy "insert own progress" on public.progress
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "update own progress" on public.progress;
create policy "update own progress" on public.progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "delete own progress" on public.progress;
create policy "delete own progress" on public.progress
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Keep a saved progress document to a sane size (about 1 MB).
alter table public.progress drop constraint if exists progress_size;
alter table public.progress add constraint progress_size check (pg_column_size(data) < 1000000);
