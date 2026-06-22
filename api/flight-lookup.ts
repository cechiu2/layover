import type { IncomingMessage, ServerResponse } from 'node:http';

interface LookupRequest {
  carrierCode: string;
  departureDate: string;
  flightNumber: string;
  originIata: string;
}

interface AeroDataBoxScheduledTime {
  local?: string | null;
  utc?: string | null;
}

interface AeroDataBoxAirport {
  iata?: string | null;
}

interface AeroDataBoxFlight {
  number?: string | null;
  airline?: {
    iata?: string | null;
  } | null;
  aircraft?: {
    model?: string | null;
  } | null;
  departure?: {
    airport?: AeroDataBoxAirport | null;
    scheduledTime?: AeroDataBoxScheduledTime | null;
  } | null;
  arrival?: {
    airport?: AeroDataBoxAirport | null;
    scheduledTime?: AeroDataBoxScheduledTime | null;
  } | null;
}

interface VercelRequest extends IncomingMessage {
  body?: unknown;
}

function readRequestBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => { body += chunk; });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request: VercelRequest): Promise<unknown> {
  if (typeof request.body === 'string') {
    return JSON.parse(request.body || '{}');
  }

  if (request.body && typeof request.body === 'object') {
    return request.body;
  }

  return JSON.parse((await readRequestBody(request)) || '{}');
}

function extractLocalTime(value?: string | null): string | undefined {
  return value?.match(/\s(\d{2}):(\d{2})/)?.slice(1, 3).join(':');
}

