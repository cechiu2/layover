import type { SeatClass } from '../types/flight';

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatMiles(value: number): string {
  return `${formatNumber(value)} mi`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

export function formatSeatClass(value?: SeatClass): string {
  if (!value) {
    return 'Not logged';
  }

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
