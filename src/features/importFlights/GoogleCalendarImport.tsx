import { CalendarSearch } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/primitives/Button';
import { Input } from '../../components/primitives/Input';
import type { FlightInput } from '../../types/flight';
import { ImportPreview, type ImportRow } from './ImportPreview';
import { ImportSuccess } from './ImportSuccess';
import { parseCalendarEvents, type CalendarEventInput } from './parseICS';

interface GoogleCalendarImportProps {
  onDone: () => void;
  onImport: (flights: FlightInput[]) => Promise<void>;
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
}

interface GoogleTokenClient {
  requestAccessToken: () => void;
}

interface GoogleCalendarEventDate {
  date?: string;
  dateTime?: string;
}

interface GoogleCalendarEvent {
  description?: string;
  end?: GoogleCalendarEventDate;
  location?: string;
  start?: GoogleCalendarEventDate;
  summary?: string;
}

interface GoogleCalendarResponse {
  items?: GoogleCalendarEvent[];
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            callback: (response: GoogleTokenResponse) => void;
            client_id: string;
            scope: string;
          }) => GoogleTokenClient;
        };
      };
    };
  }
}

type ImportStep = 'connect' | 'preview' | 'success';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google sign-in script failed to load.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google sign-in script failed to load.'));
    document.head.appendChild(script);
  });
}

function toCalendarDate(value: string, endOfDay = false): string {
  return new Date(`${value}T${endOfDay ? '23:59:59' : '00:00:00'}`).toISOString();
}

function toCalendarEventInput(event: GoogleCalendarEvent): CalendarEventInput {
  return {
    description: event.description,
    end: event.end?.dateTime ?? event.end?.date,
    location: event.location,
    start: event.start?.dateTime ?? event.start?.date,
    summary: event.summary,
  };
}

export function GoogleCalendarImport({ onDone, onImport }: GoogleCalendarImportProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [endDate, setEndDate] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [startDate, setStartDate] = useState(`${new Date().getFullYear()}-01-01`);
  const [step, setStep] = useState<ImportStep>('connect');

  async function fetchEvents(accessToken: string) {
    const params = new URLSearchParams({
      maxResults: '2500',
      orderBy: 'startTime',
      singleEvents: 'true',
      timeMax: toCalendarDate(endDate, true),
      timeMin: toCalendarDate(startDate),
    });
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Google Calendar request failed.');
    }

    const data = (await response.json()) as GoogleCalendarResponse;
    setRows(parseCalendarEvents((data.items ?? []).map(toCalendarEventInput)));
    setStep('preview');
    setIsLoading(false);
  }

  async function connectCalendar() {
    if (!googleClientId) {
      setError('Add VITE_GOOGLE_CLIENT_ID to .env to enable Google Calendar import.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await loadGoogleIdentityScript();
      const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
        callback: (response) => {
          if (response.error || !response.access_token) {
            setError(response.error ?? 'Google authorization failed.');
            setIsLoading(false);
            return;
          }

          void fetchEvents(response.access_token).catch((fetchError: unknown) => {
            setError(fetchError instanceof Error ? fetchError.message : 'Google Calendar import failed.');
            setIsLoading(false);
          });
        },
        client_id: googleClientId,
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
      });

      tokenClient?.requestAccessToken();
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : 'Google authorization failed.');
      setIsLoading(false);
    }
  }

  async function handleImport(flights: FlightInput[]) {
    await onImport(flights);
    setImportedCount(flights.length);
    setStep('success');
  }

  if (step === 'success') {
    return <ImportSuccess count={importedCount} onDone={onDone} />;
  }

  if (step === 'preview') {
    return <ImportPreview onBack={() => setStep('connect')} onImport={handleImport} rows={rows} />;
  }

  return (
    <div className="grid gap-[var(--space-lg)]">
      <div className="grid grid-cols-2 gap-[var(--space-md)]">
        <Input label="Start date" onChange={(event) => setStartDate(event.currentTarget.value)} type="date" value={startDate} />
        <Input label="End date" onChange={(event) => setEndDate(event.currentTarget.value)} type="date" value={endDate} />
      </div>
      {error ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-accent-amber)] bg-[var(--color-bg-elevated)] p-[var(--space-sm)] text-mono text-[var(--color-accent-amber)]">
          {error}
        </p>
      ) : null}
      <Button
        disabled={isLoading || !startDate || !endDate}
        icon={<CalendarSearch aria-hidden className="h-[var(--icon-size-sm)] w-[var(--icon-size-sm)]" />}
        onClick={() => {
          void connectCalendar();
        }}
        variant="primary"
      >
        {isLoading ? 'Connecting...' : 'Connect Google Calendar'}
      </Button>
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-[var(--space-md)]">
        <p className="text-body text-[var(--color-text-secondary)]">
          Requires a Google Cloud OAuth client with Calendar API enabled and VITE_GOOGLE_CLIENT_ID set locally.
        </p>
      </div>
    </div>
  );
}
