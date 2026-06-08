import { ArrowLeft, Plane } from 'lucide-react';
import type { Flight } from '../../types/flight';
import { formatDate, formatMiles, formatSeatClass } from '../../utils/format';
import { Button } from '../primitives/Button';

interface FlightDetailPanelProps {
  flight: Flight;
  onBack: () => void;
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

export function FlightDetailPanel({ flight, onBack }: FlightDetailPanelProps) {
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
            {flight.origin.iata} → {flight.destination.iata}
          </h2>
          <p className="text-heading-sm text-[var(--color-accent-amber)]">
            {flight.origin.city} → {flight.destination.city}
          </p>
          <p className="flex items-center gap-[var(--space-sm)] font-mono text-heading-sm text-[var(--color-text-primary)]">
            <Plane aria-hidden className="h-[var(--icon-size-sm)] w-[var(--icon-size-sm)]" />
            {getFlightCode(flight)}
          </p>
          <p className="text-heading-sm text-[var(--color-text-secondary)]">{flight.airline ?? 'Airline not logged'}</p>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-[var(--space-md)]">
          <DetailRow label="Departure time" value={flight.departureTime ?? 'Not logged'} />
          <DetailRow label="Arrival time" value={flight.arrivalTime ?? 'Not logged'} />
          <DetailRow label="Travel time" value={flight.flightDuration ?? 'Not logged'} />
          <DetailRow label="Aircraft" value={flight.aircraftType ?? 'Not logged'} />
          <DetailRow label="Last flown" value={formatDate(flight.date)} />
          <DetailRow label="Distance" value={flight.distanceMiles ? formatMiles(flight.distanceMiles) : 'Not logged'} />
          <DetailRow label="Seat class" value={formatSeatClass(flight.seatClass)} />
        </div>
      </section>
    </div>
  );
}
