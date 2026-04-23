-- 1. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  language_pref text not null default 'en' check (language_pref in ('hi', 'en')),
  avg_cycle_length integer not null default 28 check (avg_cycle_length between 15 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Make policy creation safe to re-run
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

-- NOTE: Your trigger below references `username` but your table does NOT have `username`.
-- Fix either by adding `username` column OR removing it from the INSERT.
-- For now, I've removed `username` to match your current table definition.

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


-- 2. PERIOD LOGS
create table if not exists public.period_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date,
  flow_intensity integer not null default 3 check (flow_intensity between 1 and 5),
  created_at timestamptz not null default now()
);

create index if not exists idx_period_logs_user_date on public.period_logs (user_id, start_date desc);

alter table public.period_logs enable row level security;

drop policy if exists "Users can view own period logs" on public.period_logs;
create policy "Users can view own period logs"
on public.period_logs
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own period logs" on public.period_logs;
create policy "Users can insert own period logs"
on public.period_logs
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own period logs" on public.period_logs;
create policy "Users can update own period logs"
on public.period_logs
for update
using (auth.uid() = user_id);

drop policy if exists "Users can delete own period logs" on public.period_logs;
create policy "Users can delete own period logs"
on public.period_logs
for delete
using (auth.uid() = user_id);


-- 3. MOOD LOGS
create table if not exists public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  mood_score integer not null check (mood_score between 1 and 5),
  energy integer not null default 3 check (energy between 1 and 5),
  symptoms text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_mood_logs_user_date on public.mood_logs (user_id, date desc);

alter table public.mood_logs enable row level security;

drop policy if exists "Users can view own mood logs" on public.mood_logs;
create policy "Users can view own mood logs"
on public.mood_logs
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own mood logs" on public.mood_logs;
create policy "Users can insert own mood logs"
on public.mood_logs
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own mood logs" on public.mood_logs;
create policy "Users can update own mood logs"
on public.mood_logs
for update
using (auth.uid() = user_id);

drop policy if exists "Users can delete own mood logs" on public.mood_logs;
create policy "Users can delete own mood logs"
on public.mood_logs
for delete
using (auth.uid() = user_id);


-- 4. CHAT HISTORY
create table if not exists public.chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_history_user_time on public.chat_history (user_id, created_at desc);

alter table public.chat_history enable row level security;

drop policy if exists "Users can view own chat history" on public.chat_history;
create policy "Users can view own chat history"
on public.chat_history
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own chat history" on public.chat_history;
create policy "Users can insert own chat history"
on public.chat_history
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own chat history" on public.chat_history;
create policy "Users can delete own chat history"
on public.chat_history
for delete
using (auth.uid() = user_id);