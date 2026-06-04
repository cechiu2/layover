import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': 'var(--color-bg-base)',
        'bg-surface': 'var(--color-bg-surface)',
        'bg-elevated': 'var(--color-bg-elevated)',
        'border-default': 'var(--color-border-default)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'accent-blue': 'var(--color-accent-blue)',
        'accent-amber': 'var(--color-accent-amber)',
        'accent-teal': 'var(--color-accent-teal)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      spacing: {
        xs: 'var(--space-xs)',
        sm: 'var(--space-sm)',
        md: 'var(--space-md)',
        lg: 'var(--space-lg)',
        xl: 'var(--space-xl)',
      },
      fontSize: {
        display: ['var(--font-display-size)', { lineHeight: 'var(--font-display-line-height)', fontWeight: 'var(--font-display-weight)' }],
        'heading-lg': ['var(--font-heading-lg-size)', { lineHeight: 'var(--font-heading-lg-line-height)', fontWeight: 'var(--font-heading-lg-weight)' }],
        'heading-sm': ['var(--font-heading-sm-size)', { lineHeight: 'var(--font-heading-sm-line-height)', fontWeight: 'var(--font-heading-sm-weight)' }],
        body: ['var(--font-body-size)', { lineHeight: 'var(--font-body-line-height)', fontWeight: 'var(--font-body-weight)' }],
        label: ['var(--font-label-size)', { lineHeight: 'var(--font-label-line-height)', fontWeight: 'var(--font-label-weight)' }],
        mono: ['var(--font-mono-size)', { lineHeight: 'var(--font-mono-line-height)', fontWeight: 'var(--font-mono-weight)' }],
      },
    },
  },
  plugins: [],
} satisfies Config;
