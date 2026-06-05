import Plane from 'lucide-react/dist/esm/icons/plane.js';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.js';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import type { Flight } from '../../types/flight';
import { cx } from '../../utils/cx';
import { formatDate, formatMiles } from '../../utils/format';

interface FlightRowProps {
  flight: Flight;
  isSelected?: boolean;
  onDelete?: (id: string) => void;
  onSelect?: (id: string) => void;
}

export function FlightRow({ flight, isSelected = false, onDelete, onSelect }: FlightRowProps) {
  const route = `${flight.origin.iata} → ${flight.destination.iata}`;

  return (
    <div
      className={cx(
        'grid min-h-[var(--table-row-height)] grid-cols-[1fr_auto] items-center gap-[var(--space-md)] rounded-[var(--radius-md)] border px-[var(--space-md)] py-[var(--space-sm)] transition',
        isSelected
          ? 'border-[var(--color-accent-blue)] bg-[var(--color-bg-elevated)]'
          : 'border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:border-[var(--color-accent-blue)]',
      )}
    >
      <button className="grid gap-[var(--space-xs)] text-left" onClick={() => onSelect?.(flight.id)} type="button">
        <span className="flex items-center gap-[var(--space-sm)] text-heading-sm text-[var(--color-text-primary)]">
          <Plane aria-hidden className="h-[var(--icon-size-sm)] w-[var(--icon-size-sm)]" />
          {route}
        </span>
        <span className="text-body text-[var(--color-text-secondary)]">
          {formatDate(flight.date)}
          {flight.distanceMiles ? ` · ${formatMiles(flight.distanceMiles)}` : ''}
        </span>
      </button>
      <div className="flex items-center gap-[var(--space-sm)]">
        {flight.seatClass ? <Badge tone="neutral">{flight.seatClass.replace('_', ' ')}</Badge> : null}
        {onDelete ? (
          <Button
            aria-label={`Delete ${route}`}
            icon={<Trash2 aria-hidden className="h-[var(--icon-size-sm)] w-[var(--icon-size-sm)]" />}
            onClick={() => onDelete(flight.id)}
            size="icon"
            variant="ghost"
          />
        ) : null}
      </div>
    </div>
  );
}
