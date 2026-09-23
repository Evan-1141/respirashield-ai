'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import DeviceHeader from '@/components/monitoring/DeviceHeader';
import SensorCard from '@/components/monitoring/SensorCard';
import SensorChart from '@/components/monitoring/SensorChart';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getAirQuality, getDeviceStatus } from '@/lib/api';
import { getAQStatus } from '@/lib/config';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

function getOverallStatus(aq) {
  if (!aq) return null;
  const params = ['pm25', 'pm10', 'co', 'no2', 'so2', 'o3'];
  let worstLevel = 'good';
  for (const p of params) {
    const s = getAQStatus(p, aq[p]);
    if (s.color === 'red') return { label: 'Tidak Baik', color: 'red', icon: ShieldAlert };
    if (s.color === 'yellow') worstLevel = 'moderate';
  }
  if (worstLevel === 'moderate') return { label: 'Perlu Diperhatikan', color: 'yellow', icon: AlertTriangle };
  return { label: 'Baik', color: 'green', icon: ShieldCheck };
}

export default function MonitoringPage() {
  const [airQuality, setAirQuality] = useState(null);
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [aq, dev] = await Promise.all([getAirQuality(), getDeviceStatus()]);
      setAirQuality(aq);
      setDevice(dev);
    } catch (err) {
      console.error('Failed to load monitoring data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner label="Memuat data monitoring..." />
      </div>
    );
  }

  const overall = getOverallStatus(airQuality);
  const colorMap = { green: 'risk-low', yellow: 'risk-medium', red: 'risk-high' };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Header
        title="Monitoring Udara"
        subtitle="Data kualitas udara dari perangkat IoT."
      />

      <DeviceHeader device={device} onRefresh={loadData} />

      {/* Overall Status */}
      {overall && (
        <div className={`flex items-center gap-3 bg-${colorMap[overall.color]}-bg border border-${colorMap[overall.color]}-border rounded-xl p-4`}>
          <overall.icon className={`w-5 h-5 text-${colorMap[overall.color]}`} />
          <div>
            <p className={`text-sm font-semibold text-${colorMap[overall.color]}`}>
              Status Kualitas Udara: {overall.label}
            </p>
            <p className="text-xs text-muted mt-0.5">Berdasarkan threshold yang dikonfigurasi • Simulated Data</p>
          </div>
        </div>
      )}

      {/* Air Quality Grid */}
      <div>
        <h2 className="text-sm font-medium text-muted uppercase tracking-wide mb-3">Kualitas Udara Terkini</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {['pm25', 'pm10', 'co', 'no2', 'so2', 'o3'].map((key) => (
            <SensorCard key={key} paramKey={key} value={airQuality?.[key] ?? 0} />
          ))}
        </div>
      </div>

      {/* Environment */}
      <div>
        <h2 className="text-sm font-medium text-muted uppercase tracking-wide mb-3">Kondisi Lingkungan</h2>
        <div className="grid grid-cols-2 gap-3">
          <SensorCard paramKey="temperature" value={airQuality?.temperature ?? 0} showStatus={false} />
          <SensorCard paramKey="humidity" value={airQuality?.humidity ?? 0} showStatus={false} />
        </div>
      </div>

      {/* Historical Chart */}
      <SensorChart />
    </div>
  );
}
