import { ArrowRightLeft, Plus, UploadCloud } from 'lucide-react';
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
  onSave: (flight: FlightInput) => Promise<void>;
}

interface TripSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
}

const airlineOptions = ['Delta Air Lines', 'United Airlines', 'American Airlines', 'Alaska Airlines', 'Southwest Airlines'];
const aircraftOptions = ['Airbus A321neo', 'Airbus A320', 'Boeing 737', 'Boeing 757', 'Boeing 787', 'Embraer 175'];
const cabinClassOptions: Array<{ label: string; value: SeatClass }> = [
  { label: 'Economy', value: 'economy' },
  { label: 'Premium economy', value: 'premium_economy' },
  { label: 'Business', value: 'business' },
  { label: 'First', value: 'first' },
];

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

export function AddFlightPanel({ onCancel, onImport, onSave }: AddFlightPanelProps) {
  const [mode, setMode] = useState<'form' | 'import'>('form');
  const [origin, setOrigin] = useState<Airport | null>(null);
  const [destination, setDestination] = useState<Airport | null>(null);
  const [date, setDate] = useState('');
  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [seatClass, setSeatClass] = useState<SeatClass>('economy');
  const [aircraftType, setAircraftType] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [flightDuration, setFlightDuration] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const canSave = Boolean(origin && destination && date);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!origin || !destination || !date) {
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        aircraftType: aircraftType || undefined,
        airline: airline || undefined,
        arrivalTime: arrivalTime || undefined,
        date,
        departureTime: departureTime || undefined,
        destination,
        flightDuration: flightDuration || undefined,
        flightNumber: flightNumber.trim() || undefined,
        origin,
        seatClass,
      });
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
      <div className="grid grid-cols-[0.6fr_1.2fr_0.85fr_auto_0.85fr] items-end gap-[var(--space-md)]">
        <Input
          label="Flight no."
          onChange={(event) => setFlightNumber(event.currentTarget.value)}
          placeholder="AC415"
          tone="light"
          value={flightNumber}
        />
        <TripSelect label="Airline" onChange={(event) => setAirline(event.currentTarget.value)} options={airlineOptions} value={airline} />
        <AirportInput label="From" onChange={setOrigin} placeholder="Airport code" tone="light" value={origin} />
        <ArrowRightLeft aria-hidden className="mb-[calc(var(--control-height)/3)] h-[var(--icon-size-md)] w-[var(--icon-size-md)] text-[var(--color-text-primary)]" />
        <AirportInput label="To" onChange={setDestination} placeholder="Airport code" tone="light" value={destination} />
      </div>

      <div className="grid grid-cols-[1fr_1fr_1fr] gap-[var(--space-md)]">
        <Input
          label="Date of flight"
          onChange={(event) => setDate(event.currentTarget.value)}
          onInput={(event) => setDate(event.currentTarget.value)}
          type="date"
          tone="light"
          value={date}
        />
        <Input
          label="Departure time"
          onChange={(event) => setDepartureTime(event.currentTarget.value)}
          placeholder="Enter time"
          tone="light"
          value={departureTime}
        />
        <Input
          label="Arrival time"
          onChange={(event) => setArrivalTime(event.currentTarget.value)}
          placeholder="Enter time"
          tone="light"
          value={arrivalTime}
        />
      </div>

      <div className="grid grid-cols-[1fr_1fr_1fr] gap-[var(--space-md)]">
        <Input
          label="Flight duration"
          onChange={(event) => setFlightDuration(event.currentTarget.value)}
          placeholder="Enter duration"
          tone="light"
          value={flightDuration}
        />
        <TripSelect
          label="Aircraft type"
          onChange={(event) => setAircraftType(event.currentTarget.value)}
          options={aircraftOptions}
          value={aircraftType}
        />
        <label className="grid gap-[var(--space-sm)]">
          <span className="label-text text-[var(--color-accent-amber)]">Cabin class</span>
          <select
            className="h-[var(--control-height)] w-full rounded-[var(--radius-sm)] border border-transparent bg-[var(--color-text-primary)] px-[var(--space-sm)] text-body text-[var(--color-bg-base)] outline-none transition focus:border-[var(--color-accent-teal)]"
            onChange={(event) => setSeatClass(event.currentTarget.value as SeatClass)}
            value={seatClass}
          >
            {cabinClassOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        className="inline-flex w-fit items-center gap-[var(--space-sm)] text-body text-[var(--color-text-primary)]"
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
