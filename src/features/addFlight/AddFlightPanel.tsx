import { ArrowRight, Plus, Trash2, UploadCloud } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type SelectHTMLAttributes } from 'react';
import { Button } from '../../components/primitives/Button';
import { Input } from '../../components/primitives/Input';
import { CSVImport } from '../importFlights/CSVImport';
import type { Airport } from '../../types/airport';
import type { FlightInput, SeatClass } from '../../types/flight';
import { cx } from '../../utils/cx';
import { AirportInput } from './AirportInput';
import { lookupFlight, type FlightLookupMatch } from './flightLookup';
import { findAirportByIata } from '../../data/airports';

interface AddFlightPanelProps {
  onCancel: () => void;
  onImport: (flights: FlightInput[]) => Promise<void>;
  onSave: (flights: FlightInput[]) => Promise<void>;
}

interface TripSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
}

interface TripLegDraft {
  id: string;
  origin: Airport | null;
  destination: Airport | null;
  date: string;
  airline: string;
  flightNumber: string;
  seatClass: SeatClass;
  aircraftType: string;
  departureTime: string;
  arrivalTime: string;
  arrivalDate: string;  // local date at destination from API, YYYY-MM-DD
  durationHours: string;
  durationMinutes: string;
}

interface LookupState {
  key?: string;
  matches?: FlightLookupMatch[];
  message?: string;
  status: 'idle' | 'loading' | 'multiple' | 'not-found' | 'error';
}

const aircraftOptions = ['Airbus A321neo', 'Airbus A320', 'Boeing 737', 'Boeing 757', 'Boeing 787', 'Embraer 175'];

const cabinClassOptions: Array<{ label: string; value: SeatClass }> = [
  { label: 'Economy', value: 'economy' },
  { label: 'Premium economy', value: 'premium_economy' },
  { label: 'Business', value: 'business' },
  { label: 'First', value: 'first' },
];

function createEmptyLeg(previousLeg?: TripLegDraft): TripLegDraft {
  return {
    id: crypto.randomUUID(),
    origin: previousLeg?.destination ?? null,
    destination: null,
    date: previousLeg?.date ?? '',
    airline: '',
    flightNumber: '',
    seatClass: previousLeg?.seatClass ?? 'economy',
    aircraftType: '',
    departureTime: '',
    arrivalTime: '',
    arrivalDate: '',
    durationHours: '',
    durationMinutes: '',
  };
}

