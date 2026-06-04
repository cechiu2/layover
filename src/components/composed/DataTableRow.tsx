import { CheckCircle2, CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';

interface DataTableRowProps {
  cells: ReactNode[];
  errors?: string[];
}

export function DataTableRow({ cells, errors = [] }: DataTableRowProps) {
  const isValid = errors.length === 0;

  return (
    <tr className={cx(isValid ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-accent-amber)]')}>
      {cells.map((cell, index) => (
        <td className="border-t border-[var(--color-border-default)] px-[var(--space-sm)] py-[var(--space-sm)]" key={index}>
          {cell}
        </td>
      ))}
      <td className="border-t border-[var(--color-border-default)] px-[var(--space-sm)] py-[var(--space-sm)]">
        <span className="inline-flex items-center gap-[var(--space-xs)]">
          {isValid ? (
            <CheckCircle2 aria-hidden className="h-[var(--icon-size-xs)] w-[var(--icon-size-xs)]" />
          ) : (
            <CircleAlert aria-hidden className="h-[var(--icon-size-xs)] w-[var(--icon-size-xs)]" />
          )}
          {isValid ? 'Ready' : errors.join(', ')}
        </span>
      </td>
    </tr>
  );
}
