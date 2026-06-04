# Layover

A personal flight history dashboard. Rotatable 3D globe with great-circle arcs for every flight, plus a data-dense stats sidebar. React + TypeScript, local-first, no backend for MVP.

## Tech stack
- React + TypeScript, Vite
- Globe.gl (Three.js wrapper) for the 3D globe
- Recharts for charts
- Fuse.js + IATA airport JSON for autocomplete
- Papa Parse for CSV import
- Dexie.js (IndexedDB) for local persistence
- Tailwind CSS + CSS variables for styling

Do not suggest alternative libraries. Use the stack above.

## Project structure
```
src/
  components/
    primitives/     # Button, Badge, AirportInput, PillToggle, DragDropZone
    composed/       # StatCard, FlightRow, AutocompleteRow, DataTableRow, GroupHeader
    layout/         # NavBar, Sidebar, SlideOver
    globe/          # GlobeCanvas, ArcLayer, AirportDotLayer
    charts/         # FlightsPerYearChart, TopRoutesList
  features/
    addFlight/      # AddFlightPanel, SeatClassToggle
    importFlights/  # CSVImport, ImportPreview, ImportSuccess
    flightLog/      # FlightLogPanel
  pages/
    Dashboard.tsx
  data/
    airports.json   # IATA airport database
    db.ts           # Dexie.js schema and helpers
  styles/
    tokens.css      # All CSS variables (source of truth for design tokens)
  types/
    flight.ts
    airport.ts
  utils/
    haversine.ts
    flightStats.ts
```

## Core types
```typescript
// flight.ts
export type SeatClass = 'economy' | 'premium_economy' | 'business' | 'first';

export interface Flight {
  id: string;
  origin: Airport;
  destination: Airport;
  date: string;           // ISO 8601
  airline?: string;
  flightNumber?: string;
  seatClass?: SeatClass;
  distanceMiles?: number; // computed on save via haversine, not at render time
}

// airport.ts
export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}
```

## Design tokens
All tokens live in `src/styles/tokens.css` as CSS variables. Always use `var(--token-name)` — never hardcode hex values, pixel values, or Tailwind color utilities (no `bg-blue-500`).

```
Colors:   --color-bg-base / --color-bg-surface / --color-bg-elevated
          --color-border-default
          --color-text-primary / --color-text-secondary
          --color-accent-blue / --color-accent-amber / --color-accent-teal

Spacing:  --space-xs (4px) / --space-sm (8px) / --space-md (16px)
          --space-lg (24px) / --space-xl (40px)

Radius:   --radius-sm (4px) / --radius-md (8px) / --radius-lg (12px) / --radius-full (999px)
```

## Layout
The globe is always visible — navigation never fully replaces it.
- Globe: ~70% screen width, full viewport height (Globe.gl canvas)
- Sidebar: remaining width, right side — toggles between Stats view and Flight Log view
- Slide-over panels (Add Flight, CSV Import) overlay from the right, do not replace the page

## Key implementation rules
- **Globe:** Globe.gl only. Dark base map. Arcs via `arcsData`, airport dots via `pointsData`. Arc hover highlights the arc and updates selected state in sidebar.
- **Autocomplete:** Fuse.js fuzzy search across IATA code, city, and airport name. Debounce 150ms. Max 6 results.
- **Distance:** Compute with Haversine on flight save. Store as `distanceMiles` on the Flight object. Never recompute at render time.
- **CSV import:** Papa Parse. Required columns: `origin`, `destination`, `date`. Optional: `airline`, `flight_number`, `seat_class`. Validate IATA codes. Show row-level errors inline in preview table — do not silently drop bad rows.
- **Persistence:** All reads/writes go through `src/data/db.ts`. No direct IndexedDB calls elsewhere.

## Code style
- TypeScript strict mode
- Functional components only
- Props interfaces defined above each component
- No `any` types
- Named exports preferred
- Components stay under ~150 lines; extract sub-components when they grow

## Current build status
- [x] Project scaffold (Vite + React + TS + Tailwind)
- [x] Design tokens (tokens.css)
- [x] Primitive components
- [x] Composed components
- [x] Globe canvas
- [x] Dashboard layout
- [ ] Add flight panel
- [ ] CSV import flow
- [ ] Flight log panel

## MVP scope — do not build yet
- Boarding pass PDF parser (V2)
- Shareable public URL (V2)
- Light mode (V2)
- Mobile layout (V2)
- Authentication (out of scope)
- Any backend / Supabase (out of scope for MVP)
