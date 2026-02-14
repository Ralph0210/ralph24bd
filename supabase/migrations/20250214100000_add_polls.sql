-- Polls: guest-created polls with options
create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null,
  question text not null,
  created_at timestamptz default now()
);

create table if not exists poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  label text not null,
  sort_order int default 0
);

create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  option_id uuid not null references poll_options(id) on delete cascade,
  guest_id text not null,
  created_at timestamptz default now(),
  unique(poll_id, guest_id)
);

alter table polls enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;
create policy "Allow all on polls" on polls for all using (true) with check (true);
create policy "Allow all on poll_options" on poll_options for all using (true) with check (true);
create policy "Allow all on poll_votes" on poll_votes for all using (true) with check (true);
