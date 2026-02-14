-- Post likes: one like per guest per post
create table if not exists post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  guest_id text not null,
  created_at timestamptz default now(),
  unique(post_id, guest_id)
);

-- Post comments
create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  guest_id text not null,
  message text not null,
  created_at timestamptz default now()
);

alter table post_likes enable row level security;
alter table post_comments enable row level security;
create policy "Allow all on post_likes" on post_likes for all using (true) with check (true);
create policy "Allow all on post_comments" on post_comments for all using (true) with check (true);
