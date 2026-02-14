-- Add avatar_url to guests for optional profile photo
alter table guests add column if not exists avatar_url text;

-- Create avatars storage bucket (if your Supabase supports it)
-- If this fails, create the bucket manually: Dashboard > Storage > New bucket > name: avatars, public: true
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow anonymous upload/read for avatars bucket
drop policy if exists "Allow avatar uploads" on storage.objects;
create policy "Allow avatar uploads"
  on storage.objects for insert
  to public
  with check (bucket_id = 'avatars');

drop policy if exists "Allow avatar reads" on storage.objects;
create policy "Allow avatar reads"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

-- Allow update for upsert (overwrite same path)
drop policy if exists "Allow avatar updates" on storage.objects;
create policy "Allow avatar updates"
  on storage.objects for update
  to public
  using (bucket_id = 'avatars')
  with check (bucket_id = 'avatars');
