import { findAirportByIata } from '../../data/airports';
import type { FlightInput, SeatClass } from '../../types/flight';
import type { ImportRow } from './ImportPreview';

const seatClasses: SeatClass[] = ['economy', 'premium_economy', 'business', 'first'];

export interface ImportDraft {
  aircraftType?: string;
  airline?: string;
  arrivalTime?: string;
  date?: string;
  departureTime?: string;
  destinationCode?: string;
  flightDuration?: string;
  flightNumber?: string;
  originCode?: string;
  seatClass?: SeatClass;
}

export function normalizeSeatClass(value?: string): SeatClass | undefined {
  const normalized = value?.trim().toLowerCase().replace(/[\s-]+/g, '_');

  if (!normalized) {
    return undefined;
  }

  if (normalized === 'premium' || normalized === 'premium_economy' || normalized === 'premium_economy_class') {
    return 'premium_economy';
  }

  if (normalized === 'business_class' || normalized === 'biz') {
    return 'business';
  }

  if (normalized === 'first_class') {
    return 'first';
  }

  return seatClasses.includes(normalized as SeatClass) ? (normalized as SeatClass) : undefined;
}

export function isValidDate(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.valueOf());
}

export function buildImportRow(draft: ImportDraft, rowNumber: number, extraErrors: string[] = []): ImportRow {
  const errors = [...extraErrors];
  const originCode = draft.originCode?.trim().toUpperCase() ?? '';
  const destinationCode = draft.destinationCode?.trim().toUpperCase() ?? '';
  const date = draft.date?.trim() ?? '';
  const origin = findAirportByIata(originCode);
  const destination = findAirportByIata(destinationCode);

  if (!originCode) {
    errors.push('Missing origin');
  } else if (!origin) {
    errors.push('Unknown origin');
  }

  if (!destinationCode) {
    errors.push('Missing destination');
  } else if (!destination) {
    errors.push('Unknown destination');
  }

  if (!date) {
    errors.push('Missing date');
  } else if (!isValidDate(date)) {
    errors.push('Invalid date');
  }

  const flight: FlightInput | undefined =
    errors.length === 0 && origin && destination
      ? {
          aircraftType: draft.aircraftType?.trim() || undefined,
          airline: draft.airline?.trim().toUpperCase() || undefined,
          arrivalTime: draft.arrivalTime?.trim() || undefined,
          date,
          departureTime: draft.departureTime?.trim() || undefined,
          destination,
          flightDuration: draft.flightDuration?.trim() || undefined,
          flightNumber: draft.flightNumber?.trim() || undefined,
          origin,
          seatClass: draft.seatClass,
        }
      : undefined;

  return {
    date,
    destination: destinationCode,
    errors,
    flight,
    origin: originCode,
    rowNumber,
  };
}
