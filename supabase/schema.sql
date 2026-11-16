-- LifeSMART Toastmasters agenda app: database schema.
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Then run seed.sql to load the starting data.

-- Each table stores one JSON document per row, so the app can evolve without migrations.
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.meetings (
  id text primary key,
  date date not null,
  published boolean not null default false,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists meetings_date_idx on public.meetings (date desc);

create table if not exists public.members (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings for each row execute function public.touch_updated_at();
drop trigger if exists meetings_touch on public.meetings;
create trigger meetings_touch before update on public.meetings for each row execute function public.touch_updated_at();
drop trigger if exists members_touch on public.members;
create trigger members_touch before update on public.members for each row execute function public.touch_updated_at();

-- Row-level security ---------------------------------------------------------
-- Public (anon): read settings and PUBLISHED meetings only. Members (phone, notes) stay private.
-- Signed-in admin: read and write everything. Turn OFF "Allow new users to sign up"
-- (Authentication → Sign In / Providers) so the admin account is the only login.
alter table public.settings enable row level security;
alter table public.meetings enable row level security;
alter table public.members  enable row level security;

drop policy if exists "settings public read" on public.settings;
create policy "settings public read" on public.settings for select using (true);
drop policy if exists "settings admin write" on public.settings;
create policy "settings admin write" on public.settings for all to authenticated using (true) with check (true);

drop policy if exists "meetings public read" on public.meetings;
create policy "meetings public read" on public.meetings for select using (published or auth.role() = 'authenticated');
drop policy if exists "meetings admin write" on public.meetings;
create policy "meetings admin write" on public.meetings for all to authenticated using (true) with check (true);

drop policy if exists "members admin only" on public.members;
create policy "members admin only" on public.members for all to authenticated using (true) with check (true);

-- Poster storage --------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do update set public = true;

drop policy if exists "posters public read" on storage.objects;
create policy "posters public read" on storage.objects for select using (bucket_id = 'posters');
drop policy if exists "posters admin upload" on storage.objects;
create policy "posters admin upload" on storage.objects for insert to authenticated with check (bucket_id = 'posters');
drop policy if exists "posters admin update" on storage.objects;
create policy "posters admin update" on storage.objects for update to authenticated using (bucket_id = 'posters');
drop policy if exists "posters admin delete" on storage.objects;
create policy "posters admin delete" on storage.objects for delete to authenticated using (bucket_id = 'posters');
