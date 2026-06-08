import { BarChart3, List, Plane } from 'lucide-react';
import { FlightsPerYearChart } from '../../charts/FlightsPerYearChart';
import { TopRoutesList } from '../../charts/TopRoutesList';
import { FlightLog } from '../../pages/FlightLog';
import type { Flight } from '../../types/flight';
import type { FlightStats } from '../../utils/flightStats';
import { formatMiles, formatNumber } from '../../utils/format';
import { FlightDetailPanel } from '../composed/FlightDetailPanel';
import { StatCard } from '../composed/StatCard';
import { PillToggle } from '../primitives/PillToggle';

export type SidebarView = 'stats' | 'log';

interface SidebarProps {
  activeFlightId?: string | null;
  flights: Flight[];
  onDeleteFlight: (id: string) => void;
  onBackToFlightLog: () => void;
  onSelectFlight: (id: string | null) => void;
  onViewChange: (view: SidebarView) => void;
  selectedFlight: Flight | null;
  stats: FlightStats;
  view: SidebarView;
}

const viewOptions = [
  { label: 'Stats', value: 'stats' },
  { label: 'Flight Log', value: 'log' },
] satisfies Array<{ label: string; value: SidebarView }>;

export function Sidebar({
  activeFlightId,
  flights,
  onDeleteFlight,
  onBackToFlightLog,
  onSelectFlight,
  onViewChange,
  selectedFlight,
  stats,
  view,
}: SidebarProps) {
  return (
    <aside className="flex h-screen min-h-0 w-[clamp(var(--sidebar-min-width),30vw,var(--sidebar-max-width))] flex-col border-l border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
      <header className="grid gap-[var(--space-lg)] border-b border-[var(--color-border-default)] p-[var(--space-lg)]">
        <div className="flex items-start justify-between gap-[var(--space-md)]">
          <div>
            <p className="label-text text-[var(--color-accent-teal)]">Layover</p>
            <h1 className="text-display text-[var(--color-text-primary)]">Travel Atlas</h1>
          </div>
        </div>
        <PillToggle label="View" onChange={onViewChange} options={viewOptions} value={view} />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-[var(--space-lg)]">
        {view === 'log' && selectedFlight ? (
          <FlightDetailPanel flight={selectedFlight} onBack={onBackToFlightLog} />
        ) : view === 'stats' ? (
          <div className="grid gap-[var(--space-lg)]">
            <div className="grid grid-cols-2 gap-[var(--space-sm)]">
              <StatCard
                accent={<Plane aria-hidden className="h-[var(--icon-size-sm)] w-[var(--icon-size-sm)]" />}
                label="Flights flown"
                value={formatNumber(stats.totalFlights)}
              />
              <StatCard label="Miles flown" value={formatMiles(stats.totalMiles)} />
              <StatCard label="Countries visited" value={formatNumber(stats.countries)} />
              <StatCard label="Hours spent flying" value={formatNumber(stats.timeInAirHours)} />
              <StatCard label="Hours spent laid over" value={formatNumber(stats.layoverHours)} />
              <StatCard label="Airports visited" value={formatNumber(stats.airports)} />
            </div>

            <section className="grid gap-[var(--space-sm)]">
              <h2 className="flex items-center gap-[var(--space-sm)] text-heading-sm text-[var(--color-text-primary)]">
                <BarChart3 aria-hidden className="h-[var(--icon-size-sm)] w-[var(--icon-size-sm)]" />
                Flights per year
              </h2>
              <FlightsPerYearChart data={stats.flightsPerYear} />
            </section>

            <section className="grid gap-[var(--space-sm)]">
              <h2 className="flex items-center gap-[var(--space-sm)] text-heading-sm text-[var(--color-text-primary)]">
                <List aria-hidden className="h-[var(--icon-size-sm)] w-[var(--icon-size-sm)]" />
                Top routes
              </h2>
              <TopRoutesList routes={stats.topRoutes} />
            </section>
          </div>
        ) : (
          <FlightLog
            flights={flights}
            onDeleteFlight={onDeleteFlight}
            onSelectFlight={(id) => onSelectFlight(id)}
            selectedFlightId={activeFlightId}
          />
        )}
      </div>
    </aside>
  );
}
