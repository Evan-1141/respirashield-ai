'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { getHistoricalAirQuality } from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const TIME_RANGES = [
  { key: '24h', label: '24 Jam' },
  { key: '7d', label: '7 Hari' },
  { key: '30d', label: '30 Hari' },
];

function formatTime(timestamp, range) {
  const date = new Date(timestamp);
  if (range === '24h') {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }
  if (range === '7d') {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export default function AirQualityChart() {
  const [range, setRange] = useState('24h');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getHistoricalAirQuality(range).then((result) => {
      if (!cancelled) {
        setData(result.map((d) => ({
          ...d,
          time: formatTime(d.timestamp, range),
          pm25: Math.round(d.pm25 * 10) / 10,
          pm10: Math.round(d.pm10 * 10) / 10,
        })));
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [range]);

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-medium text-muted uppercase tracking-wide">
            Grafik Kualitas Udara
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">PM2.5 & PM10 — Simulated Data</p>
        </div>
        <div className="flex gap-1 bg-surface-secondary rounded-lg p-1">
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.key}
              onClick={() => setRange(tr.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                range === tr.key
                  ? 'bg-surface text-foreground shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-[280px] flex items-center justify-center">
          <LoadingSpinner size="sm" label="Memuat grafik..." />
        </div>
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: 'var(--muted)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'var(--muted)', marginBottom: '4px' }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px', color: 'var(--muted)' }}
              />
              <Line
                type="monotone"
                dataKey="pm25"
                name="PM2.5 (µg/m³)"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'var(--chart-1)' }}
              />
              <Line
                type="monotone"
                dataKey="pm10"
                name="PM10 (µg/m³)"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'var(--chart-2)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
