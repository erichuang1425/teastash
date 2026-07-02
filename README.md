# TeaStash 茶藏

A calm, mobile-first PWA for tracking your matcha and tea collection: remaining grams, per-use logs, and expiry reminders. All data stays on your device (IndexedDB + localStorage) — no server, no account, no tracking.

## Build & deploy to Netlify Drop

```bash
npm install
npm run build
```

Then drag the generated `dist/` folder onto [Netlify Drop](https://app.netlify.com/drop). Done — no server config or redirects needed (the app uses hash-based routing).

To preview the production build locally first:

```bash
npm run preview
```

## Features

- **Inventory** — add/edit/delete tea tins with name, brand, type, tin color, net weight, remaining grams, purchase date, an unopened/opened status toggle, expiry dates, storage location, notes, and a photo (auto-resized before storing). Status filter tabs (All / In Use / Unopened / Finished) with live counts.
- **Opened shelf life as days** — set "use within N days of opening" and the opened use-by date is computed for you (with +30/60/90 quick chips), matching the reference design's `(30 天)` display.
- **Usage records** — log date, time, grams, purpose (usucha / koicha / latte / dessert / other), and notes, with gram quick-pick chips and smart defaults learned from that tea's last log. Remaining grams update automatically; editing or deleting a record recalculates stock, with one-tap **Undo**. Warns when a use exceeds remaining grams.
- **Insights** — per-tea usage pace (g/day, projected days-to-empty, and whether you're on track to finish before the use-by date), a "Use first" badge on the most urgent tin, per-tea stats, plus a monthly usage chart and a by-purpose breakdown.
- **History & stats** — usage grouped by day, total grams, average per use, use count, 6-month usage chart, per-tea filter, CSV/JSON export.
- **Reminders** — expiring soon (opened), unopened expiry, and expired sections with day countdowns, plus `.ics` calendar export. In-app only — no fake push notifications.
- **Onboarding tour** — shows once for first-time users (`hasCompletedOnboarding` flag), restartable from Settings.
- **i18n** — full English and Traditional Chinese. Auto-detects `zh-TW` / `zh-HK` / `zh-MO`, switchable and persisted in Settings.
- **PWA** — installable with offline shell caching (Workbox via `vite-plugin-pwa`). "Add to Home Screen" help lives unobtrusively in Settings, with iOS Safari step-by-step instructions and native `beforeinstallprompt` support where available; hidden when already installed.
- **Data safety** — form validation, no negative stock, delete confirmations (Escape / tap-outside to dismiss), JSON backup import with **field-level sanitization** (bad types coerced, out-of-range values clamped, orphan records dropped), and a resettable demo dataset.

## Stack

Vite + React + TypeScript, Tailwind CSS, react-router (hash routing), `idb` for IndexedDB, `vite-plugin-pwa`, lucide-react icons.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:5173 |
| `npm run build` | Type-check + production build into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | Lint with oxlint |

## Notes

- Sample data uses fictional names and brands only.
- Language, onboarding, and seed flags live in localStorage; teas and usage records live in IndexedDB.
- Tested layouts: 375px (iPhone SE), 390px (iPhone 13–15), and desktop.
