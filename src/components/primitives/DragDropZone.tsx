import { UploadCloud } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import { cx } from '../../utils/cx';

interface DragDropZoneProps {
  accept?: string;
  label?: string;
  onFiles: (files: File[]) => void;
}

export function DragDropZone({ accept = '.csv,text/csv', label = 'CSV file', onFiles }: DragDropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    onFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <button
      className={cx(
        'flex min-h-[calc(var(--control-height)*4)] w-full flex-col items-center justify-center gap-[var(--space-md)] rounded-[var(--radius-md)] border border-dashed bg-[var(--color-bg-base)] p-[var(--space-lg)] text-center transition',
        isDragging
          ? 'border-[var(--color-accent-teal)] text-[var(--color-accent-teal)]'
          : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent-blue)] hover:text-[var(--color-text-primary)]',
      )}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      type="button"
    >
      <UploadCloud aria-hidden className="h-[var(--icon-size-lg)] w-[var(--icon-size-lg)]" />
      <span className="text-heading-sm">{label}</span>
      <input
        accept={accept}
        className="hidden"
        onChange={(event) => onFiles(Array.from(event.target.files ?? []))}
        ref={inputRef}
        type="file"
      />
    </button>
  );
}
