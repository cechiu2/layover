import { useEffect, useState } from 'react';
import { watchFlights } from '../data/db';
import type { Flight } from '../types/flight';

interface UseFlightsResult {
  error: string | null;
  flights: Flight[];
  isLoading: boolean;
}

export function useFlights(): UseFlightsResult {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subscription = watchFlights().subscribe({
      error(value: unknown) {
        setError(value instanceof Error ? value.message : 'Unable to load flights');
        setIsLoading(false);
      },
      next(value) {
        setFlights(value);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  return { error, flights, isLoading };
}
