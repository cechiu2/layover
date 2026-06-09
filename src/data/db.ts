import Dexie, { liveQuery, type EntityTable } from 'dexie';
import type { Observable } from 'dexie';
import type { Flight, FlightInput } from '../types/flight';
import { getDistanceMiles } from '../utils/haversine';
import { deleteSupabaseFlight, fetchSupabaseFlights, getCurrentUser, upsertSupabaseFlights } from './supabase';

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

async function getAuthenticatedUserId(): Promise<string | null> {
  return (await getCurrentUser())?.id ?? null;
}

async function saveCreatedFlights(flights: Flight[]): Promise<void> {
  await db.flights.bulkPut(flights);

  const userId = await getAuthenticatedUserId();

  if (userId) {
    try {
      await upsertSupabaseFlights(flights, userId);
    } catch (error) {
      console.warn('Cloud sync failed; flights were saved locally.', error);
    }
  }
}

export async function saveFlight(input: FlightInput): Promise<string> {
  const flight = createFlight(input);
  await saveCreatedFlights([flight]);
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

  await saveCreatedFlights(flights);
  return flights.map((flight) => flight.id);
}

export async function saveFlights(inputs: FlightInput[]): Promise<string[]> {
  const flights = inputs.map(createFlight);
  await saveCreatedFlights(flights);
  return flights.map((flight) => flight.id);
}

export async function deleteFlight(id: string): Promise<void> {
  await db.flights.delete(id);

  const userId = await getAuthenticatedUserId();

  if (userId) {
    try {
      await deleteSupabaseFlight(id);
    } catch (error) {
      console.warn('Cloud delete failed; flight was deleted locally.', error);
    }
  }
}

export async function syncAuthenticatedCache(): Promise<void> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return;
  }

  const localFlights = await listFlights();
  await upsertSupabaseFlights(localFlights, userId);
  const cloudFlights = await fetchSupabaseFlights();

  await db.transaction('rw', db.flights, async () => {
    await db.flights.clear();
    await db.flights.bulkPut(cloudFlights);
  });
}
