import Fuse from 'fuse.js';
import { useEffect, useMemo, useState } from 'react';
import { AutocompleteDropdown } from '../../components/composed/AutocompleteDropdown';
import { Input } from '../../components/primitives/Input';
import { airports } from '../../data/airports';
import type { Airport } from '../../types/airport';

interface AirportInputProps {
  label: string;
  placeholder?: string;
  tone?: 'dark' | 'light';
  value: Airport | null;
  onChange: (airport: Airport | null) => void;
}

export function AirportInput({ label, onChange, placeholder = 'SFO', tone = 'dark', value }: AirportInputProps) {
  const [query, setQuery] = useState(value ? value.iata : '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [isOpen, setIsOpen] = useState(false);

  const fuse = useMemo(
    () =>
      new Fuse(airports, {
        includeScore: true,
        keys: ['iata', 'city', 'name'],
        threshold: 0.35,
      }),
    [],
  );

  const results = useMemo(() => {
    if (!debouncedQuery.trim() || value?.iata === debouncedQuery.trim().toUpperCase()) {
      return [];
    }

    return fuse
      .search(debouncedQuery)
      .slice(0, 6)
      .map((result) => result.item);
  }, [debouncedQuery, fuse, value?.iata]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 150);

    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (value) {
      setQuery(`${value.iata} · ${value.city}`);
    }
  }, [value]);

  return (
    <div className="relative">
      <Input
        autoComplete="off"
        label={label}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
        onChange={(event) => {
          setQuery(event.currentTarget.value);
          onChange(null);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        tone={tone}
        value={query}
      />
      {isOpen ? (
        <AutocompleteDropdown
          onSelect={(airport) => {
            onChange(airport);
            setQuery(`${airport.iata} · ${airport.city}`);
            setIsOpen(false);
          }}
          results={results}
        />
      ) : null}
    </div>
  );
}
