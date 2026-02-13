# Ralph 24th Birthday / Lunar New Year App

Frontend app for 24th birthday party + Lunar New Year celebration. Two modes: **Host** and **Guest**.

**Party date:** Feb 15

**Design:** Mobile-first web only. Keep design system consistent and simple; apply across the app.

---

## Guest Mode (no login required)

**Data:** Supabase backend. If session is lost, guest can continue where they left off (same device) — do not treat as new guest.

### UX Flow

1. **Scan QR code** → Entry point
2. **Check-in (Landing page)** → Check in to get free envelope. Needs CTA.
3. **Enter name** (required) and **message to Ralph** (optional)
   - User can write: wish, first impression, roast Ralph, etc.
   - Microcopy: *"Your message may be read aloud before cake cutting"*
   - CTA: **Seal my message**
4. **Zodiac reveal**
   - User enters birth year only (optional) — no date needed
   - Chinese zodiac
   - Reveal their zodiac sign
5. **Red envelope selection**
   - Same envelope design repeated for N prizes (N TBD)
   - User scrolls horizontally to pick envelope
   - Prize order randomized each time
   - User taps → open envelope → show card with prize text
   - Bottom section: win rate % per prize (calculated from prize count + quantity per item)
6. **Party dashboard** ← Back

### Red Envelope & Prizes (TBD)
- Number of prize types + quantity per item to be determined later
- Win rate = calculated per item from those numbers
- Prize displayed as text

---

## Party Dashboard

### Home tab
- Envelopes opened
- Prize messages from people
- Ralph's drink meter (host-only updates)
- **Guest drink add button** (navbar middle): Guest tracks their own drinks. 10 drinks = another red envelope pick (separate from Ralph's tally)

### Frens tab (navbar right)
- Top: User's zodiac sign
- Below: People with same zodiac sign (zodiac buddies)
- Below: Everyone's zodiac sign

---

## Host Mode (hidden URL: `/admin`)

1. Record/add Ralph's drink tally (only host can update)
2. See everyone's message to Ralph (simple list)
