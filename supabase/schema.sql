-- PATIMATIK database setup (Supabase SQL Editor)
create extension if not exists pgcrypto;

create table if not exists public.stations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address text,
  description text,
  is_active boolean not null default true,
  last_food_at timestamptz,
  last_water_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.refill_events (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id) on delete cascade,
  kind text not null check (kind in ('food', 'water')),
  created_at timestamptz not null default now()
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.stations enable row level security;
alter table public.refill_events enable row level security;
alter table public.admins enable row level security;

create or replace function public.is_patimatik_admin()
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "Anyone can view active stations" on public.stations;
create policy "Anyone can view active stations" on public.stations
for select to anon, authenticated using (is_active = true or public.is_patimatik_admin());

drop policy if exists "Admins manage stations" on public.stations;
create policy "Admins manage stations" on public.stations
for all to authenticated using (public.is_patimatik_admin())
with check (public.is_patimatik_admin());

drop policy if exists "Anyone can view refill events" on public.refill_events;
create policy "Anyone can view refill events" on public.refill_events
for select to anon, authenticated using (true);

drop policy if exists "Anyone can submit a refill report" on public.refill_events;
create policy "Anyone can submit a refill report" on public.refill_events
for insert to anon, authenticated
with check (
  exists (select 1 from public.stations s where s.id = station_id and s.is_active = true)
);

drop policy if exists "Admins manage refill events" on public.refill_events;
create policy "Admins manage refill events" on public.refill_events
for all to authenticated using (public.is_patimatik_admin())
with check (public.is_patimatik_admin());

drop policy if exists "Admins read admin list" on public.admins;
create policy "Admins read admin list" on public.admins
for select to authenticated using (public.is_patimatik_admin());

create or replace function public.apply_refill_event()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if new.kind = 'food' then
    update public.stations set last_food_at = new.created_at where id = new.station_id;
  elsif new.kind = 'water' then
    update public.stations set last_water_at = new.created_at where id = new.station_id;
  end if;
  return new;
end;
$$;

drop trigger if exists refill_event_updates_station on public.refill_events;
create trigger refill_event_updates_station
after insert on public.refill_events
for each row execute function public.apply_refill_event();

-- Realtime publication: ignore if tables are already members.
do $$
begin
  alter publication supabase_realtime add table public.stations;
exception when duplicate_object then null;
when undefined_object then null;
end $$;

-- After creating your first Auth user in Supabase Dashboard > Authentication > Users,
-- run this command with that user's UUID:
-- insert into public.admins (user_id) values ('PASTE-AUTH-USER-UUID-HERE');