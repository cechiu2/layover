import { cx } from '../../utils/cx';

export interface PillToggleOption<TValue extends string> {
  label: string;
  value: TValue;
}

interface PillToggleProps<TValue extends string> {
  label?: string;
  options: Array<PillToggleOption<TValue>>;
  value: TValue;
  onChange: (value: TValue) => void;
}

export function PillToggle<TValue extends string>({
  label,
  onChange,
  options,
  value,
}: PillToggleProps<TValue>) {
  return (
    <div className="grid gap-[var(--space-sm)]">
      {label ? <span className="label-text text-[var(--color-text-secondary)]">{label}</span> : null}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-base)] p-[var(--space-xs)]">
        {options.map((option) => {
          const active = option.value === value;

          return (
            <button
              className={cx(
                'h-[var(--control-height)] rounded-[var(--radius-sm)] px-[var(--space-sm)] text-body transition',
                active
                  ? 'bg-[var(--color-accent-blue)] text-[var(--color-bg-base)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              )}
              key={option.value}
              onClick={() => onChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
