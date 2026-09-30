-- IntelliTrex account data. Run this migration in the Supabase SQL Editor.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  avatar_url text not null default '',
  tier text not null default 'free' check (tier in ('free', 'premium')),
  chat_count integer not null default 0 check (chat_count >= 0),
  binance_connected boolean not null default false,
  portfolio_snapshot jsonb,
  portfolio_used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_sessions (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  title text not null default 'Untitled',
  messages jsonb not null default '[]'::jsonb,
  mode text not null default 'active-trader',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.profiles enable row level security;
alter table public.chat_sessions enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
revoke all on public.chat_sessions from anon, authenticated;
grant select, insert, update, delete on public.chat_sessions to authenticated;

drop policy if exists "Users can view their profile" on public.profiles;
create policy "Users can view their profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Users can read their chat sessions" on public.chat_sessions;
create policy "Users can read their chat sessions"
  on public.chat_sessions for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can create their chat sessions" on public.chat_sessions;
create policy "Users can create their chat sessions"
  on public.chat_sessions for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can update their chat sessions" on public.chat_sessions;
create policy "Users can update their chat sessions"
  on public.chat_sessions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their chat sessions" on public.chat_sessions;
create policy "Users can delete their chat sessions"
  on public.chat_sessions for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins can view all chat sessions" on public.chat_sessions;
create policy "Admins can view all chat sessions"
  on public.chat_sessions for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
    set email = coalesce(new.email, ''), updated_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute procedure public.sync_profile_email();

create or replace function public.consume_chat_credit()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_count integer;
begin
  update public.profiles
  set chat_count = chat_count + 1, updated_at = now()
  where id = (select auth.uid())
    and (tier = 'premium' or chat_count < 50)
  returning chat_count into new_count;
  return coalesce(new_count, -1);
end;
$$;

revoke all on function public.consume_chat_credit() from public, anon;
grant execute on function public.consume_chat_credit() to authenticated;

create or replace function public.save_portfolio_snapshot(snapshot jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set portfolio_snapshot = snapshot,
      portfolio_used = true,
      binance_connected = true,
      updated_at = now()
  where id = (select auth.uid())
    and (tier = 'premium' or portfolio_used = false);
  return found;
end;
$$;

revoke all on function public.save_portfolio_snapshot(jsonb) from public, anon;
grant execute on function public.save_portfolio_snapshot(jsonb) to authenticated;

create or replace function public.unlink_binance_portfolio()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set binance_connected = false,
      portfolio_snapshot = null,
      updated_at = now()
  where id = (select auth.uid());
  return found;
end;
$$;

revoke all on function public.unlink_binance_portfolio() from public, anon;
grant execute on function public.unlink_binance_portfolio() to authenticated;

create index if not exists chat_sessions_user_created_idx
  on public.chat_sessions (user_id, created_at desc);
