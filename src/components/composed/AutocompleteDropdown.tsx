import type { Airport } from '../../types/airport';

interface AutocompleteDropdownProps {
  results: Airport[];
  onSelect: (airport: Airport) => void;
}

export function AutocompleteDropdown({ onSelect, results }: AutocompleteDropdownProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+var(--space-xs))] z-20 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)]">
      {results.map((airport) => (
        <button
          className="grid w-full gap-[var(--space-xs)] px-[var(--space-md)] py-[var(--space-sm)] text-left transition hover:bg-[var(--color-bg-surface)]"
          key={airport.iata}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(airport)}
          type="button"
        >
          <span className="font-mono text-mono text-[var(--color-text-primary)]">{airport.iata}</span>
          <span className="text-body text-[var(--color-text-secondary)]">
            {airport.city} · {airport.name}
          </span>
        </button>
      ))}
    </div>
  );
}
