# TeaStash

TeaStash is a mobile-first drink tracker for tea-first caffeine habits. It tracks cups, caffeine, spend, sugar, optional photos, and homemade brewing notes.

New accounts start empty. The normal app flow does not load sample cups, sample photos, or fake statistics.

## App Flow

- Logged-out users land on `/` and see the product page.
- `/login` and `/register` handle Supabase auth.
- Signed-in users enter `/app`.
- Tracker, day detail, add/edit drink, statistics, and settings routes are protected behind auth.
- A saved Supabase session skips the public landing flow on refresh.

## Tracker

- Calendar dashboard with month navigation and soft day tiles.
- Add Drink form with date, time, optional photo, optional name, drink type, size, caffeine, spend, sugar, homemade toggle, brewing details, and notes.
- Day detail with cups, caffeine, sugar, spend, and record cards.
- Statistics with week, month, and year filters plus a one-time drink cluster animation.
- Settings for account sync, language, logout, and clearing drink records.

## Data

Drink records are stored locally in IndexedDB by `userId` and synced to Supabase when configured. Remote reads, writes, updates, and deletes use `user_id` filters, with row-level security in `supabase/setup.sql`.

Run the SQL in `supabase/setup.sql` after creating a Supabase project. The older tea inventory tables remain in the setup file for backward compatibility, but the active tracker uses `drink_records`.

Required environment variables:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

## Development

```bash
npm install
npm run dev
npm run build
npm run lint
```

On Windows PowerShell, use `npm.cmd run build` or `npm.cmd run lint` if script execution blocks the `npm.ps1` shim.
