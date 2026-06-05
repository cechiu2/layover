import type { Airport } from '../types/airport';
import type { Flight } from '../types/flight';

export interface FlightsPerYear {
  year: string;
  flights: number;
}

export interface TopRoute {
  key: string;
  origin: Airport;
  destination: Airport;
  flights: number;
  miles: number;
}

export interface FlightStats {
  totalFlights: number;
  totalMiles: number;
  countries: number;
  timeInAirHours: number;
  layoverHours: number;
  airports: number;
  yearsFlying: number;
  flightsPerYear: FlightsPerYear[];
  topRoutes: TopRoute[];
}

function getYear(date: string): string {
  return new Date(date).getUTCFullYear().toString();
}

export function calculateFlightStats(flights: Flight[]): FlightStats {
  const totalMiles = flights.reduce((sum, flight) => sum + (flight.distanceMiles ?? 0), 0);
  const totalLayoverMinutes = flights.reduce((sum, flight) => sum + (flight.layoverMinutes ?? 0), 0);
  const countries = new Set<string>();
  const airports = new Map<string, Airport>();
  const years = new Map<string, number>();
  const routes = new Map<string, TopRoute>();

  flights.forEach((flight) => {
    countries.add(flight.origin.country);
    countries.add(flight.destination.country);
    airports.set(flight.origin.iata, flight.origin);
    airports.set(flight.destination.iata, flight.destination);

    const year = getYear(flight.date);
    years.set(year, (years.get(year) ?? 0) + 1);

    const routeKey = [flight.origin.iata, flight.destination.iata].sort().join('-');
    const route = routes.get(routeKey);

    if (route) {
      route.flights += 1;
      route.miles += flight.distanceMiles ?? 0;
    } else {
      routes.set(routeKey, {
        key: routeKey,
        origin: flight.origin,
        destination: flight.destination,
        flights: 1,
        miles: flight.distanceMiles ?? 0,
      });
    }
  });

  return {
    totalFlights: flights.length,
    totalMiles,
    countries: countries.size,
    timeInAirHours: Math.round(totalMiles / 500),
    layoverHours: Math.round(totalLayoverMinutes / 60),
    airports: airports.size,
    yearsFlying: years.size,
    flightsPerYear: Array.from(years.entries())
      .map(([year, count]) => ({ year, flights: count }))
      .sort((a, b) => a.year.localeCompare(b.year)),
    topRoutes: Array.from(routes.values())
      .sort((a, b) => b.flights - a.flights || b.miles - a.miles)
      .slice(0, 5),
  };
}
