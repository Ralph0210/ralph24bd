-- Ralph 24th Birthday / LNY App - Supabase Schema
-- Run this in Supabase SQL Editor after creating your project

-- Guests: check-in data, persisted by guest_id (stored in localStorage)
create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  guest_id text unique not null,  -- client-generated, stored in localStorage for session recovery
  name text not null,
  message_to_ralph text,
  birth_year int,
  zodiac_sign text,
  drink_count int default 0,
  envelope_picks_used int default 0,
  checked_in_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Party-global: Ralph's drink tally (host-only updates)
create table if not exists party_state (
  id uuid primary key default gen_random_uuid(),
  ralph_drink_count int default 0,
  updated_at timestamptz default now()
);

-- Seed single row for party state (run once)
insert into party_state (ralph_drink_count)
select 0 where not exists (select 1 from party_state limit 1);

-- Prizes: config (TBD - you'll add prize types + quantities later)
create table if not exists prize_types (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  quantity int not null,  -- how many of this prize exist
  created_at timestamptz default now()
);

-- Prize picks: which guest got which prize (linked to guest by guest_id)
create table if not exists prize_picks (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null,
  prize_type_id uuid references prize_types(id),
  prize_label text not null,  -- denormalized for display
  picked_at timestamptz default now()
);

-- Enable RLS (optional - adjust policies based on your auth strategy)
alter table guests enable row level security;
alter table party_state enable row level security;
alter table prize_types enable row level security;
alter table prize_picks enable row level security;

-- Allow anonymous read/write for now (guests don't have auth)
-- In production, you may want stricter policies
create policy "Allow all on guests" on guests for all using (true) with check (true);
create policy "Allow all on prize_picks" on prize_picks for all using (true) with check (true);
create policy "Allow all on prize_types" on prize_types for all using (true) with check (true);
create policy "Allow all on party_state" on party_state for all using (true) with check (true);
