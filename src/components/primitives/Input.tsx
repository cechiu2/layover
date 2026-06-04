import type { InputHTMLAttributes } from 'react';
import { cx } from '../../utils/cx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  tone?: 'dark' | 'light';
}

export function Input({ className, error, id, label, tone = 'dark', ...props }: InputProps) {
  const inputId = id ?? props.name;
  const toneClass =
    tone === 'light'
      ? 'border-transparent bg-[var(--color-text-primary)] text-[var(--color-bg-base)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-accent-teal)]'
      : 'border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-accent-blue)]';

  return (
    <label className="grid gap-[var(--space-sm)] text-body text-[var(--color-text-primary)]">
      {label ? (
        <span className={tone === 'light' ? 'label-text text-[var(--color-accent-amber)]' : 'label-text text-[var(--color-text-secondary)]'}>
          {label}
        </span>
      ) : null}
      <input
        className={cx(
          'h-[var(--control-height)] w-full rounded-[var(--radius-sm)] border px-[var(--space-sm)] text-body outline-none transition',
          toneClass,
          error && 'border-[var(--color-accent-amber)]',
          className,
        )}
        id={inputId}
        {...props}
      />
      {error ? <span className="text-mono text-[var(--color-accent-amber)]">{error}</span> : null}
    </label>
  );
}
