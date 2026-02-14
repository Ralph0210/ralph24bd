-- Posts: guest messages with optional photos
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null references guests(guest_id) on delete cascade,
  message text not null,
  photo_urls text[] default '{}',
  created_at timestamptz default now()
);

alter table posts enable row level security;
create policy "Allow all on posts" on posts for all using (true) with check (true);

-- Create posts storage bucket for post photos
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

drop policy if exists "Allow post photo uploads" on storage.objects;
create policy "Allow post photo uploads"
  on storage.objects for insert
  to public
  with check (bucket_id = 'posts');

drop policy if exists "Allow post photo reads" on storage.objects;
create policy "Allow post photo reads"
  on storage.objects for select
  to public
  using (bucket_id = 'posts');

drop policy if exists "Allow post photo updates" on storage.objects;
create policy "Allow post photo updates"
  on storage.objects for update
  to public
  using (bucket_id = 'posts')
  with check (bucket_id = 'posts');
