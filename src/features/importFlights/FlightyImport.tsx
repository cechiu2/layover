import Papa from 'papaparse';
import { useState } from 'react';
import { DragDropZone } from '../../components/primitives/DragDropZone';
import type { FlightInput } from '../../types/flight';
import { ImportPreview, type ImportRow } from './ImportPreview';
import { ImportSuccess } from './ImportSuccess';
import { parseFlightyRows, type FlightyRow } from './parseFlighty';

interface FlightyImportProps {
  onDone: () => void;
  onImport: (flights: FlightInput[]) => Promise<void>;
}

type ImportStep = 'drop' | 'preview' | 'success';

export function FlightyImport({ onDone, onImport }: FlightyImportProps) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [step, setStep] = useState<ImportStep>('drop');

  function parseFile(file: File) {
    Papa.parse<FlightyRow>(file, {
      complete(results) {
        setRows(parseFlightyRows(results.data));
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
        <p className="text-body text-[var(--color-text-secondary)]">
          Flighty export columns are mapped automatically, including cabin, aircraft, local times, and flight number.
        </p>
      </div>
    </div>
  );
}
