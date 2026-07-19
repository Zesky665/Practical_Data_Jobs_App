-- Practical_Data_Jobs_App — initial schema (M1)
-- One table: profiles (one row per auth user, auto-created on signup).
-- This is a minimal stub (id + created_at). Future attributes (display name,
-- role, etc.) land here as later migrations — do NOT add them here.

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, auto-created on signup.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Per-user profile. Stub — future attributes (display name, role, etc.) land as later migrations.';

-- Auto-create a profile row whenever a new auth user is created.
-- Standard Supabase handle_new_user pattern.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- A user can read and update their own row. (There's nothing user-editable yet,
-- but the policy is in place for when attributes are added.)
create policy "profiles: select own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
