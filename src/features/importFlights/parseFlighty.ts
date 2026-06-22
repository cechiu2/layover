import type { ImportRow } from './ImportPreview';
import { buildImportRow, normalizeSeatClass } from './importValidation';

export interface FlightyRow {
  Aircraft?: string;
  'Arrival Airport'?: string;
  'Arrival Time (Local)'?: string;
  Cabin?: string;
  'Departure Airport'?: string;
  'Departure Date'?: string;
  'Departure Time (Local)'?: string;
  'Flight Number'?: string;
  [key: string]: string | undefined;
}

function normalizeTime(value?: string): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  const match = trimmed.match(/\b(\d{1,2}):(\d{2})\b/);

  if (!match) {
    return undefined;
  }

  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

function normalizeDate(value?: string): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.valueOf())) {
    return trimmed;
  }

  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, '0'),
    String(parsed.getDate()).padStart(2, '0'),
  ].join('-');
}

function splitFlightNumber(value?: string): { airline?: string; flightNumber?: string } {
  const trimmed = value?.trim().toUpperCase();

  if (!trimmed) {
    return {};
  }

  const match = trimmed.match(/^([A-Z0-9]{2,3})\s*(\d{1,4}[A-Z]?)$/);

  if (!match) {
    return { flightNumber: trimmed };
  }

  return {
    airline: match[1],
    flightNumber: match[2],
  };
}

export function parseFlightyRows(rows: FlightyRow[]): ImportRow[] {
  return rows.map((row, index) => {
    const flightNumberParts = splitFlightNumber(row['Flight Number']);
    const seatClass = normalizeSeatClass(row.Cabin);

    return buildImportRow(
      {
        aircraftType: row.Aircraft,
        airline: flightNumberParts.airline,
        arrivalTime: normalizeTime(row['Arrival Time (Local)']),
        date: normalizeDate(row['Departure Date']),
        departureTime: normalizeTime(row['Departure Time (Local)']),
        destinationCode: row['Arrival Airport'],
        flightNumber: flightNumberParts.flightNumber,
        originCode: row['Departure Airport'],
        seatClass,
      },
      index + 2,
      row.Cabin && !seatClass ? ['Invalid class'] : [],
    );
  });
}
