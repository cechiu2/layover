# Layover

Layover is a personal flight history dashboard and travel atlas built with React, TypeScript, Vite, Globe.gl, Recharts, Dexie, Papa Parse, Fuse.js, and Tailwind CSS.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Current Build

- Persistent Globe.gl canvas with animated route arcs and visited airport dots.
- Stats sidebar with totals, flights-per-year chart, and top routes.
- Flight log view grouped by year.
- Add-flight slide-over with airport autocomplete and local IndexedDB persistence.
- CSV import slide-over with required-column validation and row-level errors.

## Data Note

`src/data/airports.json` currently contains an expanded starter set of common airports for local development. Replace it with the full IATA airport dataset before broad CSV import testing.
