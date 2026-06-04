import type { Airport } from '../types/airport';
import type { Flight } from '../types/flight';

export interface AirportDotDatum {
  id: string;
  lat: number;
  lng: number;
}

export function getAirportDotLayerData(flights: Flight[]): AirportDotDatum[] {
  const airports = new Map<string, Airport>();

  flights.forEach((flight) => {
    airports.set(flight.origin.iata, flight.origin);
    airports.set(flight.destination.iata, flight.destination);
  });

  return Array.from(airports.values()).map((airport) => ({
    id: airport.iata,
    lat: airport.lat,
    lng: airport.lon,
  }));
}
