import { DataTableRow } from '../../components/composed/DataTableRow';
import { Button } from '../../components/primitives/Button';
import type { FlightInput } from '../../types/flight';

export interface ImportRow {
  date: string;
  destination: string;
  errors: string[];
  flight?: FlightInput;
  origin: string;
  rowNumber: number;
}

interface ImportPreviewProps {
  rows: ImportRow[];
  onBack: () => void;
  onImport: (flights: FlightInput[]) => Promise<void>;
}

export function ImportPreview({ onBack, onImport, rows }: ImportPreviewProps) {
  const validFlights = rows.flatMap((row) => (row.flight ? [row.flight] : []));
  const invalidCount = rows.length - validFlights.length;

  return (
    <div className="grid gap-[var(--space-lg)]">
      <div className="flex items-center justify-between gap-[var(--space-md)]">
        <div className="grid gap-[var(--space-xs)]">
          <p className="text-heading-sm text-[var(--color-text-primary)]">{validFlights.length} ready</p>
          <p className="text-body text-[var(--color-text-secondary)]">{invalidCount} rows need attention</p>
        </div>
      </div>

      <div className="max-h-[calc(var(--table-row-height)*7)] overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border-default)]">
        <table className="w-full border-collapse text-left text-body">
          <thead className="sticky top-0 bg-[var(--color-bg-elevated)] label-text text-[var(--color-text-secondary)]">
            <tr>
              <th className="px-[var(--space-sm)] py-[var(--space-sm)]">Row</th>
              <th className="px-[var(--space-sm)] py-[var(--space-sm)]">Origin</th>
              <th className="px-[var(--space-sm)] py-[var(--space-sm)]">Destination</th>
              <th className="px-[var(--space-sm)] py-[var(--space-sm)]">Date</th>
              <th className="px-[var(--space-sm)] py-[var(--space-sm)]">Status</th>
            </tr>
          </thead>
          <tbody className="bg-[var(--color-bg-surface)]">
            {rows.map((row) => (
              <DataTableRow
                cells={[row.rowNumber, row.origin, row.destination, row.date]}
                errors={row.errors}
                key={row.rowNumber}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-[var(--space-sm)]">
        <Button onClick={onBack} variant="ghost">
          Back
        </Button>
        <Button disabled={validFlights.length === 0 || invalidCount > 0} onClick={() => onImport(validFlights)} variant="primary">
          Import
        </Button>
      </div>
    </div>
  );
}
