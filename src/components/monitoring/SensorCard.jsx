'use client';

import { getAQStatus, AQ_THRESHOLDS, ENV_THRESHOLDS } from '@/lib/config';
import { Wind, Droplets, Cloud, Flame, Zap, Sun, Thermometer } from 'lucide-react';

const ICON_MAP = {
  pm25: Wind,
  pm10: Cloud,
  co: Flame,
  no2: Zap,
  so2: Droplets,
  o3: Sun,
  temperature: Thermometer,
  humidity: Droplets,
};

export default function SensorCard({ paramKey, value, showStatus = true }) {
  const isEnv = paramKey === 'temperature' || paramKey === 'humidity';
  const config = isEnv ? ENV_THRESHOLDS[paramKey] : AQ_THRESHOLDS[paramKey];
  if (!config) return null;

  const Icon = ICON_MAP[paramKey] || Wind;
  const status = !isEnv ? getAQStatus(paramKey, value) : null;

  return (
    <div className="bg-surface border border-border rounded-xl p-4 transition-all hover:shadow-sm hover:border-border-hover">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs font-medium text-muted uppercase tracking-wide">
            {config.label}
          </span>
        </div>
        {showStatus && status && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
            status.color === 'green' ? 'bg-risk-low-bg text-risk-low'
            : status.color === 'yellow' ? 'bg-risk-medium-bg text-risk-medium'
            : 'bg-risk-high-bg text-risk-high'
          }`}>
            {status.label}
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold text-foreground tabular-nums">
        {typeof value === 'number' ? value.toFixed(1) : value}
      </p>
      <p className="text-xs text-muted mt-0.5">{config.unit}</p>
    </div>
  );
}
