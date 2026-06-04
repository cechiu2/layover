import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'md' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-[var(--color-accent-blue)] text-[var(--color-bg-base)] hover:brightness-110',
  secondary:
    'border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:border-[var(--color-accent-blue)]',
  ghost:
    'border-transparent bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  md: 'h-[var(--control-height)] px-[var(--space-md)]',
  icon: 'h-[var(--icon-button-size)] w-[var(--icon-button-size)] justify-center p-0',
};

export function Button({
  children,
  className,
  disabled,
  icon,
  size = 'md',
  type = 'button',
  variant = 'secondary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex shrink-0 items-center justify-center gap-[var(--space-sm)] rounded-[var(--radius-md)] border text-body transition disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled}
      type={type}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
