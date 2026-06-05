import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const AIRPORTS_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';
const COUNTRIES_URL = 'https://davidmegginson.github.io/ourairports-data/countries.csv';
const OUTPUT_PATH = resolve(process.cwd(), 'src/data/airports.json');
const INCLUDED_TYPES = new Set(['large_airport', 'medium_airport']);

function parseCsv(text) {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }

      row.push(field);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((value) => value.length > 0)) {
    rows.push(row);
  }

  return rows;
}

function parseCsvObjects(text) {
  const rows = parseCsv(text);
  const [headers, ...values] = rows;

  return values.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])),
  );
}

async function fetchText(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function buildCountryMap(countries) {
  return new Map(countries.map((country) => [country.code, country.name]));
}

function toAirportOutput(row, countriesByCode) {
  const iata = row.iata_code.trim().toUpperCase();
  const lat = Number(row.latitude_deg);
  const lon = Number(row.longitude_deg);

  if (!INCLUDED_TYPES.has(row.type) || !iata || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  return {
    iata,
    name: row.name.trim(),
    city: row.municipality.trim() || row.name.trim(),
    country: countriesByCode.get(row.iso_country) ?? row.iso_country,
    lat,
    lon,
  };
}

function sortAirports(airports) {
  return airports.sort((a, b) => a.iata.localeCompare(b.iata));
}

async function main() {
  const [airportsText, countriesText] = await Promise.all([fetchText(AIRPORTS_URL), fetchText(COUNTRIES_URL)]);
  const countriesByCode = buildCountryMap(parseCsvObjects(countriesText));
  const seenIata = new Set();

  const airports = sortAirports(
    parseCsvObjects(airportsText).flatMap((row) => {
      const airport = toAirportOutput(row, countriesByCode);

      if (!airport || seenIata.has(airport.iata)) {
        return [];
      }

      seenIata.add(airport.iata);
      return [airport];
    }),
  );

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(airports, null, 2)}\n`);
  console.log(`Wrote ${airports.length} airports to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
