import type { Airport } from './airport';

export type SeatClass = 'economy' | 'premium_economy' | 'business' | 'first';

export interface Flight {
  id: string;
  origin: Airport;
  destination: Airport;
  date: string;
  airline?: string;
  flightNumber?: string;
  seatClass?: SeatClass;
  aircraftType?: string;
  departureTime?: string;
  arrivalTime?: string;
  flightDuration?: string;
  distanceMiles?: number;
}

export type FlightInput = Omit<Flight, 'id' | 'distanceMiles'> & {
  id?: string;
};
