import { X } from 'lucide-react';
import type { Flight } from '../types/flight';
import { Button } from '../components/primitives/Button';
import { formatDate, formatMiles, formatSeatClass } from '../utils/format';

interface FlightDetailCardProps {
  flight: Flight;
  onClose: () => void;
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
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-[var(--space-xs)] text-body">
      <span className="rounded-[var(--radius-full)] border border-dotted border-[var(--color-accent-amber)] px-[var(--space-sm)] py-[var(--space-xs)] text-[var(--color-accent-amber)]">
        {label}
      </span>
      <span className="h-0 border-t border-dotted border-[var(--color-accent-amber)]" />
      <span className="rounded-[var(--radius-full)] border border-dotted border-[var(--color-accent-amber)] px-[var(--space-sm)] py-[var(--space-xs)] text-[var(--color-accent-amber)]">
        {value}
      </span>
    </div>
  );
}

export function FlightDetailCard({ flight, onClose }: FlightDetailCardProps) {
  return (
    <article className="pointer-events-auto w-[var(--flight-detail-card-width)] max-w-[var(--flight-detail-card-max-width)] rounded-[var(--radius-lg)] border border-[var(--glass-card-border)] bg-[var(--glass-card-bg)] p-[var(--space-lg)] shadow-[var(--flight-detail-shadow)] backdrop-blur-md">
      <div className="flex justify-end">
        <Button
          aria-label="Close flight detail"
          icon={<X aria-hidden className="h-[var(--icon-size-md)] w-[var(--icon-size-md)]" />}
          onClick={onClose}
          size="icon"
          variant="ghost"
        />
      </div>

      <div className="grid justify-items-center gap-[var(--space-xs)] text-center">
        <h2 className="text-display text-[var(--color-accent-teal)]">
          {flight.origin.iata} → {flight.destination.iata}
        </h2>
        <p className="text-heading-sm text-[var(--color-accent-amber)]">
          {flight.origin.city} → {flight.destination.city}
        </p>
        <p className="font-mono text-heading-sm text-[var(--color-text-primary)]">{getFlightCode(flight)}</p>
        <p className="text-heading-sm text-[var(--color-text-secondary)]">{flight.airline ?? 'Airline not logged'}</p>
      </div>

      <div className="mt-[var(--space-lg)] grid gap-[var(--space-sm)]">
        <DetailRow label="Departure time" value={flight.departureTime ?? 'Not logged'} />
        <DetailRow label="Arrival time" value={flight.arrivalTime ?? 'Not logged'} />
        <DetailRow label="Travel time" value={flight.flightDuration ?? 'Not logged'} />
        <DetailRow label="Aircraft" value={flight.aircraftType ?? 'Not logged'} />
        <DetailRow label="Last flown" value={formatDate(flight.date)} />
        <DetailRow label="Distance" value={flight.distanceMiles ? formatMiles(flight.distanceMiles) : 'Not logged'} />
        <DetailRow label="Seat class" value={formatSeatClass(flight.seatClass)} />
      </div>
    </article>
  );
}
