'use client';

import MetricCard from '@/components/ui/MetricCard';
import { Thermometer, Droplets } from 'lucide-react';

export default function EnvironmentCard({ temperature, humidity, trends }) {
  return (
    <div>
      <h2 className="text-sm font-medium text-muted uppercase tracking-wide mb-3">
        Kondisi Lingkungan
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Suhu Udara"
          value={temperature}
          unit="°C"
          icon={Thermometer}
          trend={trends?.temperature}
        />
        <MetricCard
          label="Kelembapan"
          value={humidity}
          unit="%"
          icon={Droplets}
          trend={trends?.humidity}
        />
      </div>
    </div>
  );
}
