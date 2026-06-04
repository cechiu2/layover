import { Badge } from '../components/primitives/Badge';
import type { TopRoute } from '../utils/flightStats';
import { formatMiles } from '../utils/format';

interface TopRoutesListProps {
  routes: TopRoute[];
}

export function TopRoutesList({ routes }: TopRoutesListProps) {
  if (routes.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-[var(--space-md)] text-body text-[var(--color-text-secondary)]">
        No routes yet
      </div>
    );
  }

  return (
    <div className="grid gap-[var(--space-sm)]">
      {routes.map((route) => (
        <div
          className="grid grid-cols-[1fr_auto] items-center gap-[var(--space-md)] rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-[var(--space-md)]"
          key={route.key}
        >
          <div className="grid gap-[var(--space-xs)]">
            <span className="font-mono text-mono text-[var(--color-text-primary)]">
              {route.origin.iata} ↔ {route.destination.iata}
            </span>
            <span className="text-body text-[var(--color-text-secondary)]">{formatMiles(route.miles)}</span>
          </div>
          <Badge tone="teal">{route.flights}</Badge>
        </div>
      ))}
    </div>
  );
}
