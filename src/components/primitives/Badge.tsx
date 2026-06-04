import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';

type BadgeTone = 'blue' | 'amber' | 'teal' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  blue: 'border-[var(--color-accent-blue)] text-[var(--color-accent-blue)]',
  amber: 'border-[var(--color-accent-amber)] text-[var(--color-accent-amber)]',
  teal: 'border-[var(--color-accent-teal)] text-[var(--color-accent-teal)]',
  neutral: 'border-[var(--color-border-default)] text-[var(--color-text-secondary)]',
};

export function Badge({ children, className, tone = 'neutral' }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-[var(--radius-full)] border px-[var(--space-sm)] py-[var(--space-xs)] label-text',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
