create table if not exists public.flights (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid,
  leg_index integer,
  origin jsonb not null,
  destination jsonb not null,
  date date not null,
  airline text,
  flight_number text,
  seat_class text check (seat_class in ('economy', 'premium_economy', 'business', 'first')),
  aircraft_type text,
  departure_time text,
  arrival_time text,
  flight_duration text,
  layover_minutes integer,
  distance_miles double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists flights_user_date_idx on public.flights (user_id, date desc);

alter table public.flights enable row level security;

drop policy if exists "Users can read their own flights" on public.flights;
drop policy if exists "Users can insert their own flights" on public.flights;
drop policy if exists "Users can update their own flights" on public.flights;
drop policy if exists "Users can delete their own flights" on public.flights;

create policy "Users can read their own flights"
on public.flights
for select
using (user_id = auth.uid());

create policy "Users can insert their own flights"
on public.flights
for insert
with check (user_id = auth.uid());

create policy "Users can update their own flights"
on public.flights
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own flights"
on public.flights
for delete
using (user_id = auth.uid());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_flights_updated_at on public.flights;

create trigger set_flights_updated_at
before update on public.flights
for each row
execute function public.set_updated_at();
