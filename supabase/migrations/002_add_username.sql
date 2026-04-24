-- Ensure the column exists if not already added by 001_schema.sql
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='username') then
    alter table public.profiles add column username text;
  end if;
end $$;

-- Update existing profiles to set username from display_name or email
update public.profiles
set username = coalesce(display_name, split_part((select email from auth.users where id = profiles.id), '@', 1))
where username is null;

-- Make username not null and unique
alter table public.profiles alter column username set not null;
alter table public.profiles add constraint profiles_username_key unique (username);