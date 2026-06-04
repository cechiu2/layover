import { PillToggle } from '../../components/primitives/PillToggle';
import type { SeatClass } from '../../types/flight';

interface SeatClassToggleProps {
  value: SeatClass;
  onChange: (value: SeatClass) => void;
}

const seatClassOptions = [
  { label: 'Economy', value: 'economy' },
  { label: 'Premium', value: 'premium_economy' },
  { label: 'Business', value: 'business' },
  { label: 'First', value: 'first' },
] satisfies Array<{ label: string; value: SeatClass }>;

export function SeatClassToggle({ onChange, value }: SeatClassToggleProps) {
  return <PillToggle label="Seat class" onChange={onChange} options={seatClassOptions} value={value} />;
}
