-- Fix prize_picks schema and RLS for Ralph 24 app
-- Run this in Supabase SQL Editor if prizes/recent wins aren't showing

-- Ensure prize_types exists first (required for FK)
create table if not exists prize_types (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  quantity int not null,
  microcopy text,
  rarity text,
  created_at timestamptz default now()
);
alter table prize_types add column if not exists microcopy text;
alter table prize_types add column if not exists rarity text;

-- Ensure prize_picks has all required columns
create table if not exists prize_picks (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null,
  prize_type_id uuid references prize_types(id),
  prize_label text not null,
  prize_microcopy text,
  prize_rarity text,
  picked_at timestamptz default now()
);

-- Add columns if table existed without them (for existing projects)
alter table prize_picks add column if not exists guest_id text;
alter table prize_picks add column if not exists prize_label text;
alter table prize_picks add column if not exists prize_microcopy text;
alter table prize_picks add column if not exists prize_rarity text;
alter table prize_picks add column if not exists picked_at timestamptz default now();

-- Make guest_id not null if we have rows (safe: existing rows may have it)
-- Skip if it would fail - run: alter table prize_picks alter column guest_id set not null;
-- For new tables, the create above handles it

-- Drop existing restrictive policies if any
drop policy if exists "Allow all on prize_picks" on prize_picks;
drop policy if exists "Enable read access for all users" on prize_picks;
drop policy if exists "Enable insert for all users" on prize_picks;

-- Recreate permissive policy (anon key needs this for read/write)
create policy "Allow all on prize_picks"
  on prize_picks for all
  using (true)
  with check (true);

-- Ensure RLS is enabled but policy allows access
alter table prize_picks enable row level security;
