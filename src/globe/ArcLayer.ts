import type { Flight } from '../types/flight';

export interface ArcLayerDatum {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
}

export function getArcLayerData(flights: Flight[]): ArcLayerDatum[] {
  return flights.map((flight) => ({
    id: flight.id,
    startLat: flight.origin.lat,
    startLng: flight.origin.lon,
    endLat: flight.destination.lat,
    endLng: flight.destination.lon,
  }));
}
