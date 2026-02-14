# Party Day Checklist (Feb 15, 4pm Seattle)

## Before Deployment

- [ ] **Party date**: Verify `src/lib/party-start.ts` has `2025-02-15T16:00:00-08:00`
- [ ] **Run tests**: `npm run test` (party-start logic)
- [ ] **Verify party gate**: `npm run verify-party` (optional sanity check)
- [ ] **Build**: `npm run build` — must succeed (needs network for fonts)

## Environment (Vercel)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Optional: `NEXT_PUBLIC_PARTY_START_ISO` to override (e.g. for testing countdown)

## Behavior at 4pm Feb 15 Seattle

- **Before 4pm**: Landing shows countdown; `/checkin` and `/dashboard` redirect to `/`
- **At 4pm**: Check-in unlocks; guests can use full flow
- **Admin** (`/admin`): Always accessible regardless of time

## Local Testing (see countdown)

If your system date is past Feb 15 2025, add to `.env.local`:
```
NEXT_PUBLIC_PARTY_START_ISO=2026-02-15T16:00:00-08:00
```
Then restart dev server.
