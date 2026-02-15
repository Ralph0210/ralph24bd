-- Ralph 24th Birthday – Full schema for Supabase
-- Run this in: Supabase Dashboard → SQL Editor → New query → paste and Run
-- This creates tables and RLS policies needed for the app (including host profile on /admin)

-- Guests (includes avatar_url for profile photo, participation for in-person/remote)
create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  guest_id text unique not null,
  name text not null,
  avatar_url text,
  message_to_ralph text,
  birth_year int,
  zodiac_sign text,
  drink_count int default 0,
  envelope_picks_used int default 0,
  participation text default 'in_person',
  checked_in_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table guests add column if not exists avatar_url text;
alter table guests add column if not exists participation text default 'in_person';

-- RLS for guests – must allow anon to read/write (host profile, check-in, etc.)
alter table guests enable row level security;
drop policy if exists "Allow all on guests" on guests;
create policy "Allow all on guests" on guests for all using (true) with check (true);

-- Party state
create table if not exists party_state (
  id uuid primary key default gen_random_uuid(),
  ralph_drink_count int default 0,
  updated_at timestamptz default now()
);
insert into party_state (ralph_drink_count) select 0 where not exists (select 1 from party_state limit 1);
alter table party_state enable row level security;
drop policy if exists "Allow all on party_state" on party_state;
create policy "Allow all on party_state" on party_state for all using (true) with check (true);

-- Prize types & picks
create table if not exists prize_types (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  quantity int not null,
  microcopy text,
  rarity text,
  created_at timestamptz default now()
);
create table if not exists prize_picks (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null,
  prize_type_id uuid references prize_types(id),
  prize_label text not null,
  prize_microcopy text,
  prize_rarity text,
  picked_at timestamptz default now()
);
alter table prize_types enable row level security;
alter table prize_picks enable row level security;
drop policy if exists "Allow all on prize_types" on prize_types;
create policy "Allow all on prize_types" on prize_types for all using (true) with check (true);
drop policy if exists "Allow all on prize_picks" on prize_picks;
create policy "Allow all on prize_picks" on prize_picks for all using (true) with check (true);

-- Posts
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null references guests(guest_id) on delete cascade,
  message text not null,
  photo_urls text[] default '{}',
  created_at timestamptz default now()
);
alter table posts enable row level security;
drop policy if exists "Allow all on posts" on posts;
create policy "Allow all on posts" on posts for all using (true) with check (true);

-- Post likes & comments
create table if not exists post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  guest_id text not null,
  created_at timestamptz default now(),
  unique(post_id, guest_id)
);
create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  guest_id text not null,
  message text not null,
  created_at timestamptz default now()
);
alter table post_likes enable row level security;
alter table post_comments enable row level security;
drop policy if exists "Allow all on post_likes" on post_likes;
create policy "Allow all on post_likes" on post_likes for all using (true) with check (true);
drop policy if exists "Allow all on post_comments" on post_comments;
create policy "Allow all on post_comments" on post_comments for all using (true) with check (true);

-- Polls
create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null references guests(guest_id) on delete cascade,
  question text not null,
  created_at timestamptz default now()
);
create table if not exists poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  label text not null,
  sort_order int not null default 0
);
create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  option_id uuid not null references poll_options(id) on delete cascade,
  guest_id text not null,
  unique(poll_id, guest_id)
);
alter table polls enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;
drop policy if exists "Allow all on polls" on polls;
create policy "Allow all on polls" on polls for all using (true) with check (true);
drop policy if exists "Allow all on poll_options" on poll_options;
create policy "Allow all on poll_options" on poll_options for all using (true) with check (true);
drop policy if exists "Allow all on poll_votes" on poll_votes;
create policy "Allow all on poll_votes" on poll_votes for all using (true) with check (true);

-- Storage: avatars + posts buckets
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('posts', 'posts', true) on conflict (id) do nothing;
drop policy if exists "Allow avatar uploads" on storage.objects;
create policy "Allow avatar uploads" on storage.objects for insert to public with check (bucket_id = 'avatars');
drop policy if exists "Allow avatar reads" on storage.objects;
create policy "Allow avatar reads" on storage.objects for select to public using (bucket_id = 'avatars');
drop policy if exists "Allow avatar updates" on storage.objects;
create policy "Allow avatar updates" on storage.objects for update to public using (bucket_id = 'avatars') with check (bucket_id = 'avatars');
drop policy if exists "Allow post photo uploads" on storage.objects;
create policy "Allow post photo uploads" on storage.objects for insert to public with check (bucket_id = 'posts');
drop policy if exists "Allow post photo reads" on storage.objects;
create policy "Allow post photo reads" on storage.objects for select to public using (bucket_id = 'posts');
drop policy if exists "Allow post photo updates" on storage.objects;
create policy "Allow post photo updates" on storage.objects for update to public using (bucket_id = 'posts') with check (bucket_id = 'posts');
