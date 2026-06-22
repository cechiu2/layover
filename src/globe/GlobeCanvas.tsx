import { useEffect, useMemo, useRef } from 'react';
import { Button } from '../components/primitives/Button';
import type { Airport } from '../types/airport';
import type { Flight } from '../types/flight';
import { getRouteKey } from '../utils/routeKey';

const earthNightUrl = '/vendor/earth-night.jpg';
const earthTopologyUrl = '/vendor/earth-topology.png';

interface GlobeInstance {
  _destructor?: () => void;
  arcAltitude(value: (arc: unknown) => number): GlobeInstance;
  arcColor(value: (arc: unknown) => string[]): GlobeInstance;
  arcDashAnimateTime(value: number): GlobeInstance;
  arcDashGap(value: number): GlobeInstance;
  arcDashInitialGap(value: () => number): GlobeInstance;
  arcDashLength(value: number): GlobeInstance;
  arcEndLat(value: (arc: unknown) => number): GlobeInstance;
  arcEndLng(value: (arc: unknown) => number): GlobeInstance;
  arcStartLat(value: (arc: unknown) => number): GlobeInstance;
  arcStartLng(value: (arc: unknown) => number): GlobeInstance;
  arcStroke(value: (arc: unknown) => number): GlobeInstance;
  arcsData(value: GlobeArc[]): GlobeInstance;
  arcsTransitionDuration(value: number): GlobeInstance;
  atmosphereAltitude(value: number): GlobeInstance;
  atmosphereColor(value: string): GlobeInstance;
  backgroundColor(value: string): GlobeInstance;
  bumpImageUrl(value: string): GlobeInstance;
  controls(): {
    autoRotate: boolean;
    autoRotateSpeed: number;
    dampingFactor: number;
    enableDamping: boolean;
    maxDistance: number;
    minDistance: number;
  };
  globeImageUrl(value: string): GlobeInstance;
  globeMaterial(): { shininess: number };
  height(value: number): GlobeInstance;
  onArcClick(value: (arc: unknown) => void): GlobeInstance;
  onArcHover(value: (arc: unknown | null) => void): GlobeInstance;
  pointAltitude(value: number): GlobeInstance;
  pointColor(value: (point: unknown) => string): GlobeInstance;
  pointLat(value: (point: unknown) => number): GlobeInstance;
  pointLng(value: (point: unknown) => number): GlobeInstance;
  pointOfView(value: { altitude: number; lat: number; lng: number }, ms: number): GlobeInstance;
  pointRadius(value: number): GlobeInstance;
  pointsData(value: GlobePoint[]): GlobeInstance;
  pointsMerge(value: boolean): GlobeInstance;
  showAtmosphere(value: boolean): GlobeInstance;
  width(value: number): GlobeInstance;
}

interface GlobeFactory {
  (options: { animateIn: boolean; waitForGlobeReady: boolean }): (container: HTMLElement) => GlobeInstance;
}

let globeLoadPromise: Promise<GlobeFactory> | null = null;

function loadGlobe(): Promise<GlobeFactory> {
  if (!globeLoadPromise) {
    globeLoadPromise = import('globe.gl').then((module) => module.default as GlobeFactory);
  }

  return globeLoadPromise;
}

interface GlobeCanvasProps {
  activeFlightId?: string | null;
  flights: Flight[];
  onAddTrip: () => void;
  onArcHover: (flightId: string | null) => void;
  onArcSelect: (flightId: string) => void;
}

interface GlobeArc {
  flightId: string;
  id: string;
  routeKey: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
}

interface GlobePoint {
  id: string;
  lat: number;
  lng: number;
}

function getToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function toArc(flight: Flight): GlobeArc {
  return {
    flightId: flight.id,
    id: getRouteKey(flight),
    routeKey: getRouteKey(flight),
    startLat: flight.origin.lat,
    startLng: flight.origin.lon,
    endLat: flight.destination.lat,
    endLng: flight.destination.lon,
  };
}

