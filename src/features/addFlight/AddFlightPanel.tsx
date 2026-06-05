import { ArrowRight, Plus, Trash2, UploadCloud } from 'lucide-react';
import { useState, type FormEvent, type SelectHTMLAttributes } from 'react';
import { Button } from '../../components/primitives/Button';
import { Input } from '../../components/primitives/Input';
import { CSVImport } from '../importFlights/CSVImport';
import type { Airport } from '../../types/airport';
import type { FlightInput, SeatClass } from '../../types/flight';
import { cx } from '../../utils/cx';
import { AirportInput } from './AirportInput';

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
  durationHours: string;
  durationMinutes: string;
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
    durationHours: '',
    durationMinutes: '',
  };
}

function TripSelect({ className, label, options, ...props }: TripSelectProps) {
  return (
    <label className="grid gap-[var(--space-sm)]">
      <span className="label-text text-[var(--color-accent-amber)]">{label}</span>
      <select
        className={cx(
          'h-[var(--control-height)] w-full rounded-[var(--radius-sm)] border border-transparent bg-[var(--color-text-primary)] px-[var(--space-sm)] text-body text-[var(--color-bg-base)] outline-none transition focus:border-[var(--color-accent-teal)]',
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
  const previousArrival = getDateTimeMinutes(previousLeg.date, previousLeg.arrivalTime);
  let nextDeparture = getDateTimeMinutes(nextLeg.date, nextLeg.departureTime);

  if (previousArrival === null || nextDeparture === null) {
    return undefined;
  }

  while (nextDeparture < previousArrival) {
    nextDeparture += 24 * 60;
  }

  return nextDeparture - previousArrival;
}

export function AddFlightPanel({ onCancel, onImport, onSave }: AddFlightPanelProps) {
  const [mode, setMode] = useState<'form' | 'import'>('form');
  const [legs, setLegs] = useState<TripLegDraft[]>(() => [createEmptyLeg()]);
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
        {legs.map((leg, index) => (
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
                label="Date of flight"
                onChange={(event) => updateLeg(leg.id, { date: event.currentTarget.value })}
                onInput={(event) => updateLeg(leg.id, { date: event.currentTarget.value })}
                type="date"
                tone="light"
                value={leg.date}
              />
              <Input
                label="Departure time"
                onChange={(event) => updateLeg(leg.id, { departureTime: event.currentTarget.value })}
                placeholder="Enter time"
                tone="light"
                type="time"
                value={leg.departureTime}
              />
              <Input
                label="Arrival time"
                onChange={(event) => updateLeg(leg.id, { arrivalTime: event.currentTarget.value })}
                placeholder="Enter time"
                tone="light"
                type="time"
                value={leg.arrivalTime}
              />
            </div>

            <div className="grid grid-cols-[1fr_1fr_1fr] gap-[var(--space-md)]">
              <div className="grid gap-[var(--space-sm)]">
                <span className="label-text text-[var(--color-accent-amber)]">Flight duration</span>
                <div className="flex h-[var(--control-height)] overflow-hidden rounded-[var(--radius-sm)] border border-transparent bg-[var(--color-text-primary)] transition focus-within:border-[var(--color-accent-teal)]">
                  <input
                    className="w-10 bg-transparent px-[var(--space-sm)] text-body text-[var(--color-bg-base)] outline-none placeholder:text-[color-mix(in_srgb,var(--color-text-secondary)_60%,transparent)]"
                    max={23}
                    min={0}
                    onChange={(event) => updateLeg(leg.id, { durationHours: event.currentTarget.value })}
                    placeholder="0"
                    type="number"
                    value={leg.durationHours}
                  />
                  <span className="flex select-none items-center pr-[var(--space-sm)] text-body text-[var(--color-bg-base)] opacity-40">h</span>
                  <span className="flex select-none items-center text-[var(--color-bg-surface)]">|</span>
                  <input
                    className="w-10 bg-transparent px-[var(--space-sm)] text-body text-[var(--color-bg-base)] outline-none placeholder:text-[color-mix(in_srgb,var(--color-text-secondary)_60%,transparent)]"
                    max={59}
                    min={0}
                    onChange={(event) => updateLeg(leg.id, { durationMinutes: event.currentTarget.value })}
                    placeholder="00"
                    type="number"
                    value={leg.durationMinutes}
                  />
                  <span className="flex select-none items-center pr-[var(--space-sm)] text-body text-[var(--color-bg-base)] opacity-40">m</span>
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
        ))}
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
