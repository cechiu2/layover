import type { Airport } from '../types/airport';

const EARTH_RADIUS_MILES = 3958.8;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function getDistanceMiles(origin: Airport, destination: Airport): number {
  const latDelta = toRadians(destination.lat - origin.lat);
  const lonDelta = toRadians(destination.lon - origin.lon);
  const originLat = toRadians(origin.lat);
  const destinationLat = toRadians(destination.lat);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(originLat) * Math.cos(destinationLat) * Math.sin(lonDelta / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_MILES * c);
}
