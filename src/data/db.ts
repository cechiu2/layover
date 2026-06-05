import Dexie, { liveQuery, type EntityTable } from 'dexie';
import type { Observable } from 'dexie';
import type { Flight, FlightInput } from '../types/flight';
import { getDistanceMiles } from '../utils/haversine';

class LayoverDatabase extends Dexie {
  flights!: EntityTable<Flight, 'id'>;

  constructor() {
    super('layover');
    this.version(1).stores({
      flights: 'id,date',
    });
  }
}

export const db = new LayoverDatabase();

function createFlight(input: FlightInput): Flight {
  return {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    distanceMiles: getDistanceMiles(input.origin, input.destination),
  };
}

export function watchFlights(): Observable<Flight[]> {
  return liveQuery(() => db.flights.orderBy('date').reverse().toArray());
}

export async function listFlights(): Promise<Flight[]> {
  return db.flights.orderBy('date').reverse().toArray();
}

export async function saveFlight(input: FlightInput): Promise<string> {
  const flight = createFlight(input);
  await db.flights.put(flight);
  return flight.id;
}

export async function saveTrip(inputs: FlightInput[]): Promise<string[]> {
  const tripId = crypto.randomUUID();
  const flights = inputs.map((input, index) =>
    createFlight({
      ...input,
      tripId,
      legIndex: index,
    }),
  );

  await db.flights.bulkPut(flights);
  return flights.map((flight) => flight.id);
}

export async function saveFlights(inputs: FlightInput[]): Promise<string[]> {
  const flights = inputs.map(createFlight);
  await db.flights.bulkPut(flights);
  return flights.map((flight) => flight.id);
}

export async function deleteFlight(id: string): Promise<void> {
  await db.flights.delete(id);
}
