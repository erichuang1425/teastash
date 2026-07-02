# TeaStash 茶藏

A calm, mobile-first PWA for tracking your matcha and tea collection: remaining grams, per-use logs, and expiry reminders. Guest data stays on your device (IndexedDB + localStorage); optional Supabase auth/sync can mirror it across devices.

## Build & deploy to Netlify Drop

```bash
npm install
npm run build
```

Then drag the generated `dist/` folder onto [Netlify Drop](https://app.netlify.com/drop). The app uses hash-based routing, so no server config or redirects are needed.

To preview the production build locally first:

```bash
npm run preview
```

## Features

- **Inventory:** add/edit/delete tea tins with name, brand, type, tin color, net weight, remaining grams, purchase date, an unopened/opened status toggle, expiry dates, storage location, notes, and a photo (auto-resized before storing). Status filter tabs (All / In Use / Unopened / Finished) include live counts.
- **Opened shelf life as days:** set "use within N days of opening" and TeaStash computes the opened use-by date, with +30/60/90 quick chips and the reference design's `(30 天)` display.
- **Usage records:** log date, time, grams, purpose (usucha / koicha / latte / dessert / other), and notes, with gram quick-pick chips and defaults learned from that tea's last log. Remaining grams update automatically. Editing or deleting a record recalculates stock, with one-tap **Undo**. TeaStash warns when a use exceeds remaining grams.
- **Insights:** per-tea usage pace (g/day, projected days-to-empty, and whether you're on track to finish before the use-by date), a "Use first" badge on the most urgent tin, per-tea stats, a monthly usage chart, and a by-purpose breakdown.
- **History & stats:** usage grouped by day, total grams, average per use, use count, 6-month usage chart, per-tea filter, CSV/JSON export.
- **Reminders:** expiring soon (opened), unopened expiry, and expired sections with day countdowns, plus `.ics` calendar export. Reminders stay in-app.
- **Onboarding tour:** shows once for first-time users (`hasCompletedOnboarding` flag), restartable from Settings.
- **i18n:** full English and Traditional Chinese. Auto-detects `zh-TW` / `zh-HK` / `zh-MO`, switchable and persisted in Settings.
- **PWA:** installable with offline shell caching (Workbox via `vite-plugin-pwa`). "Add to Home Screen" help lives in Settings, with iOS Safari steps and native `beforeinstallprompt` support where available; hidden when already installed.
- **Data safety:** form validation, no negative stock, delete confirmations (Escape / tap-outside to dismiss), JSON backup import with **field-level sanitization** (bad types coerced, out-of-range values clamped, orphan records dropped), and a resettable demo dataset.

## Stack

Vite + React + TypeScript, Tailwind CSS, react-router (hash routing), `idb` for IndexedDB, `vite-plugin-pwa`, lucide-react icons.

## Optional Supabase sync

Run [supabase/setup.sql](supabase/setup.sql) in the Supabase SQL Editor, then set these Netlify environment variables:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Feedback submissions use Netlify Forms via `public/__forms.html`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:5173 |
| `npm run build` | Type-check + production build into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | Lint with oxlint |

## Notes

- Sample data uses fictional names and brands only.
- Language, onboarding, and seed flags live in localStorage; teas and usage records live in IndexedDB, with optional Supabase sync after sign-in.
- Tested layouts: 375px (iPhone SE), 390px (iPhone 13–15), and desktop.

## Contributing

Issues and pull requests are welcome. For local setup, run `npm install`, then `npm run dev`.

Before opening a pull request, run:

```bash
npm run lint
npm run build
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution flow.

## License

TeaStash is released under the [MIT License](LICENSE).
