'use client';

import MetricCard from '@/components/ui/MetricCard';
import { AQ_THRESHOLDS, getAQStatus } from '@/lib/config';
import { Wind, Droplets, Cloud, Flame, Zap, Sun } from 'lucide-react';

const ICON_MAP = {
  pm25: Wind,
  pm10: Cloud,
  co: Flame,
  no2: Zap,
  so2: Droplets,
  o3: Sun,
};

export default function AirQualityGrid({ data, trends }) {
  const pollutants = ['pm25', 'pm10', 'co', 'no2', 'so2', 'o3'];

  return (
    <div>
      <h2 className="text-sm font-medium text-muted uppercase tracking-wide mb-3">
        Kualitas Udara
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {pollutants.map((key) => {
          const threshold = AQ_THRESHOLDS[key];
          const value = data?.[key] ?? 0;
          const aqStatus = getAQStatus(key, value);
          const trend = trends?.[key];

          return (
            <MetricCard
              key={key}
              label={threshold.label}
              value={value}
              unit={threshold.unit}
              icon={ICON_MAP[key]}
              trend={trend}
              status={aqStatus.label}
              statusColor={aqStatus.color}
            />
          );
        })}
      </div>
    </div>
  );
}
