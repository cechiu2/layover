import { lazy, Suspense, useMemo, useState } from 'react';
import { GlobeCanvas } from '../globe/GlobeCanvas';
import { Sidebar, type SidebarView } from '../components/layout/Sidebar';
import { SlideOver } from '../components/layout/SlideOver';
import { deleteFlight, saveFlights, saveTrip } from '../data/db';
import type { Flight, FlightInput } from '../types/flight';
import { calculateFlightStats } from '../utils/flightStats';

const AddFlightPanel = lazy(() =>
  import('../features/addFlight/AddFlightPanel').then((module) => ({ default: module.AddFlightPanel })),
);

interface DashboardProps {
  flights: Flight[];
}

type ActivePanel = 'add' | null;

export function Dashboard({ flights }: DashboardProps) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [hoveredFlightId, setHoveredFlightId] = useState<string | null>(null);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [view, setView] = useState<SidebarView>('stats');
  const stats = useMemo(() => calculateFlightStats(flights), [flights]);
  const activeFlightId = hoveredFlightId ?? selectedFlightId;
  const selectedFlight = useMemo(
    () => flights.find((flight) => flight.id === selectedFlightId) ?? null,
    [selectedFlightId, flights],
  );

  async function handleSaveTrip(flightsToSave: FlightInput[]) {
    await saveTrip(flightsToSave);
    setActivePanel(null);
  }

  async function handleImportFlights(importedFlights: FlightInput[]) {
    await saveFlights(importedFlights);
  }

  async function handleDeleteFlight(id: string) {
    await deleteFlight(id);
    setHoveredFlightId((currentId) => (currentId === id ? null : currentId));
    setSelectedFlightId((currentId) => (currentId === id ? null : currentId));
  }

  return (
    <main className="flex h-screen min-w-[calc(var(--sidebar-min-width)*2)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <GlobeCanvas
        activeFlightId={activeFlightId}
        flights={flights}
        onAddTrip={() => setActivePanel('add')}
        onArcHover={setHoveredFlightId}
        onArcSelect={(id) => {
          setHoveredFlightId(null);
          setSelectedFlightId(id);
          setView('log');
        }}
      />
      <Sidebar
        activeFlightId={activeFlightId}
        flights={flights}
        onDeleteFlight={handleDeleteFlight}
        onBackToFlightLog={() => {
          setHoveredFlightId(null);
          setSelectedFlightId(null);
        }}
        onSelectFlight={(id) => {
          setHoveredFlightId(null);
          setSelectedFlightId(id);
        }}
        onViewChange={setView}
        selectedFlight={selectedFlight}
        stats={stats}
        view={view}
      />

      <SlideOver isOpen={activePanel === 'add'} onClose={() => setActivePanel(null)} title="Add trip" variant="modal">
        <Suspense fallback={null}>
          <AddFlightPanel onCancel={() => setActivePanel(null)} onImport={handleImportFlights} onSave={handleSaveTrip} />
        </Suspense>
      </SlideOver>
    </main>
  );
}
