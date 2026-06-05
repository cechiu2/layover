import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2.js';
import { Button } from '../../components/primitives/Button';

interface ImportSuccessProps {
  count: number;
  onDone: () => void;
}

export function ImportSuccess({ count, onDone }: ImportSuccessProps) {
  return (
    <div className="grid gap-[var(--space-lg)]">
      <div className="grid justify-items-start gap-[var(--space-md)] rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-[var(--space-lg)]">
        <CheckCircle2
          aria-hidden
          className="h-[var(--icon-size-lg)] w-[var(--icon-size-lg)] text-[var(--color-accent-teal)]"
        />
        <div className="grid gap-[var(--space-xs)]">
          <h3 className="text-heading-lg text-[var(--color-text-primary)]">Imported</h3>
          <p className="text-body text-[var(--color-text-secondary)]">{count} flights added</p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={onDone} variant="primary">
          Done
        </Button>
      </div>
    </div>
  );
}
