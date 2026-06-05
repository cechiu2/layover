import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle.js';
import { Dashboard } from './pages/Dashboard';
import { useFlights } from './hooks/useFlights';

export function App() {
  const { error, flights, isLoading } = useFlights();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg-base)] text-[var(--color-text-secondary)]">
        <LoaderCircle aria-hidden className="h-[var(--icon-size-lg)] w-[var(--icon-size-lg)] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg-base)] p-[var(--space-lg)] text-[var(--color-accent-amber)]">
        {error}
      </div>
    );
  }

  return <Dashboard flights={flights} />;
}
