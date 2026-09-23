'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getHistoricalAirQuality } from '@/lib/api';
import { AQ_THRESHOLDS } from '@/lib/config';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const PARAMS = [
  { key: 'pm25', label: 'PM2.5', color: 'var(--chart-1)' },
  { key: 'pm10', label: 'PM10', color: 'var(--chart-2)' },
  { key: 'co', label: 'CO', color: 'var(--chart-3)' },
  { key: 'no2', label: 'NO₂', color: 'var(--chart-4)' },
  { key: 'so2', label: 'SO₂', color: 'var(--chart-5)' },
  { key: 'o3', label: 'O₃', color: 'var(--chart-6)' },
];

const TIME_RANGES = [
  { key: '24h', label: '24H' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
];

function formatTime(timestamp, range) {
  const date = new Date(timestamp);
  if (range === '24h') {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export default function SensorChart() {
  const [selectedParam, setSelectedParam] = useState('pm25');
  const [range, setRange] = useState('24h');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getHistoricalAirQuality(range).then((result) => {
      if (!cancelled) {
        setData(result.map((d) => ({
          time: formatTime(d.timestamp, range),
          value: Math.round(d[selectedParam] * 10) / 10,
        })));
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [range, selectedParam]);

  const paramConfig = PARAMS.find((p) => p.key === selectedParam);
  const thresholdConfig = AQ_THRESHOLDS[selectedParam];

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-muted uppercase tracking-wide">
              Grafik Historis
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Simulated Data</p>
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

        {/* Parameter selector */}
        <div className="flex flex-wrap gap-1.5">
          {PARAMS.map((p) => (
            <button
              key={p.key}
              onClick={() => setSelectedParam(p.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                selectedParam === p.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-surface text-muted border-border hover:text-foreground hover:border-border-hover'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <LoadingSpinner size="sm" label="Memuat grafik..." />
        </div>
      ) : (
        <div className="h-[300px]">
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
                formatter={(value) => [`${value} ${thresholdConfig?.unit || ''}`, paramConfig?.label]}
                labelStyle={{ color: 'var(--muted)', marginBottom: '4px' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                name={paramConfig?.label}
                stroke={paramConfig?.color || 'var(--chart-1)'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
