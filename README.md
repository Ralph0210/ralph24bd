# Ralph's 24th Birthday / Lunar New Year App

Mobile-first web app for a birthday + LNY party. Guest flow: check-in → name + message → zodiac reveal → red envelope pick → party dashboard. Host mode at `/admin`.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the schema in **SQL Editor**:

```bash
# Copy contents of supabase/schema.sql and run in Supabase SQL Editor
```

3. Create `.env.local`:

```bash
cp .env.example .env.local
```

4. Add your Supabase credentials from **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Routes

| Path | Description |
|------|-------------|
| `/` | Landing, check-in CTA |
| `/checkin/name` | Name + message to Ralph |
| `/checkin/zodiac` | Birth year → Chinese zodiac |
| `/checkin/envelope` | Pick red envelope, reveal prize |
| `/dashboard` | Party home (envelopes, prizes, Ralph's drinks) |
| `/dashboard/drinks` | Add your drinks (10 = another envelope pick) |
| `/dashboard/frens` | Zodiac buddies, everyone's signs |
| `/admin` | Host only: Ralph's drink tally, all messages |

### Prizes (TBD)

Add prize types in Supabase:

```sql
insert into prize_types (label, quantity) values
  ('Good luck', 10),
  ('Fortune cookie', 5),
  -- add more...
```

Win rates are calculated automatically. If no prize_types exist, placeholder prizes are used.
