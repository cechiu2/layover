import { findAirportByIata } from '../../data/airports';
import type { ImportRow } from './ImportPreview';
import { buildImportRow } from './importValidation';

export interface CalendarEventInput {
  description?: string;
  end?: string;
  location?: string;
  start?: string;
  summary?: string;
}

interface IcsEvent {
  DESCRIPTION?: string;
  DTEND?: string;
  DTSTART?: string;
  LOCATION?: string;
  SUMMARY?: string;
}

interface ParsedDateTime {
  date?: string;
  time?: string;
}

function unfoldLines(text: string): string[] {
  return text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '').split('\n');
}

function decodeIcsText(value: string): string {
  return value
    .replace(/\\n/g, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function getPropertyName(line: string): string {
  const separator = line.indexOf(':');
  const key = separator >= 0 ? line.slice(0, separator) : line;
  return key.split(';')[0].toUpperCase();
}

function getPropertyValue(line: string): string {
  const separator = line.indexOf(':');
  return separator >= 0 ? decodeIcsText(line.slice(separator + 1).trim()) : '';
}

function parseIcsEvents(text: string): IcsEvent[] {
  const events: IcsEvent[] = [];
  let current: IcsEvent | null = null;

  unfoldLines(text).forEach((line) => {
    const name = getPropertyName(line);

    if (name === 'BEGIN' && getPropertyValue(line).toUpperCase() === 'VEVENT') {
      current = {};
      return;
    }

    if (name === 'END' && getPropertyValue(line).toUpperCase() === 'VEVENT') {
      if (current) {
        events.push(current);
      }
      current = null;
      return;
    }

    if (current && ['DESCRIPTION', 'DTEND', 'DTSTART', 'LOCATION', 'SUMMARY'].includes(name)) {
      current[name as keyof IcsEvent] = getPropertyValue(line);
    }
  });

  return events;
}

function parseDateTime(value?: string): ParsedDateTime {
  const trimmed = value?.trim();

  if (!trimmed) {
    return {};
  }

  const match = trimmed.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);

  if (!match) {
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.valueOf())) {
      return {};
    }
    return {
      date: parsed.toISOString().slice(0, 10),
      time: parsed.toISOString().slice(11, 16),
    };
  }

  return {
    date: `${match[1]}-${match[2]}-${match[3]}`,
    time: match[4] && match[5] ? `${match[4]}:${match[5]}` : undefined,
  };
}

function findIataCodes(text: string): string[] {
  const seen = new Set<string>();
  const matches = text.toUpperCase().match(/\b[A-Z]{3}\b/g) ?? [];

  matches.forEach((code) => {
    if (findAirportByIata(code)) {
      seen.add(code);
    }
  });

  return Array.from(seen);
}

function splitFlightNumber(text: string): { airline?: string; flightNumber?: string } {
  const match = text.toUpperCase().match(/\b([A-Z0-9]{2,3})\s?(\d{1,4}[A-Z]?)\b/);

  if (!match) {
    return {};
  }

  return {
    airline: match[1],
    flightNumber: match[2],
  };
}

function eventToImportRow(event: CalendarEventInput, rowNumber: number): ImportRow {
  const start = parseDateTime(event.start);
  const end = parseDateTime(event.end);
  const text = [event.summary, event.location, event.description].filter(Boolean).join(' ');
  const codes = findIataCodes(text);
  const flightNumberParts = splitFlightNumber(text);

  return buildImportRow(
    {
      airline: flightNumberParts.airline,
      arrivalTime: end.time,
      date: start.date,
      departureTime: start.time,
      destinationCode: codes[1],
      flightNumber: flightNumberParts.flightNumber,
      originCode: codes[0],
    },
    rowNumber,
    codes.length < 2 ? ['Could not find route'] : [],
  );
}

export function parseICSText(text: string): ImportRow[] {
  return parseIcsEvents(text).map((event, index) =>
    eventToImportRow(
      {
        description: event.DESCRIPTION,
        end: event.DTEND,
        location: event.LOCATION,
        start: event.DTSTART,
        summary: event.SUMMARY,
      },
      index + 1,
    ),
  );
}

export function parseCalendarEvents(events: CalendarEventInput[]): ImportRow[] {
  return events.map((event, index) => eventToImportRow(event, index + 1));
}
