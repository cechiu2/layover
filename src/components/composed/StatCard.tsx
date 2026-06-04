import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  accent?: ReactNode;
}

export function StatCard({ accent, label, value }: StatCardProps) {
  return (
    <article className="grid gap-[var(--space-xs)] rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-[var(--space-md)]">
      <div className="flex items-center justify-between gap-[var(--space-sm)]">
        <span className="label-text text-[var(--color-text-secondary)]">{label}</span>
        {accent}
      </div>
      <strong className="text-heading-lg text-[var(--color-text-primary)]">{value}</strong>
    </article>
  );
}
