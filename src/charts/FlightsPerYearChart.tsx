import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { FlightsPerYear } from '../utils/flightStats';

interface FlightsPerYearChartProps {
  data: FlightsPerYear[];
}

export function FlightsPerYearChart({ data }: FlightsPerYearChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex min-h-[calc(var(--control-height)*4)] items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-body text-[var(--color-text-secondary)]">
        No yearly data
      </div>
    );
  }

  return (
    <div className="h-[calc(var(--control-height)*4)] rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-[var(--space-md)]">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data} margin={{ bottom: 0, left: -24, right: 0, top: 0 }}>
          <XAxis
            axisLine={false}
            dataKey="year"
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 'var(--font-label-size)' }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 'var(--font-label-size)' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
            }}
            cursor={{ fill: 'color-mix(in srgb, var(--color-accent-blue) 12%, transparent)' }}
          />
          <Bar dataKey="flights" fill="var(--color-accent-blue)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
