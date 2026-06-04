import Papa from 'papaparse';
import { useState } from 'react';
import { DragDropZone } from '../../components/primitives/DragDropZone';
import { findAirportByIata } from '../../data/airports';
import type { FlightInput, SeatClass } from '../../types/flight';
import { ImportPreview, type ImportRow } from './ImportPreview';
import { ImportSuccess } from './ImportSuccess';

interface CSVImportProps {
  onDone: () => void;
  onImport: (flights: FlightInput[]) => Promise<void>;
}

interface CsvRow {
  aircraft_type?: string;
  airline?: string;
  arrival_time?: string;
  date?: string;
  departure_time?: string;
  destination?: string;
  flight_duration?: string;
  flight_number?: string;
  origin?: string;
  seat_class?: string;
  [key: string]: string | undefined;
}

type ImportStep = 'drop' | 'preview' | 'success';

const seatClasses: SeatClass[] = ['economy', 'premium_economy', 'business', 'first'];

function isSeatClass(value: string): value is SeatClass {
  return seatClasses.includes(value as SeatClass);
}

function isValidDate(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.valueOf());
}

function validateRow(row: CsvRow, index: number): ImportRow {
  const errors: string[] = [];
  const originCode = row.origin?.trim().toUpperCase() ?? '';
  const destinationCode = row.destination?.trim().toUpperCase() ?? '';
  const date = row.date?.trim() ?? '';
  const origin = findAirportByIata(originCode);
  const destination = findAirportByIata(destinationCode);
  const seatClass = row.seat_class?.trim();

  if (!originCode) {
    errors.push('Missing origin');
  } else if (!origin) {
    errors.push('Unknown origin');
  }

  if (!destinationCode) {
    errors.push('Missing destination');
  } else if (!destination) {
    errors.push('Unknown destination');
  }

  if (!date) {
    errors.push('Missing date');
  } else if (!isValidDate(date)) {
    errors.push('Invalid date');
  }

  if (seatClass && !isSeatClass(seatClass)) {
    errors.push('Invalid class');
  }

  return {
    date,
    destination: destinationCode,
    errors,
    flight:
      errors.length === 0 && origin && destination
        ? {
            aircraftType: row.aircraft_type?.trim() || undefined,
            airline: row.airline?.trim() || undefined,
            arrivalTime: row.arrival_time?.trim() || undefined,
            date,
            departureTime: row.departure_time?.trim() || undefined,
            destination,
            flightDuration: row.flight_duration?.trim() || undefined,
            flightNumber: row.flight_number?.trim() || undefined,
            origin,
            seatClass: seatClass && isSeatClass(seatClass) ? seatClass : undefined,
          }
        : undefined,
    origin: originCode,
    rowNumber: index + 2,
  };
}

export function CSVImport({ onDone, onImport }: CSVImportProps) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [step, setStep] = useState<ImportStep>('drop');

  function parseFile(file: File) {
    Papa.parse<CsvRow>(file, {
      complete(results) {
        setRows(results.data.map(validateRow));
        setStep('preview');
      },
      header: true,
      skipEmptyLines: true,
    });
  }

  async function handleImport(flights: FlightInput[]) {
    await onImport(flights);
    setImportedCount(flights.length);
    setStep('success');
  }

  if (step === 'success') {
    return <ImportSuccess count={importedCount} onDone={onDone} />;
  }

  if (step === 'preview') {
    return <ImportPreview onBack={() => setStep('drop')} onImport={handleImport} rows={rows} />;
  }

  return (
    <div className="grid gap-[var(--space-lg)]">
      <DragDropZone onFiles={(files) => files[0] && parseFile(files[0])} />
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-[var(--space-md)]">
        <p className="break-all font-mono text-mono text-[var(--color-text-secondary)]">
          origin,destination,date,airline,flight_number,seat_class,aircraft_type,departure_time,arrival_time,flight_duration
        </p>
      </div>
    </div>
  );
}
