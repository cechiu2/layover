import type { Airport } from './airport';

export type SeatClass = 'economy' | 'premium_economy' | 'business' | 'first';

export interface Flight {
  id: string;
  tripId?: string;
  legIndex?: number;
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
  layoverMinutes?: number;
  distanceMiles?: number;
}

export type FlightInput = Omit<Flight, 'id' | 'distanceMiles'> & {
  id?: string;
};
