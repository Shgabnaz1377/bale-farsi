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

-- ─────────────────────────────────────────────────────────────────────────────
-- Accounts v2: profiles, the owner's admin page, blocking.
-- Safe to run again. After you sign up in the app, make yourself the owner (admin) with:
--   update public.profiles set role = 'admin' where email = 'YOUR EMAIL';
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  name       text not null default '',
  role       text not null default 'learner' check (role in ('learner', 'admin')),
  blocked    boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen  timestamptz
);
alter table public.profiles enable row level security;

-- A profile for every new sign-up (name comes from the sign-up form), and for anyone who signed up before.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, coalesce(new.email, ''), left(coalesce(new.raw_user_meta_data ->> 'name', ''), 80))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
insert into public.profiles (id, email, created_at)
  select id, coalesce(email, ''), created_at from auth.users on conflict (id) do nothing;

-- Is the caller an (unblocked) admin? security definer so policies can use it without recursion.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin' and not blocked)
$$;
create or replace function public.is_blocked() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select blocked from public.profiles where id = (select auth.uid())), false)
$$;

-- Learners read their own profile and may change only their name and last_seen; admins read all.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id or (select public.is_admin()));
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, last_seen) on public.profiles to authenticated;

-- Blocked learners can no longer save progress; admins can read everyone's progress.
drop policy if exists "insert own progress" on public.progress;
create policy "insert own progress" on public.progress
  for insert to authenticated with check ((select auth.uid()) = user_id and not (select public.is_blocked()));
drop policy if exists "update own progress" on public.progress;
create policy "update own progress" on public.progress
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and not (select public.is_blocked()));
drop policy if exists "admin reads all progress" on public.progress;
create policy "admin reads all progress" on public.progress
  for select to authenticated using ((select public.is_admin()));

-- The admin page: every learner with their numbers. Only admins get rows.
create or replace function public.admin_users()
returns table (id uuid, email text, name text, role text, blocked boolean, created_at timestamptz, last_seen timestamptz,
               xp int, streak int, lessons int, days jsonb)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  return query
    select p.id, p.email, p.name, p.role, p.blocked, p.created_at, p.last_seen,
           coalesce((g.data ->> 'xp')::int, 0), coalesce((g.data ->> 'streak')::int, 0),
           coalesce((select count(*)::int from jsonb_object_keys(coalesce(g.data -> 'done', '{}'::jsonb))), 0),
           coalesce(g.data -> 'days', '{}'::jsonb)
    from public.profiles p left join public.progress g on g.user_id = p.id
    order by p.last_seen desc nulls last;
end $$;

