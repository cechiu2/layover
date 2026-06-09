import { useMemo, useState } from 'react';
import { LoginPanel } from '../auth/LoginPanel';
import { AddFlightPanel } from '../features/addFlight/AddFlightPanel';
import { GlobeCanvas } from '../globe/GlobeCanvas';
import { Sidebar, type SidebarView } from '../components/layout/Sidebar';
import { SlideOver } from '../components/layout/SlideOver';
import { deleteFlight, saveFlights, saveTrip } from '../data/db';
import type { Flight, FlightInput } from '../types/flight';
import { calculateFlightStats } from '../utils/flightStats';
import { getRouteKey } from '../utils/routeKey';

interface DashboardProps {
  flights: Flight[];
}

type ActivePanel = 'add' | 'login' | null;

export function Dashboard({ flights }: DashboardProps) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [hoveredFlightId, setHoveredFlightId] = useState<string | null>(null);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [selectedRouteKey, setSelectedRouteKey] = useState<string | null>(null);
  const [view, setView] = useState<SidebarView>('stats');
  const stats = useMemo(() => calculateFlightStats(flights), [flights]);
  const activeFlightId = hoveredFlightId ?? selectedFlightId;
  const selectedRouteFlights = useMemo(
    () =>
      selectedRouteKey
        ? flights
            .filter((flight) => getRouteKey(flight) === selectedRouteKey)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : null,
    [flights, selectedRouteKey],
  );

  function selectFlightRoute(id: string | null) {
    if (!id) {
      setSelectedFlightId(null);
      setSelectedRouteKey(null);
      return;
    }

    const flight = flights.find((candidate) => candidate.id === id);
    if (!flight) {
      return;
    }

    setSelectedFlightId(id);
    setSelectedRouteKey(getRouteKey(flight));
  }

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
    if (selectedRouteFlights?.some((flight) => flight.id === id) && selectedRouteFlights.length <= 1) {
      setSelectedFlightId(null);
      setSelectedRouteKey(null);
    } else {
      setSelectedFlightId((currentId) =>
        currentId === id ? selectedRouteFlights?.find((flight) => flight.id !== id)?.id ?? null : currentId,
      );
    }
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
          selectFlightRoute(id);
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
          setSelectedRouteKey(null);
        }}
        onSelectFlight={(id) => {
          setHoveredFlightId(null);
          selectFlightRoute(id);
        }}
        onShowLogin={() => setActivePanel('login')}
        onViewChange={setView}
        selectedRouteFlights={selectedRouteFlights}
        selectedRouteKey={selectedRouteKey}
        stats={stats}
        view={view}
      />

      <SlideOver isOpen={activePanel === 'add'} onClose={() => setActivePanel(null)} title="Add trip" variant="modal">
        <AddFlightPanel onCancel={() => setActivePanel(null)} onImport={handleImportFlights} onSave={handleSaveTrip} />
      </SlideOver>
      <SlideOver isOpen={activePanel === 'login'} onClose={() => setActivePanel(null)} title="Account">
        <LoginPanel onDone={() => setActivePanel(null)} />
      </SlideOver>
    </main>
  );
}
