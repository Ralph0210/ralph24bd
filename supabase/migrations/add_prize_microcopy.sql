-- Run this if you already have prize_types/prize_picks and need to add microcopy/rarity
-- In Supabase SQL Editor:

alter table prize_types add column if not exists microcopy text;
alter table prize_types add column if not exists rarity text;
alter table prize_picks add column if not exists prize_microcopy text;
alter table prize_picks add column if not exists prize_rarity text;
