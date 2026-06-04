import Globe, { type GlobeInstance } from 'globe.gl';
import { useEffect, useMemo, useRef } from 'react';
import { Button } from '../components/primitives/Button';
import type { Airport } from '../types/airport';
import type { Flight } from '../types/flight';
import { FlightDetailCard } from './FlightDetailCard';

const earthNightUrl = new URL('../../node_modules/three-globe/example/img/earth-night.jpg', import.meta.url).href;
const earthTopologyUrl = new URL('../../node_modules/three-globe/example/img/earth-topology.png', import.meta.url).href;

interface GlobeCanvasProps {
  activeFlight: Flight | null;
  activeFlightId?: string | null;
  flights: Flight[];
  onAddTrip: () => void;
  onArcHover: (flightId: string | null) => void;
  onArcSelect: (flightId: string) => void;
  onClearActiveFlight: () => void;
}

interface GlobeArc {
  id: string;
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
    id: flight.id,
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

export function GlobeCanvas({
  activeFlight,
  activeFlightId,
  flights,
  onAddTrip,
  onArcHover,
  onArcSelect,
  onClearActiveFlight,
}: GlobeCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const onArcHoverRef = useRef(onArcHover);
  const onArcSelectRef = useRef(onArcSelect);

  const arcs = useMemo(() => flights.map(toArc), [flights]);
  const points = useMemo(() => {
    const visitedAirports = new Map<string, Airport>();

    flights.forEach((flight) => {
      visitedAirports.set(flight.origin.iata, flight.origin);
      visitedAirports.set(flight.destination.iata, flight.destination);
    });

    return Array.from(visitedAirports.values()).map(toPoint);
  }, [flights]);

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
      .onArcClick((arc) => onArcSelectRef.current((arc as GlobeArc).id))
      .onArcHover((arc) => onArcHoverRef.current(arc ? (arc as GlobeArc).id : null));

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { height, width } = entry.contentRect;
      globe.width(width).height(height);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      globe._destructor?.();
      globeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const globe = globeRef.current;

    if (!globe) {
      return;
    }

    const accentBlue = getToken('--color-accent-blue');
    const accentAmber = getToken('--color-accent-amber');
    const accentTeal = getToken('--color-accent-teal');

    globe
      .arcsData(arcs)
      .arcColor((arc) => {
        const globeArc = arc as GlobeArc;
        return globeArc.id === activeFlightId ? [accentTeal, accentBlue] : [accentBlue, accentAmber];
      })
      .arcAltitude((arc) => ((arc as GlobeArc).id === activeFlightId ? 0.28 : 0.18))
      .arcStroke((arc) => ((arc as GlobeArc).id === activeFlightId ? 0.8 : 0.38))
      .pointsData(points)
      .pointColor((point) => {
        const globePoint = point as GlobePoint;
        const touchesActiveFlight = flights.some(
          (flight) =>
            flight.id === activeFlightId &&
            (flight.origin.iata === globePoint.id || flight.destination.iata === globePoint.id),
        );

        return touchesActiveFlight ? accentTeal : accentAmber;
      });
  }, [activeFlightId, arcs, flights, points]);

  return (
    <section className="relative h-screen min-w-0 flex-1 overflow-hidden bg-[var(--color-bg-base)]">
      <img
        alt="Layover"
        className="pointer-events-none absolute left-[var(--space-xl)] top-[var(--space-lg)] z-10 w-[min(var(--dashboard-logo-width),34vw)]"
        src="/layover-logo-transparent.png"
      />
      <div className="pointer-events-none absolute left-[var(--space-xl)] top-[32vh] z-20">
        {activeFlight ? <FlightDetailCard flight={activeFlight} onClose={onClearActiveFlight} /> : null}
        {!activeFlight && flights.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--empty-state-bg)] px-[var(--space-lg)] py-[var(--space-md)] text-heading-sm text-[var(--color-text-secondary)] backdrop-blur-md">
            No flights logged yet
          </div>
        ) : null}
      </div>
      <div className="absolute bottom-[var(--space-lg)] left-[var(--space-xl)] z-20 flex items-center gap-[var(--space-md)]">
        <Button onClick={onAddTrip} variant="primary">
          Add trip
        </Button>
        <Button className="border-dotted border-[var(--color-accent-teal)] text-[var(--color-accent-teal)]" variant="ghost">
          Share stats
        </Button>
      </div>
      <div className="h-full w-full" ref={containerRef} />
    </section>
  );
}
