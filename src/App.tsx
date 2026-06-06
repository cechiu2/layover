import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle.js';
import { lazy, Suspense } from 'react';
import { useFlights } from './hooks/useFlights';

const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));

function AppLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--color-bg-base)] text-[var(--color-text-secondary)]">
      <LoaderCircle aria-hidden className="h-[var(--icon-size-lg)] w-[var(--icon-size-lg)] animate-spin" />
    </div>
  );
}

export function App() {
  const { error, flights, isLoading } = useFlights();

  if (isLoading) {
    return <AppLoader />;
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg-base)] p-[var(--space-lg)] text-[var(--color-accent-amber)]">
        {error}
      </div>
    );
  }

  return (
    <Suspense fallback={<AppLoader />}>
      <Dashboard flights={flights} />
    </Suspense>
  );
}