function toPoint(airport: Airport): GlobePoint {
  return {
    id: airport.iata,
    lat: airport.lat,
    lng: airport.lon,
  };
}

function getFlightDateTime(flight: Flight): number {
  return new Date(flight.date).getTime();
}

function getRouteArcs(flights: Flight[]): GlobeArc[] {
  const routeFlights = new Map<string, Flight>();

  flights.forEach((flight) => {
    const routeKey = getRouteKey(flight);
    const existingFlight = routeFlights.get(routeKey);

    if (!existingFlight || getFlightDateTime(flight) > getFlightDateTime(existingFlight)) {
      routeFlights.set(routeKey, flight);
    }
  });

  return Array.from(routeFlights.values()).map(toArc);
}

function applyGlobeData(
  globe: GlobeInstance,
  arcs: GlobeArc[],
  points: GlobePoint[],
  flights: Flight[],
  activeFlightId: string | null | undefined,
) {
  const accentBlue = getToken('--color-accent-blue');
  const accentAmber = getToken('--color-accent-amber');
  const accentTeal = getToken('--color-accent-teal');
  const activeFlight = flights.find((flight) => flight.id === activeFlightId);
  const activeRouteKey = activeFlight ? getRouteKey(activeFlight) : null;

  globe
    .arcsData(arcs)
    .arcColor((arc) => {
      const globeArc = arc as GlobeArc;
      return globeArc.routeKey === activeRouteKey ? [accentTeal, accentBlue] : [accentBlue, accentAmber];
    })
    .arcAltitude((arc) => ((arc as GlobeArc).routeKey === activeRouteKey ? 0.28 : 0.18))
    .arcStroke((arc) => ((arc as GlobeArc).routeKey === activeRouteKey ? 0.8 : 0.38))
    .pointsData(points)
    .pointColor((point) => {
      const globePoint = point as GlobePoint;
      const touchesActiveFlight = flights.some(
        (flight) =>
          getRouteKey(flight) === activeRouteKey &&
          (flight.origin.iata === globePoint.id || flight.destination.iata === globePoint.id),
      );
      return touchesActiveFlight ? accentTeal : accentAmber;
    });
}

