import { useState } from 'react';
import { DragDropZone } from '../../components/primitives/DragDropZone';
import type { FlightInput } from '../../types/flight';
import { ImportPreview, type ImportRow } from './ImportPreview';
import { ImportSuccess } from './ImportSuccess';
import { parseICSText } from './parseICS';

interface ICSImportProps {
  onDone: () => void;
  onImport: (flights: FlightInput[]) => Promise<void>;
}

type ImportStep = 'drop' | 'preview' | 'success';

export function ICSImport({ onDone, onImport }: ICSImportProps) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [step, setStep] = useState<ImportStep>('drop');

  async function parseFile(file: File) {
    const text = await file.text();
    setRows(parseICSText(text));
    setStep('preview');
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
      <DragDropZone accept=".ics,text/calendar" label="ICS file" onFiles={(files) => files[0] && void parseFile(files[0])} />
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-[var(--space-md)]">
        <p className="text-body text-[var(--color-text-secondary)]">
          Calendar files are best-effort: flight events with recognizable airport codes will appear in the preview.
        </p>
      </div>
    </div>
  );
}
