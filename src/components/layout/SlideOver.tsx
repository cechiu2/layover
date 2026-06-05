import X from 'lucide-react/dist/esm/icons/x.js';
import type { ReactNode } from 'react';
import { Button } from '../primitives/Button';

interface SlideOverProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  variant?: 'side' | 'modal';
}

export function SlideOver({ children, isOpen, onClose, title, variant = 'side' }: SlideOverProps) {
  if (!isOpen) {
    return null;
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center p-[var(--space-xl)]">
        <section className="panel-shadow flex max-h-[var(--trip-modal-max-height)] w-[min(var(--trip-modal-width),100%)] flex-col rounded-[var(--radius-lg)] border border-[var(--glass-panel-border)] bg-[var(--glass-panel-bg)] backdrop-blur-md">
          <header className="flex items-center justify-between px-[var(--space-xl)] pt-[var(--space-lg)]">
            <h2 className="text-display text-[var(--color-text-primary)]">{title}</h2>
            <Button
              aria-label="Close"
              icon={<X aria-hidden className="h-[var(--icon-size-md)] w-[var(--icon-size-md)]" />}
              onClick={onClose}
              size="icon"
              variant="ghost"
            />
          </header>
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-[var(--space-xl)] pb-[var(--space-lg)] pt-[var(--space-md)]">
            {children}
          </div>
        </section>
      </div>
    );
  }

  return (
    <aside className="panel-shadow fixed bottom-0 right-0 top-0 z-30 flex w-[min(var(--slide-over-width),100vw)] flex-col border-l border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
      <header className="flex items-center justify-between border-b border-[var(--color-border-default)] p-[var(--space-lg)]">
        <h2 className="text-heading-lg text-[var(--color-text-primary)]">{title}</h2>
        <Button
          aria-label="Close"
          icon={<X aria-hidden className="h-[var(--icon-size-sm)] w-[var(--icon-size-sm)]" />}
          onClick={onClose}
          size="icon"
          variant="ghost"
        />
      </header>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-[var(--space-lg)]">{children}</div>
    </aside>
  );
}
