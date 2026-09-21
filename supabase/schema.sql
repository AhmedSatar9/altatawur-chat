-- ==========================================
-- التطور چات
-- Database Schema
-- ==========================================

create extension if not exists pgcrypto;

-- ==========================================
-- USERS PROFILE
-- ==========================================

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text not null unique,
    email text not null unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ==========================================
-- ENABLE RLS
-- ==========================================

alter table public.profiles enable row level security;

-- ==========================================
-- POLICIES
-- ==========================================

drop policy if exists "Users can view their own profile"
on public.profiles;

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);


drop policy if exists "Users can update their own profile"
on public.profiles;

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);


drop policy if exists "Users can insert their own profile"
on public.profiles;

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

-- ==========================================
-- AUTOMATIC PROFILE CREATION
-- ==========================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

    insert into public.profiles (
        id,
        username,
        email
    )
    values (
        new.id,
        coalesce(
            new.raw_user_meta_data->>'username',
            split_part(new.email, '@', 1)
        ),
        new.email
    );

    return new;

end;
$$;

-- ==========================================
-- TRIGGER
-- ==========================================

drop trigger if exists on_auth_user_created
on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

-- ==========================================
-- GRANTS
-- ==========================================

grant select, update on public.profiles to authenticated;
grant insert on public.profiles to authenticated;
