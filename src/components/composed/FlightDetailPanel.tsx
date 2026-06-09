import { ArrowLeft, Plane } from 'lucide-react';
import type { Flight } from '../../types/flight';
import { formatDate, formatMiles, formatSeatClass } from '../../utils/format';
import { Button } from '../primitives/Button';

interface FlightDetailPanelProps {
  flights: Flight[];
  onBack: () => void;
  selectedFlightId: string | null;
}

interface DetailRowProps {
  label: string;
  value: string;
}

function getFlightCode(flight: Flight): string {
  if (flight.airline && flight.flightNumber) {
    return `${flight.airline}${flight.flightNumber}`;
  }

  return flight.flightNumber ?? flight.airline ?? 'Flight';
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="grid gap-[var(--space-xs)] border-b border-[var(--color-border-default)] py-[var(--space-sm)] last:border-b-0">
      <span className="label-text text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-body text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}

export function FlightDetailPanel({ flights, onBack, selectedFlightId }: FlightDetailPanelProps) {
  const historyFlights = [...flights].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const focusedFlight = historyFlights.find((flight) => flight.id === selectedFlightId) ?? historyFlights[0];

  if (!focusedFlight) {
    return null;
  }

  return (
    <div className="grid gap-[var(--space-lg)]">
      <div className="flex items-center gap-[var(--space-sm)]">
        <Button
          aria-label="Back to flight log"
          icon={<ArrowLeft aria-hidden className="h-[var(--icon-size-md)] w-[var(--icon-size-md)]" />}
          onClick={onBack}
          size="icon"
          variant="ghost"
        />
        <span className="label-text text-[var(--color-text-secondary)]">Flight Log</span>
      </div>

      <section className="grid gap-[var(--space-md)]">
        <div className="grid justify-items-start gap-[var(--space-xs)]">
          <h2 className="text-display text-[var(--color-accent-teal)]">
            {focusedFlight.origin.iata} → {focusedFlight.destination.iata}
          </h2>
          <p className="text-heading-sm text-[var(--color-accent-amber)]">
            {focusedFlight.origin.city} → {focusedFlight.destination.city}
          </p>
          <p className="text-heading-sm text-[var(--color-text-primary)]">
            Flown {flights.length} {flights.length === 1 ? 'time' : 'times'}
          </p>
          <p className="flex items-center gap-[var(--space-sm)] font-mono text-heading-sm text-[var(--color-text-primary)]">
            <Plane aria-hidden className="h-[var(--icon-size-sm)] w-[var(--icon-size-sm)]" />
            {getFlightCode(focusedFlight)}
          </p>
          <p className="text-heading-sm text-[var(--color-text-secondary)]">
            {focusedFlight.airline ?? 'Airline not logged'}
          </p>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-[var(--space-md)]">
          <DetailRow label="Departure time" value={focusedFlight.departureTime ?? 'Not logged'} />
          <DetailRow label="Arrival time" value={focusedFlight.arrivalTime ?? 'Not logged'} />
          <DetailRow label="Travel time" value={focusedFlight.flightDuration ?? 'Not logged'} />
          <DetailRow label="Aircraft" value={focusedFlight.aircraftType ?? 'Not logged'} />
          <DetailRow label="Selected flight" value={formatDate(focusedFlight.date)} />
          <DetailRow
            label="Distance"
            value={focusedFlight.distanceMiles ? formatMiles(focusedFlight.distanceMiles) : 'Not logged'}
          />
          <DetailRow label="Seat class" value={formatSeatClass(focusedFlight.seatClass)} />
        </div>

        <div className="grid gap-[var(--space-sm)]">
          <h3 className="label-text text-[var(--color-text-secondary)]">Route history</h3>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
            {historyFlights.map((routeFlight) => (
              <div
                className="grid gap-[var(--space-xs)] border-b border-[var(--color-border-default)] px-[var(--space-md)] py-[var(--space-sm)] last:border-b-0"
                key={routeFlight.id}
              >
                <span className="text-body text-[var(--color-text-primary)]">{formatDate(routeFlight.date)}</span>
                <span className="text-body text-[var(--color-text-secondary)]">
                  {getFlightCode(routeFlight)} · {formatSeatClass(routeFlight.seatClass)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
