export interface FlightLookupRequest {
  carrierCode: string;
  flightNumber: string;
  originIata: string;
  departureDate: string;
}

export interface FlightLookupMatch {
  id: string;
  carrierCode?: string;
  flightNumber?: string;
  originIata: string;
  destinationIata: string;
  departureTime?: string;
  arrivalTime?: string;
  arrivalDate?: string;  // local date at destination, YYYY-MM-DD
  durationMinutes?: number;
  aircraftType?: string;
}

interface FlightLookupResponse {
  error?: string;
  matches?: FlightLookupMatch[];
}

export async function lookupFlight(request: FlightLookupRequest): Promise<FlightLookupMatch[]> {
  const response = await fetch('/api/flight-lookup', {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (response.status === 404) {
    throw new Error('Flight lookup is not configured yet.');
  }

  const payload = (await response.json()) as FlightLookupResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? 'Flight lookup failed.');
  }

  return payload.matches ?? [];
}