export function GlobeCanvas({
  activeFlightId,
  flights,
  onAddTrip,
  onArcHover,
  onArcSelect,
}: GlobeCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const onArcHoverRef = useRef(onArcHover);
  const onArcSelectRef = useRef(onArcSelect);

  const arcs = useMemo(() => getRouteArcs(flights), [flights]);
  const points = useMemo(() => {
    const visitedAirports = new Map<string, Airport>();

    flights.forEach((flight) => {
      visitedAirports.set(flight.origin.iata, flight.origin);
      visitedAirports.set(flight.destination.iata, flight.destination);
    });

    return Array.from(visitedAirports.values()).map(toPoint);
  }, [flights]);

  // Keep refs to the latest data so the init effect can apply it once the globe is ready
  const arcsRef = useRef(arcs);
  const pointsRef = useRef(points);
  const flightsRef = useRef(flights);
  const activeFlightIdRef = useRef(activeFlightId);

  useEffect(() => { arcsRef.current = arcs; }, [arcs]);
  useEffect(() => { pointsRef.current = points; }, [points]);
  useEffect(() => { flightsRef.current = flights; }, [flights]);
  useEffect(() => { activeFlightIdRef.current = activeFlightId; }, [activeFlightId]);

  useEffect(() => {
    onArcHoverRef.current = onArcHover;
  }, [onArcHover]);

  useEffect(() => {
    onArcSelectRef.current = onArcSelect;
  }, [onArcSelect]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    let isCancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    loadGlobe()
      .then((Globe) => {
        if (isCancelled) {
          return;
        }

        const globe = Globe({ animateIn: false, waitForGlobeReady: true })(container);
        const bgBase = getToken('--color-bg-base');
        const accentBlue = getToken('--color-accent-blue');

        globeRef.current = globe;

        globe
          .backgroundColor(bgBase)
          .globeImageUrl(earthNightUrl)
          .bumpImageUrl(earthTopologyUrl)
          .showAtmosphere(true)
          .atmosphereColor(accentBlue)
          .atmosphereAltitude(Number(getToken('--globe-atmosphere-altitude')))
          .pointOfView({ lat: 28, lng: -45, altitude: 2.1 }, 0);

        const material = globe.globeMaterial();
        material.shininess = 0;

        globe.controls().autoRotate = true;
        globe.controls().autoRotateSpeed = 0.35;
        globe.controls().enableDamping = true;
        globe.controls().dampingFactor = 0.05;
        globe.controls().minDistance = 160;
        globe.controls().maxDistance = 520;

        globe
          .arcStartLat((arc) => (arc as GlobeArc).startLat)
          .arcStartLng((arc) => (arc as GlobeArc).startLng)
          .arcEndLat((arc) => (arc as GlobeArc).endLat)
          .arcEndLng((arc) => (arc as GlobeArc).endLng)
          .arcDashLength(0.42)
          .arcDashGap(0.18)
          .arcDashInitialGap(() => Math.random())
          .arcDashAnimateTime(2600)
          .arcsTransitionDuration(800)
          .pointLat((point) => (point as GlobePoint).lat)
          .pointLng((point) => (point as GlobePoint).lng)
          .pointAltitude(0.012)
          .pointRadius(0.18)
          .pointsMerge(true)
          .onArcClick((arc) => onArcSelectRef.current((arc as GlobeArc).flightId))
          .onArcHover((arc) => onArcHoverRef.current(arc ? (arc as GlobeArc).flightId : null));

        resizeObserver = new ResizeObserver(([entry]) => {
          const { height, width } = entry.contentRect;
          globe.width(width).height(height);
        });

        resizeObserver.observe(container);

        applyGlobeData(globe, arcsRef.current, pointsRef.current, flightsRef.current, activeFlightIdRef.current);
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      isCancelled = true;
      resizeObserver?.disconnect();
      globeRef.current?._destructor?.();
      globeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    applyGlobeData(globe, arcs, points, flights, activeFlightId);
  }, [activeFlightId, arcs, flights, points]);

  return (
    <section className="relative h-screen min-w-0 flex-1 overflow-hidden bg-[var(--color-bg-base)]">
      <img
        alt="Layover"
        className="pointer-events-none absolute left-[var(--space-md)] top-[var(--space-md)] z-10 w-[min(255px,16.5vw)]"
        src="/layover-logo-transparent.png"
      />
      <div className="pointer-events-none absolute left-[var(--space-xl)] top-[32vh] z-20">
        {flights.length === 0 ? (
          <div className="pointer-events-auto grid max-w-[360px] gap-[var(--space-sm)] rounded-[var(--radius-lg)] border border-[var(--glass-card-border)] bg-[var(--empty-state-bg)] px-[var(--space-lg)] py-[var(--space-md)] backdrop-blur-md">
            <h1 className="text-display text-[var(--color-text-primary)]">Start your travel atlas</h1>
            <p className="text-body text-[var(--color-text-secondary)]">Add your first flight to draw your first route.</p>
            <div className="pt-[var(--space-xs)]">
              <Button onClick={onAddTrip} variant="primary">
                Add trip
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      {flights.length > 0 ? (
        <div className="absolute bottom-[var(--space-lg)] left-[var(--space-xl)] z-20 flex items-center gap-[var(--space-md)]">
          <Button onClick={onAddTrip} variant="primary">
            Add trip
          </Button>
        </div>
      ) : null}
      <div className="h-full w-full" ref={containerRef} />
    </section>
  );
}