function TripSelect({ className, label, options, ...props }: TripSelectProps) {
  const hasValue = Boolean(props.value);

  return (
    <label className="grid gap-[var(--space-sm)]">
      <span className="label-text text-[var(--color-accent-amber)]">{label}</span>
      <select
        className={cx(
          'h-[var(--control-height)] w-full rounded-[var(--radius-sm)] border border-transparent bg-[var(--color-text-primary)] px-[var(--space-sm)] text-body text-[var(--color-bg-base)] outline-none transition focus:border-[var(--color-accent-teal)]',
          hasValue ? 'text-[var(--color-bg-base)]' : 'text-[var(--color-text-secondary)]',
          className,
        )}
        {...props}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function formatDuration(hours: string, minutes: string): string | undefined {
  if (!hours && !minutes) {
    return undefined;
  }

  return `${parseInt(hours, 10) || 0}h ${String(parseInt(minutes, 10) || 0).padStart(2, '0')}m`;
}

function normalizeDurationHours(value: string): string {
  return value.replace(/\D/g, '').slice(0, 2);
}

function normalizeDurationMinutes(value: string, previousValue: string): string {
  const minutes = value.replace(/\D/g, '').slice(0, 2);

  if (Number(minutes) > 59) {
    return previousValue;
  }

  return minutes;
}

function splitDurationMinutes(durationMinutes: number): Pick<TripLegDraft, 'durationHours' | 'durationMinutes'> {
  return {
    durationHours: String(Math.floor(durationMinutes / 60)),
    durationMinutes: String(durationMinutes % 60).padStart(2, '0'),
  };
}

// Returns the local arrival date (YYYY-MM-DD) for a leg.
// Priority: API arrivalDate > departure date + duration math > cross-midnight heuristic > departure date.
function getArrivalDate(leg: TripLegDraft): string | null {
  if (!leg.date) return null;
  if (leg.arrivalDate) return leg.arrivalDate;

  const [depH, depM] = leg.departureTime.split(':').map(Number);
  if (!leg.departureTime || !Number.isFinite(depH) || !Number.isFinite(depM)) return leg.date;

  const durH = parseInt(leg.durationHours, 10) || 0;
  const durM = parseInt(leg.durationMinutes, 10) || 0;
  const hasDuration = durH > 0 || durM > 0;

  const dayOffset = hasDuration
    ? Math.floor((depH * 60 + depM + durH * 60 + durM) / 1440)
    : leg.arrivalTime && leg.arrivalTime < leg.departureTime
      ? 1
      : 0;

  if (dayOffset === 0) return leg.date;

  const d = new Date(`${leg.date}T00:00:00`);
  if (Number.isNaN(d.valueOf())) return null;
  d.setDate(d.getDate() + dayOffset);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${dy}`;
}

function computeArrivalDayOffset(leg: TripLegDraft): number {
  if (!leg.date) {
    return leg.departureTime && leg.arrivalTime && leg.arrivalTime < leg.departureTime ? 1 : 0;
  }
  const arrivalDate = getArrivalDate(leg);
  if (!arrivalDate || arrivalDate === leg.date) return 0;
  const dep = new Date(leg.date);
  const arr = new Date(arrivalDate);
  if (Number.isNaN(dep.valueOf()) || Number.isNaN(arr.valueOf())) return 0;
  return Math.max(0, Math.round((arr.valueOf() - dep.valueOf()) / 86400000));
}

function formatLookupMatch(match: FlightLookupMatch): string {
  const route = `${match.originIata} to ${match.destinationIata}`;
  const times = match.departureTime && match.arrivalTime ? ` - ${match.departureTime}-${match.arrivalTime}` : '';
  const aircraft = match.aircraftType ? ` - ${match.aircraftType}` : '';

  return `${route}${times}${aircraft}`;
}

function getDateTimeMinutes(date: string, time: string): number | null {
  if (!date || !time) {
    return null;
  }

  const [hours, minutes] = time.split(':').map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  const value = new Date(`${date}T00:00:00`);

  if (Number.isNaN(value.valueOf())) {
    return null;
  }

  return Math.floor(value.valueOf() / 60000) + hours * 60 + minutes;
}

function getLayoverMinutes(previousLeg: TripLegDraft, nextLeg: TripLegDraft): number | undefined {
  const prevArrivalDate = getArrivalDate(previousLeg);
  const previousArrival = getDateTimeMinutes(prevArrivalDate ?? '', previousLeg.arrivalTime);
  const nextDeparture = getDateTimeMinutes(nextLeg.date, nextLeg.departureTime);

  if (previousArrival === null || nextDeparture === null) return undefined;

  return Math.max(0, nextDeparture - previousArrival);
}

export function AddFlightPanel({ onCancel, onImport, onSave }: AddFlightPanelProps) {
  const [mode, setMode] = useState<'form' | 'import'>('form');
  const [legs, setLegs] = useState<TripLegDraft[]>(() => [createEmptyLeg()]);
  const [lookupStates, setLookupStates] = useState<Record<string, LookupState>>({});
  const lookupKeys = useRef<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const canSave = legs.every((leg) => leg.origin && leg.destination && leg.date);

  function updateLeg(id: string, update: Partial<TripLegDraft>) {
    setLegs((currentLegs) => currentLegs.map((leg) => (leg.id === id ? { ...leg, ...update } : leg)));
  }

  function removeLeg(id: string) {
    setLegs((currentLegs) => (currentLegs.length === 1 ? currentLegs : currentLegs.filter((leg) => leg.id !== id)));
  }

  function addLayoverLeg() {
    setLegs((currentLegs) => [...currentLegs, createEmptyLeg(currentLegs[currentLegs.length - 1])]);
  }

  function getLookupKey(leg: TripLegDraft): string | null {
    if (!leg.airline || !leg.flightNumber || !leg.origin || !leg.date) {
      return null;
    }

    return `${leg.airline.trim().toUpperCase()}|${leg.flightNumber.trim()}|${leg.origin.iata}|${leg.date}`;
  }

  function applyLookupMatch(legId: string, match: FlightLookupMatch) {
    const destination = findAirportByIata(match.destinationIata);

    setLegs((currentLegs) =>
      currentLegs.map((leg) => {
        if (leg.id !== legId) {
          return leg;
        }

        return {
          ...leg,
          aircraftType: match.aircraftType ?? leg.aircraftType,
          airline: match.carrierCode ?? leg.airline,
          arrivalTime: match.arrivalTime ?? leg.arrivalTime,
          arrivalDate: match.arrivalDate ?? leg.arrivalDate,
          departureTime: match.departureTime ?? leg.departureTime,
          destination: destination ?? leg.destination,
          flightNumber: match.flightNumber ?? leg.flightNumber,
          ...(typeof match.durationMinutes === 'number' ? splitDurationMinutes(match.durationMinutes) : {}),
        };
      }),
    );

    setLookupStates((currentStates) => ({
      ...currentStates,
      [legId]: {
        key: currentStates[legId]?.key,
        message: destination ? 'Flight details filled.' : `Found flight, but ${match.destinationIata} is not in the airport list.`,
        status: destination ? 'idle' : 'error',
      },
    }));
  }

  useEffect(() => {
    legs.forEach((leg) => {
      if (!leg.departureTime || !leg.arrivalTime) return;
      // Use numeric check so "0" / "00" don't block re-computation
      const existingH = parseInt(leg.durationHours, 10) || 0;
      const existingM = parseInt(leg.durationMinutes, 10) || 0;
      if (existingH !== 0 || existingM !== 0) return;

      const [depH, depM] = leg.departureTime.split(':').map(Number);
      const [arrH, arrM] = leg.arrivalTime.split(':').map(Number);

      if ([depH, depM, arrH, arrM].some((n) => !Number.isFinite(n))) return;

      let diff = (arrH * 60 + arrM) - (depH * 60 + depM);
      if (diff < 0) diff += 24 * 60;
      if (diff === 0) return; // don't store zero duration

      updateLeg(leg.id, splitDurationMinutes(diff));
    });
  }, [legs.map((l) => `${l.id}|${l.departureTime}|${l.arrivalTime}`).join(',')]);

  useEffect(() => {
    const timeouts: number[] = [];
    let isCancelled = false;

    legs.forEach((leg) => {
      const key = getLookupKey(leg);

      if (!key) {
        delete lookupKeys.current[leg.id];
        setLookupStates((currentStates) => {
          if (!currentStates[leg.id]) {
            return currentStates;
          }

          const nextStates = { ...currentStates };
          delete nextStates[leg.id];
          return nextStates;
        });
        return;
      }

      if (lookupKeys.current[leg.id] === key) {
        return;
      }

      lookupKeys.current[leg.id] = key;

      setLookupStates((currentStates) => ({
        ...currentStates,
        [leg.id]: {
          key,
          status: 'loading',
        },
      }));

      const timeout = window.setTimeout(async () => {
        try {
          const matches = await lookupFlight({
            carrierCode: leg.airline.trim().toUpperCase(),
            departureDate: leg.date,
            flightNumber: leg.flightNumber.trim(),
            originIata: leg.origin?.iata ?? '',
          });

          if (isCancelled) {
            return;
          }

          if (matches.length === 0) {
            setLookupStates((currentStates) => ({
              ...currentStates,
              [leg.id]: {
                key,
                message: 'No matching flight found.',
                status: 'not-found',
              },
            }));
            return;
          }

          if (matches.length === 1) {
            applyLookupMatch(leg.id, matches[0]);
            return;
          }

          setLookupStates((currentStates) => ({
            ...currentStates,
            [leg.id]: {
              key,
              matches,
              status: 'multiple',
            },
          }));
        } catch (error) {
          if (isCancelled) {
            return;
          }

          setLookupStates((currentStates) => ({
            ...currentStates,
            [leg.id]: {
              key,
              message: error instanceof Error ? error.message : 'Flight lookup failed.',
              status: 'error',
            },
          }));
        }
      }, 450);

      timeouts.push(timeout);
    });

    return () => {
      isCancelled = true;
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [legs]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSave) {
      return;
    }

const flights = legs.flatMap((leg, index): FlightInput[] => {
      if (!leg.origin || !leg.destination) {
        return [];
      }

      return [
        {
          aircraftType: leg.aircraftType || undefined,
          airline: leg.airline || undefined,
          arrivalTime: leg.arrivalTime || undefined,
          date: leg.date,
          departureTime: leg.departureTime || undefined,
          destination: leg.destination,
          flightDuration: formatDuration(leg.durationHours, leg.durationMinutes),
          flightNumber: leg.flightNumber.trim() || undefined,
          layoverMinutes: index > 0 ? getLayoverMinutes(legs[index - 1], leg) : undefined,
          origin: leg.origin,
          seatClass: leg.seatClass,
        },
      ];
    });

    setIsSaving(true);

    try {
      await onSave(flights);
    } finally {
      setIsSaving(false);
    }
  }

  if (mode === 'import') {
    return (
      <div className="grid gap-[var(--space-lg)]">
        <CSVImport onDone={onCancel} onImport={onImport} />
        <div className="flex justify-start">
          <Button onClick={() => setMode('form')} variant="ghost">
            Back to form
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className="grid gap-[var(--space-lg)]" onSubmit={handleSubmit}>
      <div className="grid max-h-[min(54vh,520px)] gap-[var(--space-lg)] overflow-y-auto pr-[var(--space-sm)]">
        {legs.map((leg, index) => {
          const lookupState = lookupStates[leg.id];

          return (
            <section className="grid gap-[var(--space-md)]" key={leg.id}>
            {index > 0 ? (
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-[var(--space-sm)] text-body text-[var(--color-text-primary)]">
                <span>Next leg</span>
                <span className="h-0 border-t border-dotted border-[var(--color-text-primary)] opacity-70" />
                <Button
                  aria-label={`Remove leg ${index + 1}`}
                  icon={<Trash2 aria-hidden className="h-[var(--icon-size-sm)] w-[var(--icon-size-sm)]" />}
                  onClick={() => removeLeg(leg.id)}
                  size="icon"
                  variant="ghost"
                />
              </div>
            ) : null}

            <div className="grid grid-cols-[1fr_0.85fr_auto_0.85fr] items-end gap-[var(--space-md)]">
              <div className="grid gap-[var(--space-sm)]">
                <span className="label-text text-[var(--color-accent-amber)]">Flight no.</span>
                <div className="flex h-[var(--control-height)] overflow-hidden rounded-[var(--radius-sm)] border border-transparent bg-[var(--color-text-primary)] transition focus-within:border-[var(--color-accent-teal)]">
                  <input
                    className="w-14 bg-transparent px-[var(--space-sm)] text-body text-[var(--color-bg-base)] outline-none placeholder:text-[color-mix(in_srgb,var(--color-text-secondary)_60%,transparent)]"
                    maxLength={3}
                    onChange={(event) => updateLeg(leg.id, { airline: event.currentTarget.value.toUpperCase() })}
                    placeholder="Code"
                    value={leg.airline}
                  />
                  <span className="flex select-none items-center text-[var(--color-bg-surface)]">|</span>
                  <input
                    className="min-w-0 flex-1 bg-transparent px-[var(--space-sm)] text-body text-[var(--color-bg-base)] outline-none placeholder:text-[color-mix(in_srgb,var(--color-text-secondary)_60%,transparent)]"
                    onChange={(event) => updateLeg(leg.id, { flightNumber: event.currentTarget.value })}
                    placeholder="Number"
                    value={leg.flightNumber}
                  />
                </div>
              </div>
              <AirportInput
                label="From"
                onChange={(origin) => updateLeg(leg.id, { origin })}
                placeholder="Airport code"
                tone="light"
                value={leg.origin}
              />
              <ArrowRight
                aria-hidden
                className="mb-[calc(var(--control-height)/3)] h-[var(--icon-size-md)] w-[var(--icon-size-md)] text-[var(--color-text-primary)]"
              />
              <AirportInput
                label="To"
                onChange={(destination) => updateLeg(leg.id, { destination })}
                placeholder="Airport code"
                tone="light"
                value={leg.destination}
              />
            </div>

            <div className="grid grid-cols-[1fr_1fr_1fr] gap-[var(--space-md)]">
              <Input
                className={leg.date ? 'text-[var(--color-bg-base)]' : 'text-[var(--color-text-secondary)]'}
                label="Date of flight"
                onChange={(event) => updateLeg(leg.id, { date: event.currentTarget.value })}
                onInput={(event) => updateLeg(leg.id, { date: event.currentTarget.value })}
                type="date"
                tone="light"
                value={leg.date}
              />
              <Input
                className={leg.departureTime ? 'text-[var(--color-bg-base)]' : 'text-[var(--color-text-secondary)]'}
                label="Departure time"
                onChange={(event) => updateLeg(leg.id, { departureTime: event.currentTarget.value })}
                placeholder="Enter time"
                tone="light"
                type="time"
                value={leg.departureTime}
              />
              <label className="grid gap-[var(--space-sm)]">
                <div className="flex items-baseline justify-between">
                  <span className="label-text text-[var(--color-accent-amber)]">Arrival time</span>
                  {computeArrivalDayOffset(leg) > 0 && (
                    <span className="label-text text-[var(--color-accent-teal)]">+{computeArrivalDayOffset(leg)}</span>
                  )}
                </div>
                <input
                  className={cx(
                    'h-[var(--control-height)] w-full rounded-[var(--radius-sm)] border border-transparent bg-[var(--color-text-primary)] px-[var(--space-sm)] text-body outline-none transition focus:border-[var(--color-accent-teal)]',
                    leg.arrivalTime ? 'text-[var(--color-bg-base)]' : 'text-[var(--color-text-secondary)]',
                  )}
                  onChange={(event) => updateLeg(leg.id, { arrivalTime: event.currentTarget.value })}
                  type="time"
                  value={leg.arrivalTime}
                />
              </label>
            </div>

            {lookupState?.status === 'loading' ? (
              <p className="text-mono text-[var(--color-text-secondary)]">Looking up flight...</p>
            ) : null}

            {lookupState?.status === 'not-found' || lookupState?.status === 'error' ? (
              <p className="text-mono text-[var(--color-text-secondary)]">{lookupState.message}</p>
            ) : null}

            {lookupState?.status === 'multiple' && lookupState.matches?.length ? (
              <div className="grid gap-[var(--space-sm)]">
                <span className="label-text text-[var(--color-accent-amber)]">Choose flight match</span>
                <div className="grid gap-[var(--space-xs)]">
                  {lookupState.matches.map((match) => (
                    <button
                      className="rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-[var(--space-sm)] py-[var(--space-xs)] text-left text-body text-[var(--color-text-primary)] transition hover:border-[var(--color-accent-teal)]"
                      key={match.id}
                      onClick={() => applyLookupMatch(leg.id, match)}
                      type="button"
                    >
                      {formatLookupMatch(match)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-[1fr_1fr_1fr] gap-[var(--space-md)]">
              <div className="grid gap-[var(--space-sm)]">
                <span className="label-text text-[var(--color-accent-amber)]">Flight duration</span>
                <div className="flex h-[var(--control-height)] overflow-hidden rounded-[var(--radius-sm)] border border-transparent bg-[var(--color-text-primary)] transition focus-within:border-[var(--color-accent-teal)]">
                  <input
                    className="w-16 bg-transparent px-[var(--space-sm)] text-body tabular-nums text-[var(--color-bg-base)] outline-none [appearance:textfield] placeholder:text-[color-mix(in_srgb,var(--color-text-secondary)_60%,transparent)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    inputMode="numeric"
                    maxLength={2}
                    onChange={(event) => updateLeg(leg.id, { durationHours: normalizeDurationHours(event.currentTarget.value) })}
                    pattern="[0-9]*"
                    placeholder="0"
                    type="text"
                    value={leg.durationHours}
                  />
                  <span className="flex select-none items-center pr-[var(--space-sm)] text-body text-[var(--color-bg-base)]">h</span>
                  <span className="flex select-none items-center text-[var(--color-bg-surface)]">|</span>
                  <input
                    className="w-16 bg-transparent px-[var(--space-sm)] text-body tabular-nums text-[var(--color-bg-base)] outline-none [appearance:textfield] placeholder:text-[color-mix(in_srgb,var(--color-text-secondary)_60%,transparent)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    inputMode="numeric"
                    maxLength={2}
                    onChange={(event) =>
                      updateLeg(leg.id, { durationMinutes: normalizeDurationMinutes(event.currentTarget.value, leg.durationMinutes) })
                    }
                    pattern="[0-9]*"
                    placeholder="00"
                    type="text"
                    value={leg.durationMinutes}
                  />
                  <span className="flex select-none items-center pr-[var(--space-sm)] text-body text-[var(--color-bg-base)]">m</span>
                </div>
              </div>
              <TripSelect
                label="Aircraft type"
                onChange={(event) => updateLeg(leg.id, { aircraftType: event.currentTarget.value })}
                options={aircraftOptions}
                value={leg.aircraftType}
              />
              <label className="grid gap-[var(--space-sm)]">
                <span className="label-text text-[var(--color-accent-amber)]">Cabin class</span>
                <select
                  className="h-[var(--control-height)] w-full rounded-[var(--radius-sm)] border border-transparent bg-[var(--color-text-primary)] px-[var(--space-sm)] text-body text-[var(--color-bg-base)] outline-none transition focus:border-[var(--color-accent-teal)]"
                  onChange={(event) => updateLeg(leg.id, { seatClass: event.currentTarget.value as SeatClass })}
                  value={leg.seatClass}
                >
                  {cabinClassOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
          );
        })}
      </div>

      <button
        className="inline-flex w-fit items-center gap-[var(--space-sm)] text-body text-[var(--color-text-primary)]"
        onClick={addLayoverLeg}
        type="button"
      >
        <span className="inline-flex h-[var(--control-height)] w-[var(--control-height)] items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)] text-[var(--color-accent-teal)]">
          <Plus aria-hidden className="h-[var(--icon-size-md)] w-[var(--icon-size-md)]" />
        </span>
        Add layover
      </button>

<div className="flex items-center justify-between gap-[var(--space-md)]">
        <Button
          className="border-dotted border-[var(--color-accent-teal)] text-[var(--color-accent-teal)]"
          icon={<UploadCloud aria-hidden className="h-[var(--icon-size-sm)] w-[var(--icon-size-sm)]" />}
          onClick={() => setMode('import')}
          variant="ghost"
        >
          Quick add (upload the flight .csv)
        </Button>
        <Button disabled={!canSave || isSaving} type="submit" variant="primary">
          Add trip
        </Button>
      </div>
    </form>
  );
}
