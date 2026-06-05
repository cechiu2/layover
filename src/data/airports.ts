import type { Airport } from '../types/airport';

let airportByIata: Map<string, Airport> = new Map();
let airportList: Airport[] = [];
let loadPromise: Promise<void> | null = null;

function loadAirports(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = fetch('/airports.json')
    .then((res) => res.json() as Promise<Airport[]>)
    .then((data) => {
      airportList = data;
      airportByIata = new Map(data.map((a) => [a.iata, a]));
    });
  return loadPromise;
}

// Kick off loading immediately when this module is imported
loadAirports();

export function findAirportByIata(value: string): Airport | undefined {
  return airportByIata.get(value.trim().toUpperCase());
}

export function getAirports(): Airport[] {
  return airportList;
}

export { loadAirports };
