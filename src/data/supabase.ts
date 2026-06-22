import { createClient, type User } from '@supabase/supabase-js';
import type { Airport } from '../types/airport';
import type { Flight } from '../types/flight';

function normalizeSupabaseUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    url.pathname = url.pathname.replace(/\/rest\/v1\/?$/, '');
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return value.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  }
}

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

interface FlightRecord {
  aircraft_type: string | null;
  airline: string | null;
  arrival_time: string | null;
  date: string;
  departure_time: string | null;
  destination: Airport;
  distance_miles: number | null;
  flight_duration: string | null;
  flight_number: string | null;
  id: string;
  layover_minutes: number | null;
  leg_index: number | null;
  origin: Airport;
  seat_class: Flight['seatClass'] | null;
  trip_id: string | null;
  user_id: string;
}

function toRecord(flight: Flight, userId: string): FlightRecord {
  return {
    aircraft_type: flight.aircraftType ?? null,
    airline: flight.airline ?? null,
    arrival_time: flight.arrivalTime ?? null,
    date: flight.date,
    departure_time: flight.departureTime ?? null,
    destination: flight.destination,
    distance_miles: flight.distanceMiles ?? null,
    flight_duration: flight.flightDuration ?? null,
    flight_number: flight.flightNumber ?? null,
    id: flight.id,
    layover_minutes: flight.layoverMinutes ?? null,
    leg_index: flight.legIndex ?? null,
    origin: flight.origin,
    seat_class: flight.seatClass ?? null,
    trip_id: flight.tripId ?? null,
    user_id: userId,
  };
}

function fromRecord(record: FlightRecord): Flight {
  return {
    aircraftType: record.aircraft_type ?? undefined,
    airline: record.airline ?? undefined,
    arrivalTime: record.arrival_time ?? undefined,
    date: record.date,
    departureTime: record.departure_time ?? undefined,
    destination: record.destination,
    distanceMiles: record.distance_miles ?? undefined,
    flightDuration: record.flight_duration ?? undefined,
    flightNumber: record.flight_number ?? undefined,
    id: record.id,
    layoverMinutes: record.layover_minutes ?? undefined,
    legIndex: record.leg_index ?? undefined,
    origin: record.origin,
    seatClass: record.seat_class ?? undefined,
    tripId: record.trip_id ?? undefined,
  };
}

export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

export async function fetchSupabaseFlights(): Promise<Flight[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.from('flights').select('*').order('date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as FlightRecord[]).map(fromRecord);
}

export async function upsertSupabaseFlights(flights: Flight[], userId: string): Promise<void> {
  if (!supabase || flights.length === 0) {
    return;
  }

  const { error } = await supabase.from('flights').upsert(flights.map((flight) => toRecord(flight, userId)));

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteSupabaseFlight(id: string): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from('flights').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}
