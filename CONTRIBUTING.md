# Contributing

Thanks for taking a look at TeaStash.

## Local setup

```bash
npm install
npm run dev
```

The app runs on Vite. It stores guest data in IndexedDB and localStorage, with optional Supabase sync when environment variables are present.

## Before a pull request

Run these checks:

```bash
npm run lint
npm run build
```

Keep pull requests focused on one change. If a change affects storage, sync, import/export, or inventory math, include a short note about the data path you tested.

## Reporting issues

When reporting a bug, include the browser, device size, language setting, and the steps that reproduce the problem. Screenshots help for layout bugs.
