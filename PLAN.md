# Layover — Full Feature Plan

This plan covers all work across six areas: autofill, airport coverage, duration accuracy, account/persistence, rich imports, route grouping, and sharing. Tasks are ordered roughly by dependency — F (auth) must precede I (share). All others are independent.

---

## Task A — Implement /api/flight-lookup via AeroDataBox ✓ (implemented)

**What:** Wire up the existing frontend autofill to a real flight data API.  
**Context:** `AddFlightPanel.tsx` already calls `/api/flight-lookup` and handles the response via `applyLookupMatch()` — it fills destination, times, duration, and aircraft.

**Why AeroDataBox over AviationStack:** AviationStack's free tier only covers real-time (currently airborne) flights — historical lookups require their Basic plan ($50/month). AeroDataBox via RapidAPI provides 100 free requests/month including historical flight data, which is sufficient for a personal flight log.

**Approach:** A `configureServer` Vite plugin in `vite.config.ts` intercepts `POST /api/flight-lookup` and proxies to AeroDataBox server-side (keeping the API key off the client).

**Setup (one-time):**
1. Create a free account at rapidapi.com
2. Subscribe to the AeroDataBox API (free tier — 100 req/month)
3. Copy your RapidAPI key
4. Create `.env` at the project root with: `VITE_AERODATABOX_KEY=your_key_here`
5. Restart the dev server

**AeroDataBox endpoint:** `GET https://aerodatabox.p.rapidapi.com/flights/number/{flightIata}/{date}`
- Headers: `X-RapidAPI-Key`, `X-RapidAPI-Host: aerodatabox.p.rapidapi.com`
- `flightIata` = `${carrierCode}${flightNumber}` (e.g., `AA100`)
- `date` = `YYYY-MM-DD`
- Returns an array; filter to entries where `departure.airport.iata` matches `originIata`

**Response mapping to `FlightLookupMatch`:**
- `departure.airport.iata` → `originIata`
- `arrival.airport.iata` → `destinationIata`
- `departure.scheduledTime.local` → extract HH:mm → `departureTime`
- `arrival.scheduledTime.local` → extract HH:mm → `arrivalTime`
- UTC times diff → `durationMinutes`
- `aircraft.model` → `aircraftType`
- `airline.iata` → `carrierCode`

**Files:**
- `vite.config.ts` — `aeroDataBoxLookupPlugin` (replaces old AviationStack plugin)
- `.env.example` — `VITE_AERODATABOX_KEY=`
- `src/features/addFlight/flightLookup.ts` — no changes needed (response shape unchanged)

**Production note (Task F):** The Vite plugin is dev-only. When deploying with Supabase (Task F), move this proxy to a Supabase Edge Function and swap the fetch URL in `flightLookup.ts` from `/api/flight-lookup` to the Edge Function URL.

---

## Task B — Expand airports.json to global coverage ✓ (implemented)

**What:** Replace the 84-entry file (~76% US) with ~3,000 globally distributed airports.

**Approach:** Write a one-off script `scripts/build-airports.ts` that fetches the OurAirports dataset (`airports.csv`, public domain), filters to IATA-coded `large_airport` and `medium_airport` entries with valid coordinates, and writes to `src/data/airports.json` in the existing shape `{ iata, name, city, country, lat, lon }`.

**Files:**
- `scripts/build-airports.ts` — new build script (not shipped to users)
- `src/data/airports.json` — replaced output
- `src/data/airports.ts` (`findAirportByIata`) — no changes needed; same lookup logic

**Fuse.js note:** The existing `AirportInput` uses `threshold: 0.3`, max 6 results — scales fine to thousands of entries with no changes.

---

## Task C — Fix timeInAirHours to use actual stored durations ✓ (implemented)

**What:** Replace the `totalMiles / 500` air-time estimate with a sum of stored `flightDuration` values.

**Files:**
- `src/utils/flightStats.ts` — add `parseDurationMinutes(s: string): number` helper (parses "5h 30m" → 330) and use it in `calculateFlightStats`. Fall back to `distanceMiles / 500 * 60` per flight only when `flightDuration` is absent.

---

## Task D — Auto-compute flight duration from departure + arrival times ✓ (implemented)

**What:** When both times are entered in the Add Flight form and duration is still empty, auto-fill duration.

**Files:**
- `src/features/addFlight/AddFlightPanel.tsx` — add a `useEffect` per leg that watches `departureTime` and `arrivalTime`. When both are set and both duration fields are empty, compute the diff in minutes, add 1440 if arrival < departure (cross-midnight), then call `splitDurationMinutes` and `updateLeg`.

