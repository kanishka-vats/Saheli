-- Add username column to profiles
alter table public.profiles add column username text;

-- Update existing profiles to set username from display_name or email
update public.profiles
set username = coalesce(display_name, split_part((select email from auth.users where id = profiles.id), '@', 1))
where username is null;

-- Make username not null with default
alter table public.profiles alter column username set not null;