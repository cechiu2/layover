import type { Flight } from '../types/flight';

export function getRouteKey(flight: Flight): string {
  return [flight.origin.iata, flight.destination.iata].sort().join('-');
}

export function isSameRoute(a: Flight, b: Flight): boolean {
  return getRouteKey(a) === getRouteKey(b);
}
