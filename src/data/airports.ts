import airportsData from './airports.json';
import type { Airport } from '../types/airport';

export const airports = airportsData as Airport[];

export const airportByIata = new Map(airports.map((airport) => [airport.iata, airport]));

export function findAirportByIata(value: string): Airport | undefined {
  return airportByIata.get(value.trim().toUpperCase());
}