function extractArrivalLocalDate(arrivalUtc?: string | null, arrivalLocal?: string | null): string | undefined {
  if (!arrivalUtc || !arrivalLocal) return undefined;

  const offsetMatch = arrivalLocal.match(/([+-])(\d{2}):(\d{2})$/);
  if (!offsetMatch) return undefined;

  const sign = offsetMatch[1] === '+' ? 1 : -1;
  const offsetMinutes = sign * (parseInt(offsetMatch[2], 10) * 60 + parseInt(offsetMatch[3], 10));
  const utcDate = new Date(arrivalUtc.replace(' ', 'T'));
  if (Number.isNaN(utcDate.valueOf())) return undefined;

  const local = new Date(utcDate.valueOf() + offsetMinutes * 60000);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function computeDurationMinutes(
  departureUtc?: string | null,
  arrivalUtc?: string | null,
): number | undefined {
  const departure = departureUtc ? new Date(departureUtc.replace(' ', 'T')) : null;
  const arrival = arrivalUtc ? new Date(arrivalUtc.replace(' ', 'T')) : null;

  if (departure && arrival && !Number.isNaN(departure.valueOf()) && !Number.isNaN(arrival.valueOf())) {
    const minutes = Math.round((arrival.valueOf() - departure.valueOf()) / 60000);
    if (minutes > 0) return minutes;
  }

  return undefined;
}

function splitFlightNumber(value?: string | null): { carrierCode?: string; number?: string } {
  const match = value?.match(/^([A-Z0-9]{2,3})(\d+[A-Z]?)$/i);
  return {
    carrierCode: match?.[1]?.toUpperCase(),
    number: match?.[2],
  };
}

function normalizeLookupRequest(value: unknown): LookupRequest | null {
  if (!value || typeof value !== 'object') return null;

  const req = value as Partial<Record<keyof LookupRequest, unknown>>;
  const carrierCode = typeof req.carrierCode === 'string' ? req.carrierCode.trim().toUpperCase() : '';
  const flightNumber = typeof req.flightNumber === 'string' ? req.flightNumber.trim() : '';
  const originIata = typeof req.originIata === 'string' ? req.originIata.trim().toUpperCase() : '';
  const departureDate = typeof req.departureDate === 'string' ? req.departureDate.trim() : '';

  if (!carrierCode || !flightNumber || !originIata || !departureDate) return null;

  return { carrierCode, departureDate, flightNumber, originIata };
}

function toMatches(flights: AeroDataBoxFlight[], lookupRequest: LookupRequest) {
  const flightIata = `${lookupRequest.carrierCode}${lookupRequest.flightNumber}`;

  return flights
    .filter((flight) => {
      if (flight.departure?.airport?.iata?.toUpperCase() !== lookupRequest.originIata) return false;
      const departureDate = flight.departure?.scheduledTime?.local?.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
      return !departureDate || departureDate === lookupRequest.departureDate;
    })
    .map((flight) => {
      const originIata = flight.departure?.airport?.iata?.toUpperCase();
      const destinationIata = flight.arrival?.airport?.iata?.toUpperCase();

      if (!originIata || !destinationIata) return null;

      const split = splitFlightNumber(flight.number);

      return {
        id: `${flight.number ?? flightIata}-${originIata}-${lookupRequest.departureDate}`,
        carrierCode: flight.airline?.iata?.toUpperCase() ?? split.carrierCode ?? lookupRequest.carrierCode,
        flightNumber: split.number ?? lookupRequest.flightNumber,
        originIata,
        destinationIata,
        departureTime: extractLocalTime(flight.departure?.scheduledTime?.local),
        arrivalTime: extractLocalTime(flight.arrival?.scheduledTime?.local),
        arrivalDate: extractArrivalLocalDate(flight.arrival?.scheduledTime?.utc, flight.arrival?.scheduledTime?.local),
        durationMinutes: computeDurationMinutes(
          flight.departure?.scheduledTime?.utc,
          flight.arrival?.scheduledTime?.utc,
        ),
        aircraftType: flight.aircraft?.model ?? undefined,
      };
    })
    .filter((match): match is NonNullable<typeof match> => match !== null);
}

async function fetchAeroDataBoxFlights(lookupRequest: LookupRequest, apiKey: string) {
  const flightIata = `${lookupRequest.carrierCode}${lookupRequest.flightNumber}`;
  const url = `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(flightIata)}/${encodeURIComponent(lookupRequest.departureDate)}`;

  return fetch(url, {
    headers: {
      'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
      'X-RapidAPI-Key': apiKey,
    },
  });
}

export default async function handler(request: VercelRequest, response: ServerResponse) {
  if (request.method !== 'POST') {
    response.statusCode = 405;
    response.setHeader('Allow', 'POST');
    response.end();
    return;
  }

  try {
    const lookupRequest = normalizeLookupRequest(await readJsonBody(request));

    if (!lookupRequest) {
      sendJson(response, 400, {
        error: 'carrierCode, flightNumber, originIata, and departureDate are required.',
      });
      return;
    }

    const apiKey = process.env.AERODATABOX_KEY;

    if (!apiKey) {
      sendJson(response, 500, {
        error: 'AERODATABOX_KEY is not configured on the deployment.',
      });
      return;
    }

    const aeroResponse = await fetchAeroDataBoxFlights(lookupRequest, apiKey);

    if (aeroResponse.status === 404) {
      sendJson(response, 200, { matches: [] });
      return;
    }

    if (aeroResponse.status === 429) {
      const retryAfter = Number(aeroResponse.headers.get('Retry-After') ?? '2');
      const waitMs = Math.min((retryAfter || 2) * 1000, 4000);
      await new Promise((resolve) => setTimeout(resolve, waitMs));

      const retryResponse = await fetchAeroDataBoxFlights(lookupRequest, apiKey);

      if (retryResponse.ok) {
        const retryFlights = (await retryResponse.json()) as AeroDataBoxFlight[];
        sendJson(response, 200, { matches: Array.isArray(retryFlights) ? toMatches(retryFlights, lookupRequest) : [] });
        return;
      }

      if (retryResponse.status === 429) {
        sendJson(response, 429, {
          error: 'AeroDataBox rate limit reached. Check your RapidAPI quota or regenerate the key if it was shared.',
        });
        return;
      }
    }

    if (!aeroResponse.ok) {
      const text = await aeroResponse.text().catch(() => '');
      sendJson(response, 502, {
        error: `AeroDataBox lookup failed (${aeroResponse.status}): ${text.slice(0, 200)}`,
      });
      return;
    }

    const flights = (await aeroResponse.json()) as AeroDataBoxFlight[];
    sendJson(response, 200, { matches: Array.isArray(flights) ? toMatches(flights, lookupRequest) : [] });
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Flight lookup failed.',
    });
  }
}
