-- Add participation type: in_person or remote
alter table guests add column if not exists participation text default 'in_person';
