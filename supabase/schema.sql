-- Car Pool MVP - Kanha Shanti Vanam Community
-- Run this in Supabase SQL Editor after creating a project

-- Profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  display_name text not null default 'Rider',
  show_phone boolean not null default true,
  is_driver boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- For existing projects: add show_phone if you already ran the schema before
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_phone boolean NOT NULL DEFAULT true;

-- Rides offered by drivers
create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  from_place text not null,
  to_place text not null,
  from_lat double precision,
  from_lng double precision,
  to_lat double precision,
  to_lng double precision,
  departure_time timestamptz not null,
  seats_available int not null default 3 check (seats_available >= 1),
  status text not null default 'scheduled' check (status in ('scheduled', 'active', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Requests from riders to join a ride
create table if not exists public.ride_requests (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  pickup_place text,
  pickup_lat double precision,
  pickup_lng double precision,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique(ride_id, user_id)
);

-- Live driver location (one row per active ride; driver updates via app)
create table if not exists public.driver_locations (
  ride_id uuid primary key references public.rides(id) on delete cascade,
  driver_id uuid not null references public.profiles(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_rides_driver on public.rides(driver_id);
create index if not exists idx_rides_departure on public.rides(departure_time);
create index if not exists idx_rides_status on public.rides(status);
create index if not exists idx_ride_requests_ride on public.ride_requests(ride_id);
create index if not exists idx_ride_requests_user on public.ride_requests(user_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.rides enable row level security;
alter table public.ride_requests enable row level security;
alter table public.driver_locations enable row level security;

-- Profiles: users can read all (to see driver names), update own
create policy "Profiles read" on public.profiles for select using (true);
create policy "Profiles update own" on public.profiles for update using (auth.uid() = id);
create policy "Profiles insert own" on public.profiles for insert with check (auth.uid() = id);

-- Rides: anyone authenticated can read; only driver can insert/update/delete own
create policy "Rides read" on public.rides for select using (auth.role() = 'authenticated');
create policy "Rides insert own" on public.rides for insert with check (auth.uid() = driver_id);
create policy "Rides update own" on public.rides for update using (auth.uid() = driver_id);
create policy "Rides delete own" on public.rides for delete using (auth.uid() = driver_id);

-- Ride requests: riders can create; driver and requester can read; driver can update status
create policy "Requests read" on public.ride_requests for select using (auth.role() = 'authenticated');
create policy "Requests insert" on public.ride_requests for insert with check (auth.uid() = user_id);
create policy "Requests update driver" on public.ride_requests for update using (
  exists (select 1 from public.rides r where r.id = ride_id and r.driver_id = auth.uid())
);
create policy "Requests delete own" on public.ride_requests for delete using (auth.uid() = user_id);

-- Driver locations: driver can upsert own; riders approved for that ride can read
create policy "Locations read ride participants" on public.driver_locations for select using (
  auth.uid() = driver_id
  or exists (
    select 1 from public.ride_requests rr
    where rr.ride_id = driver_locations.ride_id and rr.user_id = auth.uid() and rr.status = 'approved'
  )
);
create policy "Locations upsert driver" on public.driver_locations for all using (
  auth.uid() = driver_id
);

-- Create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Rider'));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Realtime: allow subscribing to driver_locations for approved riders
alter publication supabase_realtime add table public.driver_locations;
