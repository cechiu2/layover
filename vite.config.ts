import react from '@vitejs/plugin-react';
import { readFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';

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

function serveVendorAssetsPlugin(): Plugin {
  const assets = new Map(
    [
      ['/vendor/globe.gl.min.js', ['node_modules/globe.gl/dist/globe.gl.min.js', 'application/javascript']],
      ['/vendor/earth-night.jpg', ['node_modules/three-globe/example/img/earth-night.jpg', 'image/jpeg']],
      ['/vendor/earth-topology.png', ['node_modules/three-globe/example/img/earth-topology.png', 'image/png']],
    ] satisfies Array<[string, [string, string]]>,
  );

  return {
    name: 'layover-vendor-assets',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split('?')[0] ?? '';
        const asset = assets.get(pathname);

        if (!asset) {
          next();
          return;
        }

        void (async () => {
          const [relativePath, contentType] = asset;
          try {
            const file = await readFile(new URL(relativePath, import.meta.url));
            response.statusCode = 200;
            response.setHeader('Content-Type', contentType);
            response.setHeader('Cache-Control', 'no-cache');
            response.end(request.method === 'HEAD' ? undefined : file);
          } catch {
            response.statusCode = 404;
            response.end();
          }
        })();
      });
    },
  };
}

// Extract HH:mm from AeroDataBox local time strings like "2024-06-05 14:30+02:00"
function extractLocalTime(value?: string | null): string | undefined {
  return value?.match(/\s(\d{2}):(\d{2})/)?.slice(1, 3).join(':');
}

function computeDurationMinutes(
  departureUtc?: string | null,
  arrivalUtc?: string | null,
): number | undefined {
  const dep = departureUtc ? new Date(departureUtc.replace(' ', 'T')) : null;
  const arr = arrivalUtc ? new Date(arrivalUtc.replace(' ', 'T')) : null;

  if (dep && arr && !Number.isNaN(dep.valueOf()) && !Number.isNaN(arr.valueOf())) {
    const minutes = Math.round((arr.valueOf() - dep.valueOf()) / 60000);
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

function aeroDataBoxLookupPlugin(apiKey: string): Plugin {
  return {
    name: 'aerodatabox-flight-lookup',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/flight-lookup', async (request, response, next) => {
        if (request.method !== 'POST') {
          next();
          return;
        }

        try {
          const lookupRequest = normalizeLookupRequest(
            JSON.parse((await readRequestBody(request)) || '{}'),
          );

          if (!lookupRequest) {
            sendJson(response, 400, {
              error: 'carrierCode, flightNumber, originIata, and departureDate are required.',
            });
            return;
          }

          if (!apiKey) {
            sendJson(response, 500, {
              error:
                'VITE_AERODATABOX_KEY is not configured. Add it to a local .env file and restart the dev server.',
            });
            return;
          }

          const flightIata = `${lookupRequest.carrierCode}${lookupRequest.flightNumber}`;
          const url = `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(flightIata)}/${encodeURIComponent(lookupRequest.departureDate)}`;

          const aeroResponse = await fetch(url, {
            headers: {
              'X-RapidAPI-Key': apiKey,
              'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
            },
          });

          if (aeroResponse.status === 404) {
            sendJson(response, 200, { matches: [] });
            return;
          }

          if (aeroResponse.status === 429) {
            const retryAfter = Number(aeroResponse.headers.get('Retry-After') ?? '2');
            const waitMs = Math.min((retryAfter || 2) * 1000, 4000);
            await new Promise((r) => setTimeout(r, waitMs));

            const retryResponse = await fetch(url, {
              headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
              },
            });

            if (retryResponse.ok) {
              const retryFlights = (await retryResponse.json()) as AeroDataBoxFlight[];
              const matches = Array.isArray(retryFlights)
                ? retryFlights
                    .filter((f) => f.departure?.airport?.iata?.toUpperCase() === lookupRequest.originIata)
                    .map((f) => {
                      const originIata = f.departure?.airport?.iata?.toUpperCase();
                      const destinationIata = f.arrival?.airport?.iata?.toUpperCase();
                      if (!originIata || !destinationIata) return null;
                      const split = splitFlightNumber(f.number);
                      const flightIataLocal = `${lookupRequest.carrierCode}${lookupRequest.flightNumber}`;
                      return {
                        id: `${f.number ?? flightIataLocal}-${originIata}-${lookupRequest.departureDate}`,
                        carrierCode: f.airline?.iata?.toUpperCase() ?? split.carrierCode ?? lookupRequest.carrierCode,
                        flightNumber: split.number ?? lookupRequest.flightNumber,
                        originIata,
                        destinationIata,
                        departureTime: extractLocalTime(f.departure?.scheduledTime?.local),
                        arrivalTime: extractLocalTime(f.arrival?.scheduledTime?.local),
                        durationMinutes: computeDurationMinutes(f.departure?.scheduledTime?.utc, f.arrival?.scheduledTime?.utc),
                        aircraftType: f.aircraft?.model ?? undefined,
                      };
                    })
                    .filter(Boolean)
                : [];
              sendJson(response, 200, { matches });
              return;
            }

            if (retryResponse.status === 429) {
              sendJson(response, 429, {
                error: 'AeroDataBox rate limit reached. Your free quota (100 req/month) may be exhausted — check rapidapi.com to confirm. If the key was recently shared, regenerate it in your RapidAPI dashboard and update VITE_AERODATABOX_KEY in .env.',
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

          if (!Array.isArray(flights)) {
            sendJson(response, 200, { matches: [] });
            return;
          }

          // Filter to flights departing from the requested origin
          const matches = flights
            .filter(
              (f) =>
                f.departure?.airport?.iata?.toUpperCase() === lookupRequest.originIata,
            )
            .map((f) => {
              const originIata = f.departure?.airport?.iata?.toUpperCase();
              const destinationIata = f.arrival?.airport?.iata?.toUpperCase();

              if (!originIata || !destinationIata) return null;

              const split = splitFlightNumber(f.number);

              return {
                id: `${f.number ?? flightIata}-${originIata}-${lookupRequest.departureDate}`,
                carrierCode: f.airline?.iata?.toUpperCase() ?? split.carrierCode ?? lookupRequest.carrierCode,
                flightNumber: split.number ?? lookupRequest.flightNumber,
                originIata,
                destinationIata,
                departureTime: extractLocalTime(f.departure?.scheduledTime?.local),
                arrivalTime: extractLocalTime(f.arrival?.scheduledTime?.local),
                durationMinutes: computeDurationMinutes(
                  f.departure?.scheduledTime?.utc,
                  f.arrival?.scheduledTime?.utc,
                ),
                aircraftType: f.aircraft?.model ?? undefined,
              };
            })
            .filter(Boolean);

          sendJson(response, 200, { matches });
        } catch (error) {
          sendJson(response, 500, {
            error: error instanceof Error ? error.message : 'Flight lookup failed.',
          });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react(), serveVendorAssetsPlugin(), aeroDataBoxLookupPlugin(env.VITE_AERODATABOX_KEY ?? '')],
    server: {
      host: '127.0.0.1',
      port: 5173,
    },
  };
});