---

## Task E — Show +1 day indicator for overnight flights ✓ (implemented)

**What:** When `arrivalTime < departureTime` on a leg, render a subtle "+1" badge next to the arrival time input.

**Files:**
- `src/features/addFlight/AddFlightPanel.tsx` — conditionally render a `+1` span beside the arrival `<Input>` when both times are non-empty and arrival is earlier.

---

## Task F — Account system and cloud persistence (Supabase) ✓ (implemented)

**What:** Let users sign up / log in so their flight data persists across devices and browser sessions.  
**Context:** Currently data lives only in IndexedDB (Dexie). CLAUDE.md listed auth and Supabase as out-of-scope for MVP — that scope is now expanding.

**Approach:**
- **Auth:** Supabase Auth — email/password + Google OAuth. A lightweight auth context (`src/auth/AuthProvider.tsx`) wraps the app and exposes `user`, `signIn`, `signUp`, `signOut`.
- **Database:** Supabase PostgreSQL table `flights` mirroring the `Flight` type. Row-Level Security: users can only read/write rows where `user_id = auth.uid()`.
- **Local cache:** Keep Dexie for offline-first feel. On sign-in, do a one-time sync: push existing Dexie flights to Supabase, then switch all reads/writes to Supabase. When signed out, fall back to Dexie-only.
- **`src/data/db.ts`:** Add a `syncToSupabase(flights)` helper and update `saveTrip` / `deleteFlight` to write to Supabase when a session exists.

**New files:**
- `src/auth/AuthProvider.tsx` — Supabase auth context
- `src/auth/LoginPanel.tsx` — sign-in / sign-up slide-over (same slide-over pattern as AddFlightPanel)
- `src/data/supabase.ts` — Supabase client, typed query helpers
- `supabase/migrations/001_flights.sql` — table + RLS policies
- `.env` — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

**Nav change:** Add a small avatar/login button to `NavBar` (top-right). When signed in, show initials + sign-out option.

**Dependency:** Task I (share) depends on this task.

---

## Task G — Enhanced flight imports: Flighty CSV, ICS files, Google Calendar

**What:** Add three new import sources beyond the generic CSV. All funnel into the existing `onImport(FlightInput[])` callback — no changes to the downstream save logic.

The existing `CSVImport.tsx` stays as-is for the generic format. The new sources appear as additional options on the import screen.

### G1 — Flighty CSV

Flighty exports a CSV with different column names than the app's generic format. Map Flighty columns to `FlightInput`:

| Flighty column | Maps to |
|---|---|
| `Departure Airport` | `origin` (IATA lookup) |
| `Arrival Airport` | `destination` |
| `Departure Date` | `date` |
| `Departure Time (Local)` | `departureTime` |
| `Arrival Time (Local)` | `arrivalTime` |
| `Flight Number` | split into `airline` + `flightNumber` |
| `Aircraft` | `aircraftType` |
| `Cabin` | `seatClass` (normalize to enum) |

**Files:**
- `src/features/importFlights/FlightyImport.tsx` — new component, same `DragDropZone → ImportPreview → ImportSuccess` flow but with Flighty column mapping
- `src/features/importFlights/parseFlighty.ts` — column mapping and normalization logic

### G2 — ICS / calendar file import

Many calendar apps (Apple Calendar, Outlook, Google Calendar export) can export `.ics` files. Flight events added from email confirmation often follow a consistent pattern.

**Approach:** Parse `.ics` files with a lightweight parser (ical.js or hand-rolled VEVENT extractor). Extract `SUMMARY`, `DTSTART`, `DTEND`, `LOCATION`, `DESCRIPTION` from each VEVENT and use heuristics to identify flight events (IATA codes in summary/location, airline patterns).

**Files:**
- `src/features/importFlights/ICSImport.tsx` — drop zone accepting `.ics` files
- `src/features/importFlights/parseICS.ts` — VEVENT extractor + flight heuristics, outputs `Partial<FlightInput>[]` for user review in ImportPreview

**Note:** ICS parsing is best-effort — not all calendar entries will parse cleanly. The ImportPreview error display (already exists) handles bad rows gracefully.

### G3 — Google Calendar API import

**Approach:** Google OAuth popup (separate from Supabase auth — use Google Identity Services library). Once authorized, fetch calendar events from the Calendar API filtered by a date range the user selects. Run the same flight-detection heuristics as G2 on the event summaries/descriptions.

