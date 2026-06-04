import { FlightRow } from '../components/composed/FlightRow';
import type { Flight } from '../types/flight';

interface FlightLogProps {
  flights: Flight[];
  selectedFlightId?: string | null;
  onDeleteFlight?: (id: string) => void;
  onSelectFlight?: (id: string) => void;
}

function groupFlightsByYear(flights: Flight[]): Array<[string, Flight[]]> {
  const groups = new Map<string, Flight[]>();

  flights.forEach((flight) => {
    const year = new Date(flight.date).getUTCFullYear().toString();
    groups.set(year, [...(groups.get(year) ?? []), flight]);
  });

  return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

export function FlightLog({ flights, onDeleteFlight, onSelectFlight, selectedFlightId }: FlightLogProps) {
  if (flights.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-[var(--space-md)] text-body text-[var(--color-text-secondary)]">
        No flights logged
      </div>
    );
  }

  return (
    <div className="grid gap-[var(--space-lg)]">
      {groupFlightsByYear(flights).map(([year, yearFlights]) => (
        <section className="grid gap-[var(--space-sm)]" key={year}>
          <h3 className="label-text text-[var(--color-text-secondary)]">{year}</h3>
          {yearFlights.map((flight) => (
            <FlightRow
              flight={flight}
              isSelected={selectedFlightId === flight.id}
              key={flight.id}
              onDelete={onDeleteFlight}
              onSelect={onSelectFlight}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