create or replace function public.admin_set_blocked(target uuid, value boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  if target = (select auth.uid()) then raise exception 'you cannot block yourself'; end if;
  update public.profiles set blocked = value where id = target;
end $$;

create or replace function public.admin_set_role(target uuid, value text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  if target = (select auth.uid()) and value <> 'admin' then raise exception 'you cannot remove your own admin role'; end if;
  update public.profiles set role = value where id = target;
end $$;

create or replace function public.admin_delete_user(target uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  if target = (select auth.uid()) then raise exception 'you cannot delete yourself here'; end if;
  delete from auth.users where id = target;  -- cascades to profiles and progress
end $$;

-- Any learner can delete their own account (and with it their profile and progress).
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from auth.users where id = (select auth.uid());
end $$;

revoke execute on function public.admin_users(), public.admin_set_blocked(uuid, boolean), public.admin_set_role(uuid, text),
  public.admin_delete_user(uuid), public.delete_my_account(), public.is_admin(), public.is_blocked(), public.handle_new_user() from public, anon;
grant execute on function public.admin_users(), public.admin_set_blocked(uuid, boolean), public.admin_set_role(uuid, text),
  public.admin_delete_user(uuid), public.delete_my_account(), public.is_admin(), public.is_blocked() to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Pronunciation feedback: learners flag a clip that sounds wrong; reviewers (native speakers)
-- go through clips with ✓ / ✗ / the right Finglish. Safe to run again.
-- Make someone a reviewer on the owner page, or:  update public.profiles set role = 'reviewer' where email = '…';
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('learner', 'reviewer', 'admin'));

create or replace function public.is_reviewer() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('reviewer', 'admin') and not blocked)
$$;

create table if not exists public.pron_feedback (
  id           bigint generated always as identity primary key,
  -- 'report': a learner says a clip sounds wrong; 'review': a reviewer's verdict on a clip.
  kind         text not null check (kind in ('report', 'review')),
  clip_key     text not null check (length(clip_key) between 1 and 200),
  fa           text not null check (length(fa) between 1 and 500),
  tr           text not null default '' check (length(tr) <= 500),
  voice        text not null default '' check (length(voice) <= 10),
  verdict      text not null check (verdict in ('ok', 'wrong')),
  suggested_tr text not null default '' check (length(suggested_tr) <= 500),
  comment      text not null default '' check (length(comment) <= 1000),
  user_id      uuid default auth.uid() references auth.users (id) on delete set null,
  status       text not null default 'open' check (status in ('open', 'done', 'dismissed')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (kind, clip_key, user_id)
);
alter table public.pron_feedback enable row level security;

drop policy if exists "read feedback" on public.pron_feedback;
create policy "read feedback" on public.pron_feedback
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_reviewer()));
drop policy if exists "add feedback" on public.pron_feedback;
create policy "add feedback" on public.pron_feedback
  for insert to authenticated with check (
    user_id = (select auth.uid()) and not (select public.is_blocked()) and status = 'open'
    and ((kind = 'report' and verdict = 'wrong') or (kind = 'review' and (select public.is_reviewer())))
  );
drop policy if exists "change feedback" on public.pron_feedback;
create policy "change feedback" on public.pron_feedback
  for update to authenticated
  using ((select public.is_reviewer()) or (user_id = (select auth.uid()) and kind = 'report' and status = 'open'))
  with check ((select public.is_reviewer()) or (user_id = (select auth.uid()) and kind = 'report' and verdict = 'wrong' and status = 'open'));
drop policy if exists "admin deletes feedback" on public.pron_feedback;
create policy "admin deletes feedback" on public.pron_feedback
  for delete to authenticated using ((select public.is_admin()));

revoke insert, update, delete on public.pron_feedback from anon, authenticated;
grant select, delete on public.pron_feedback to authenticated;
grant insert (kind, clip_key, fa, tr, voice, verdict, suggested_tr, comment, user_id, status) on public.pron_feedback to authenticated;
grant update (verdict, suggested_tr, comment, status, updated_at) on public.pron_feedback to authenticated;

-- No flooding: at most 100 reports a day per learner.
create or replace function public.limit_reports() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.kind = 'report' and (select count(*) from public.pron_feedback
      where user_id = new.user_id and kind = 'report' and created_at > now() - interval '1 day') >= 100 then
    raise exception 'too many reports today';
  end if;
  return new;
end $$;
drop trigger if exists limit_reports on public.pron_feedback;
create trigger limit_reports before insert on public.pron_feedback for each row execute function public.limit_reports();

-- Who wrote what, for reviewers and the owner.
drop function if exists public.pron_feedback_list();
create or replace function public.pron_feedback_list()
returns table (id bigint, kind text, clip_key text, fa text, tr text, voice text, verdict text, suggested_tr text,
               comment text, status text, created_at timestamptz, updated_at timestamptz, who text, who_role text, mine boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_reviewer() then raise exception 'not allowed' using errcode = '42501'; end if;
  return query
    select f.id, f.kind, f.clip_key, f.fa, f.tr, f.voice, f.verdict, f.suggested_tr, f.comment, f.status, f.created_at, f.updated_at,
           coalesce(nullif(p.name, ''), p.email, ''), coalesce(p.role, ''), f.user_id = (select auth.uid())
    from public.pron_feedback f left join public.profiles p on p.id = f.user_id
    order by f.updated_at desc;
end $$;

revoke execute on function public.is_reviewer(), public.pron_feedback_list(), public.limit_reports() from public, anon;
grant execute on function public.is_reviewer(), public.pron_feedback_list() to authenticated;