**Files:**
- `src/features/importFlights/GoogleCalendarImport.tsx` — OAuth trigger, date range picker, calls Calendar API, passes events through flight heuristics, then into ImportPreview
- `.env` — `VITE_GOOGLE_CLIENT_ID`

**Note:** Requires enabling the Google Calendar API in a Google Cloud project and providing a client ID. Document setup steps in the app's import UI.

---

## Task H — Route-grouped flight cards  ✓ (implemented)

**What:** When a user clicks on a flight entry in the flight log, show a route card that aggregates all flights on that same route — instead of a separate card per individual flight.

**Context:** Flights are stored individually (correct). Grouping is purely at the display layer. The globe still shows one arc per individual flight; clicking an arc or a log entry opens the route card.

**Route key:** `[origin.iata, destination.iata].sort().join('-')` (same as `topRoutes` in `flightStats.ts`).

**Route card contents:**
- Route header: `SEA → JFK` with airport city names
- "Flown X times" count
- Most recent flight's details (date, airline, flight number, aircraft, seat class, duration, distance)
- History list: all individual instances, sorted newest-first, each showing date + airline + flight number + seat class

**Files:**
- `src/components/composed/FlightDetailPanel.tsx` — extend to accept either a single `Flight` or an array of `Flight[]` (same route). When given an array, render the aggregated view.
- `src/pages/Dashboard.tsx` — change `selectedFlight: Flight | null` state to `selectedRoute: Flight[] | null`. On flight click (from globe arc or log row), find all flights with the same route key and pass them to `FlightDetailPanel`.
- `src/globe/GlobeCanvas.tsx` — arc click already calls back with the flight; Dashboard now groups from there.
- `src/components/layout/Sidebar.tsx` — same change: log row click passes route key up.

---

## Task I — Static shareable link (read-only globe + stats)

**What:** Authenticated users can generate a public URL (e.g., `/share/[userId]`) that lets anyone view their globe and stats in read-only mode — no editing, no adding flights.

**Depends on:** Task F (Supabase auth + cloud data).

**Approach:**
- Add a `is_public` boolean to the Supabase user profile table. Default false.
- A "Share" button in the Sidebar footer (only shown when signed in) toggles `is_public` and shows the shareable URL.
- Supabase RLS: add a policy so `flights` rows are readable by anyone when the owner's `is_public = true`.
- Route `/share/:userId` renders a `ShareView` page: same `GlobeCanvas` + `Sidebar` but with all write actions removed (no AddFlight button, no delete, no CSV import).

**Files:**
- `src/pages/ShareView.tsx` — read-only Dashboard variant; fetches flights for the given userId
- `src/components/layout/Sidebar.tsx` — add `isReadOnly` prop that hides add/delete controls
- `src/globe/GlobeCanvas.tsx` — add `isReadOnly` prop that disables arc click-to-select-for-delete
- `supabase/migrations/002_profiles.sql` — `profiles` table with `is_public`, updated RLS policy

---

## Dependency map

```
A (autofill API)     — independent
B (airports)         — independent
C (duration stats)   — independent
D (auto-duration)    — independent
E (+1 indicator)     — independent
F (auth/Supabase)    — independent, but prerequisite for I
G (imports)          — independent (G1/G2 independent of auth; G3 needs Google OAuth only)
H (route grouping)   — independent
I (share link)       — requires F
```

Recommended order for implementation: B → A → C+D+E (quick wins) → H → F → G → I

---

## Verification checklist

- **A:** Enter a known flight (e.g., AA 100, JFK, today) — destination, times, aircraft auto-populate within 450ms.
- **B:** Search for NRT, CDG, LHR in airport autocomplete — all appear.
- **C:** Add a flight with "2h 30m" duration — stats sidebar shows ~2.5h air time, not a mileage estimate.
- **D:** Enter dep 10:00 / arr 13:30 — duration auto-fills "3h 30m". Enter 22:00 / 01:00 — fills "3h 00m".
- **E:** Enter dep 23:00 / arr 02:00 — "+1" badge appears next to arrival input.
- **F:** Sign up with email, reload page — flights persist. Sign in on a second browser — same flights appear.
- **G1:** Export from Flighty, drop file — flights parse and appear in preview with correct fields.
- **G2:** Export `.ics` from Apple Calendar, drop file — flight events detected and shown in preview.
- **G3:** Connect Google Calendar — flight events from the selected date range appear in preview.
- **H:** Add SEA→JFK twice. Click either log entry — card shows "Flown 2 times" with both instances listed.
- **I:** Toggle share on, copy link, open in incognito — globe and stats visible, no add/edit controls.
